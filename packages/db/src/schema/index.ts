// Esquema completo de la base de datos: drizzle-kit genera las migraciones a partir de aquí.
// Cada fase añade sus tablas (`<tabla>.table.ts`) y las exporta en este archivo.
export {
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
export { jobRunsTable } from './jobRuns.table.js';
