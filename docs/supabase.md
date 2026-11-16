# Supabase y variables de entorno

HouseFinance usa **un único proyecto de Supabase**, en la región de **Frankfurt**. Se usa durante el desarrollo y es también el de producción: no hay Supabase local, ni staging, ni entornos de vista previa. Del proyecto se usan Postgres (los datos) y Supabase Auth (la sesión), y **solo la API habla con Supabase**: la web nunca lo conoce.

> **Regla de oro:** ningún valor real se sube al repositorio. Solo se versionan los `.env.example`, vacíos. Los valores reales viven en los secretos de GitHub Actions, en las variables de entorno de Vercel y en los `.env` de tu ordenador, que el `.gitignore` deja fuera.

## 1. Crear el proyecto

1. En [supabase.com/dashboard](https://supabase.com/dashboard), pulsa **New project**.
2. Nombre: `housefinance`. Región: **Central EU (Frankfurt)**.
3. Genera una **contraseña de la base de datos** y guárdala en un gestor de contraseñas. Hace falta para las cadenas de conexión y Supabase no la vuelve a mostrar (se puede restablecer en _Project Settings → Database_).

## 2. Desactivar el registro público

No hay registro de usuarios en la app: los usuarios se crean a mano (sección 5).

1. Entra en **Authentication → Sign In / Providers**.
2. Desmarca **Allow new users to sign up** y guarda.

Con esto, cualquier intento de registro a través de la API de Supabase Auth se rechaza, aunque alguien conozca la URL y la clave pública del proyecto.

## 3. Variables: de dónde sale cada una

| Variable                   | De dónde sale                                                                                 | Dónde va       |
| -------------------------- | --------------------------------------------------------------------------------------------- | -------------- |
| `SUPABASE_URL`             | _Project Settings → General_ (`https://<Reference ID>.supabase.co`) o el diálogo **Connect**  | Vercel (API)   |
| `SUPABASE_PUBLISHABLE_KEY` | _Project Settings → API Keys_, pestaña _Publishable and secret API keys_ (`sb_publishable_…`) | Vercel (API)   |
| `SUPABASE_SECRET_KEY`      | La misma pestaña (`sb_secret_…`, se ve con el icono del ojo)                                  | Vercel (API)   |
| `DATABASE_URL`             | **Connect → Transaction pooler** (puerto 6543), con la contraseña de la base de datos         | Vercel (API)   |
| `MIGRATIONS_DATABASE_URL`  | **Connect → Session pooler** (puerto 5432), con la contraseña de la base de datos             | GitHub Actions |
| `CRON_SECRET`              | Lo generas tú: `openssl rand -hex 32`                                                         | Vercel (API)   |
| `WEB_ORIGIN`               | URL de producción de la web en Vercel, sin barra final                                        | Vercel (API)   |
| `NEXT_PUBLIC_API_BASE_URL` | URL de producción de la API en Vercel, sin barra final                                        | Vercel (web)   |

Notas:

- Si en _API Keys_ aparece un botón **Create new API keys**, el proyecto solo tiene las claves antiguas (`anon` y `service_role`). Crear las nuevas es seguro: se añaden junto a las antiguas.
- **`SUPABASE_SECRET_KEY` da acceso total al proyecto.** Solo vive en el servidor y nunca lleva el prefijo `NEXT_PUBLIC_`. Si se filtra, crea una nueva en _API Keys_, cámbiala donde se use y borra la comprometida.
- **Dos cadenas de conexión, dos usos:**
  - `DATABASE_URL` usa el _Transaction pooler_, pensado para las muchas conexiones cortas de las funciones serverless de Vercel.
  - `MIGRATIONS_DATABASE_URL` usa el _Session pooler_, para las migraciones de `drizzle-kit`. La conexión directa (`db.<ref>.supabase.co`) solo funciona por IPv6, y GitHub Actions y Vercel solo tienen IPv4.

## 4. Dónde se cargan

### GitHub Actions

Solo los secretos que usan sus workflows. Hoy, únicamente `MIGRATIONS_DATABASE_URL` (lo usará el despliegue de F0-13 para aplicar las migraciones antes de desplegar). Las pruebas de integración de la CI usan un Postgres temporal del propio job y no necesitan secretos.

1. Repositorio → **Settings → Secrets and variables → Actions**.
2. **New repository secret**: nombre exacto y valor.

### Vercel

Se cargan al crear los dos proyectos de Vercel (F0-13).

1. Proyecto → **Settings → Environment Variables**.
2. Nombre exacto, valor y solo el entorno **Production** (no hay vistas previas).
   - Proyecto de la API: `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `DATABASE_URL`, `CRON_SECRET` y `WEB_ORIGIN`.
   - Proyecto de la web: `NEXT_PUBLIC_API_BASE_URL`.

### En tu ordenador

```sh
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

Rellena los `.env` con los mismos valores. En local, `WEB_ORIGIN` es `http://localhost:3000` y `NEXT_PUBLIC_API_BASE_URL` es la URL local de la API.

## 5. Crear un usuario a mano

No hay registro público, así que cada usuario se crea desde el panel de Supabase:

1. Entra en **Authentication → Users**.
2. Pulsa **Add user → Create new user**.
3. Escribe el correo y una contraseña, y marca **Auto Confirm User** para que pueda entrar sin confirmar el correo.
4. Pulsa **Create user**.

El usuario ya puede iniciar sesión en la app con ese correo y esa contraseña. Su id (UUID) es el `user_id` de todos sus datos; no hay tabla propia de usuarios.

Para quitar el acceso a alguien, bórralo en la misma lista (menú `⋯` del usuario → **Delete user**).

> En la fase 1 (F1-01) se añadirá además un script documentado para crear usuarios desde la terminal.

## 6. Comprobar el registro desactivado

Con la URL y la clave pública (no son secretas), un intento de registro debe ser rechazado:

```sh
curl -s -X POST "$SUPABASE_URL/auth/v1/signup" \
  -H "apikey: $SUPABASE_PUBLISHABLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email":"prueba@example.com","password":"Prueba-1234"}'
```

La respuesta debe ser un error que indique que el registro está desactivado (`signup_disabled`), y no aparecer ningún usuario nuevo en _Authentication → Users_.
