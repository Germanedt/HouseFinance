// Enumeraciones de Postgres con los valores del glosario (`claude/contratos-api.md`, pasos 0, 2.1 y 4).
// Los valores van en snake_case y en inglés; nunca se reordenan ni se renombran sin una migración.
import { pgEnum } from 'drizzle-orm/pg-core';

export const actorTypeEnum = pgEnum('actor_type', ['person', 'bank', 'company', 'other']);

export const obligationTypeEnum = pgEnum('obligation_type', [
  'loan',
  'service',
  'receivable',
  'credit_card',
]);

export const obligationStatusEnum = pgEnum('obligation_status', [
  'pending_confirmation',
  'active',
  'closed',
  'cancelled',
]);

export const frequencyEnum = pgEnum('frequency', [
  'monthly',
  'bimonthly',
  'quarterly',
  'semiannual',
  'annual',
  'one_time',
]);

export const dueDayRuleEnum = pgEnum('due_day_rule', [
  'first_business_day',
  'last_business_day',
  'fixed_day',
]);

export const billDirectionEnum = pgEnum('bill_direction', ['payable', 'receivable']);

/** `overdue` no se guarda: se calcula al leer (`claude/contratos-api.md`, paso 4.10). */
export const billStatusEnum = pgEnum('bill_status', ['pending', 'paid', 'collected']);

export const movementTypeEnum = pgEnum('movement_type', ['extra_payment', 'balance_adjustment']);

export const incomeTypeEnum = pgEnum('income_type', ['salary', 'gift', 'donation', 'other']);

export const noticeTypeEnum = pgEnum('notice_type', ['register_fixed_income']);
