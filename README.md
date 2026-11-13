# HouseFinance · Finanzas del hogar

App móvil-first para consolidar a mano las finanzas del hogar: créditos, servicios, préstamos a terceros, tarjetas, recibos, pagos, cobros e ingresos. Su objetivo es saber cada mes qué toca pagar, qué está atrasado y cómo va el balance.

> **Estado:** en desarrollo del MVP. El código llegará fase a fase siguiendo el plan de implementación.

## Qué hace el MVP

- **Obligaciones:** créditos, servicios, préstamos por cobrar y tarjetas de crédito, con su periodicidad y su día de vencimiento.
- **Recibos:** se generan solos cada mes. Se pagan o se cobran con su capital e intereses, y el pago se puede anular.
- **Aportes y ajustes:** pagos extra a capital y ajuste de lo dispuesto en la tarjeta.
- **Ingresos:** salario, regalos y otros ingresos del mes.
- **Actores:** personas, bancos y empresas que participan en cada registro.
- **Inicio y Hoy:** el balance del mes, la agenda de pagos, lo atrasado y el aviso para registrar el ingreso fijo.

## Stack

| Pieza | Tecnología |
|---|---|
| Monorepo | pnpm + Turborepo |
| Web | Next.js 16 (App Router), Tailwind CSS, shadcn/ui, next-intl, TanStack Query |
| API | Hono con `@hono/zod-openapi` (OpenAPI 3.1) |
| Datos | Supabase (Postgres y Auth, Frankfurt) con Drizzle ORM |
| Despliegue | Vercel (web, API y cron) |
| Calidad | TypeScript estricto, ESLint, Prettier, Vitest, Playwright y GitHub Actions |

La arquitectura sigue **Clean Architecture** y **SOLID**: el dominio no depende de nada y las dependencias apuntan siempre hacia dentro.

```
apps/
  web/            Presentación (Next.js): solo conoce contracts y ui
  api/            Entrada HTTP (Hono) y composición
packages/
  domain/         Entidades, objetos de valor y reglas de negocio
  application/    Casos de uso y puertos
  db/             Esquema Drizzle, migraciones y repositorios
  contracts/      Esquemas Zod de la API y cliente tipado
  ui/             Componentes y tokens de diseño
  config/         tsconfig, ESLint y Prettier compartidos
```

## Convenciones

- **Idioma:** el código, los contratos, los campos y los valores van en inglés; la documentación y los temas funcionales, en español.
- **Dinero** en céntimos enteros y **fechas** sin zona horaria (`YYYY-MM-DD`).
- **La API nunca devuelve textos**, solo códigos de error. La web los traduce con next-intl.

## Ramas y versiones

| Rama | Uso | Se integra en |
|---|---|---|
| `main` | Fases completas; es lo que se despliega | — |
| `feature/F<n>` | Una por fase del plan (`feature/F3`) | `main` |
| `feature/F<n>-US<nn>` | Una por historia o tarea del backlog (`feature/F3-US09`) | `feature/F<n>` |

- Todo entra por pull request, con la CI en verde y fusión *merge commit*. No se hace push directo a `main` ni a las ramas de fase.
- Los elementos de una fase se desarrollan de uno en uno y en el orden del backlog.
- Al integrar cada fase se etiqueta `main`: de `v0.1.0` (fase 0) a `v0.8.0` (fase 7). La fase 8 cierra el MVP con la **`v1.0.0`**.

| Fase | Módulo | Versión |
|---|---|---|
| 0 | Cimientos | v0.1.0 |
| 1 | Sesión | v0.2.0 |
| 2 | Actores | v0.3.0 |
| 3 | Obligaciones | v0.4.0 |
| 4 | Recibos, pagos, cobros y job diario | v0.5.0 |
| 5 | Aportes y ajustes | v0.6.0 |
| 6 | Ingresos | v0.7.0 |
| 7 | Inicio, Hoy y avisos | v0.8.0 |
| 8 | Cierre del MVP | **v1.0.0** |

## Puesta en marcha

Se completará en la tarea F0-19, cuando exista el monorepo: requisitos, instalación, variables de entorno y comandos.

## Seguridad

Los secretos (claves de Supabase, `CRON_SECRET`…) **nunca** se suben al repositorio. Se guardan en los secretos de GitHub Actions y en las variables de entorno de Vercel. Cada app tendrá un `.env.example` sin valores reales.
