// Implementaciones en memoria de los puertos, solo para pruebas.
// Punto de entrada propio (@hf/application/testing): ESLint solo deja importarlo desde *.test.ts.
export {
  FAKE_ACCESS_TOKEN_TTL_SECONDS,
  FakeAuthService,
  type FakeAuthUser,
} from './FakeAuthService.js';
export { FixedClock } from './FixedClock.js';
export { InMemoryUnitOfWork } from './InMemoryUnitOfWork.js';
export { NoHolidaysCalendar } from './NoHolidaysCalendar.js';
