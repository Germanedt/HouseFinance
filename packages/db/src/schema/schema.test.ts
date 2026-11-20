import { PgDialect, getTableConfig, pgTable } from 'drizzle-orm/pg-core';
import { describe, expect, it } from 'vitest';
import {
  calendarDateColumn,
  deletedAtColumn,
  idColumn,
  moneyColumn,
  nonNegativeMoneyCheck,
  timestampColumns,
  userIdColumn,
  voidedAtColumn,
} from './columns.js';
import {
  actorTypeEnum,
  billDirectionEnum,
  billStatusEnum,
  dueDayRuleEnum,
  frequencyEnum,
  incomeTypeEnum,
  movementTypeEnum,
  noticeTypeEnum,
  obligationStatusEnum,
  obligationTypeEnum,
} from './enums.js';
import { jobRunsTable } from './jobRuns.table.js';

describe('enums', () => {
  it.each([
    [actorTypeEnum, 'actor_type', ['person', 'bank', 'company', 'other']],
    [obligationTypeEnum, 'obligation_type', ['loan', 'service', 'receivable', 'credit_card']],
    [
      obligationStatusEnum,
      'obligation_status',
      ['pending_confirmation', 'active', 'closed', 'cancelled'],
    ],
    [
      frequencyEnum,
      'frequency',
      ['monthly', 'bimonthly', 'quarterly', 'semiannual', 'annual', 'one_time'],
    ],
    [dueDayRuleEnum, 'due_day_rule', ['first_business_day', 'last_business_day', 'fixed_day']],
    [billDirectionEnum, 'bill_direction', ['payable', 'receivable']],
    [billStatusEnum, 'bill_status', ['pending', 'paid', 'collected']],
    [movementTypeEnum, 'movement_type', ['extra_payment', 'balance_adjustment']],
    [incomeTypeEnum, 'income_type', ['salary', 'gift', 'donation', 'other']],
    [noticeTypeEnum, 'notice_type', ['register_fixed_income']],
  ])('%#: defines %s with the glossary values', (enumType, name, values) => {
    expect(enumType.enumName).toBe(name);
    expect(enumType.enumValues).toEqual(values);
  });

  it('never stores overdue: it is computed when reading', () => {
    expect(billStatusEnum.enumValues).not.toContain('overdue');
  });
});

// Tabla de ejemplo, solo para las pruebas: cada fase usará estas columnas en sus tablas.
const sampleTable = pgTable(
  'samples',
  {
    id: idColumn(),
    userId: userIdColumn(),
    amountCents: moneyColumn('amount_cents').notNull(),
    dueDate: calendarDateColumn('due_date').notNull(),
    ...timestampColumns(),
    deletedAt: deletedAtColumn(),
    voidedAt: voidedAtColumn(),
  },
  (table) => [nonNegativeMoneyCheck('samples', table.amountCents)],
);

describe('common columns', () => {
  const config = getTableConfig(sampleTable);
  const columns = Object.fromEntries(config.columns.map((column) => [column.name, column]));

  it.each([
    ['id', 'uuid', true, true],
    ['user_id', 'uuid', true, false],
    ['amount_cents', 'bigint', true, false],
    ['due_date', 'date', true, false],
    ['created_at', 'timestamp with time zone', true, true],
    ['updated_at', 'timestamp with time zone', true, true],
    ['deleted_at', 'timestamp with time zone', false, false],
    ['voided_at', 'timestamp with time zone', false, false],
  ])('%s is %s (not null: %s, default: %s)', (name, sqlType, notNull, hasDefault) => {
    const column = columns[name];
    expect(column?.getSQLType()).toBe(sqlType);
    expect(column?.notNull).toBe(notNull);
    expect(column?.hasDefault).toBe(hasDefault);
  });

  it('uses id as the primary key', () => {
    expect(columns['id']?.primary).toBe(true);
  });

  it('reads money as an integer number and dates as YYYY-MM-DD text', () => {
    expect(columns['amount_cents']?.dataType).toBe('number');
    expect(columns['due_date']?.dataType).toBe('string');
  });

  it('refreshes updated_at on every update', () => {
    const updatedAt = columns['updated_at']?.onUpdateFn?.();
    expect(updatedAt).toBeInstanceOf(Date);
  });

  it('adds a named CHECK (>= 0) for money', () => {
    const [moneyCheck] = config.checks;
    expect(moneyCheck?.name).toBe('samples_amount_cents_non_negative');
    expect(new PgDialect().sqlToQuery(moneyCheck?.value ?? sqlFallback()).sql).toBe(
      '"samples"."amount_cents" >= 0',
    );
  });
});

describe('job_runs', () => {
  const config = getTableConfig(jobRunsTable);

  it('belongs to no user and depends on no module', () => {
    expect(config.columns.map((column) => column.name)).toEqual([
      'id',
      'job',
      'run_date',
      'started_at',
      'finished_at',
      'result',
    ]);
    expect(config.foreignKeys).toEqual([]);
  });

  it('allows one run per job and day', () => {
    const [unique] = config.indexes;
    expect(unique?.config.name).toBe('job_runs_job_run_date_unique');
    expect(unique?.config.unique).toBe(true);
  });

  it('has row level security enabled, so the Supabase Data API cannot read it', () => {
    expect(config.enableRLS).toBe(true);
  });
});

function sqlFallback(): never {
  throw new Error('Expected a CHECK constraint');
}
