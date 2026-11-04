# Arquitectura del backend Go

## Responsabilidad

Go concentra autenticación, autorización, reglas de negocio, persistencia SQL,
auditoría, Storage e integraciones. Supabase PostgreSQL es la fuente oficial
de datos y Supabase Storage conserva los archivos binarios.

Next.js no ejecuta reglas de negocio, no consulta PostgreSQL y no recibe
credenciales privadas. Solo presenta la interfaz y consume `/api/v1`.

## Arquitectura hexagonal

```text
                 ┌─────────────────────────────┐
                 │        Adaptadores entrada  │
                 │ HTTP, middleware, DTOs      │
                 └──────────────┬──────────────┘
                                │
                 ┌──────────────▼──────────────┐
                 │       Aplicación             │
                 │ casos de uso y puertos       │
                 └──────────────┬──────────────┘
                                │
                 ┌──────────────▼──────────────┐
                 │         Dominio              │
                 │ entidades, reglas, errores   │
                 └──────────────┬──────────────┘
                                │
                 ┌──────────────▼──────────────┐
                 │    Puertos de salida         │
                 │ repositorios, correo, files │
                 └──────────────┬──────────────┘
                                │
       ┌────────────────────────┼────────────────────────┐
       ▼                        ▼                        ▼
 PostgreSQL/SQL          Supabase Storage             Resend/Sheets
```

## Estructura del repositorio

```text
cmd/api/
internal/
  domain/
  application/
  ports/inbound/
  ports/outbound/
  adapters/http/
  adapters/postgres/
  adapters/storage/
  adapters/resend/
  adapters/googlesheets/
  config/
  observability/
migrations/
tests/
example.env
```

El dominio no importa HTTP, SQL, Prisma, Supabase ni frameworks. Los casos de
uso dependen de interfaces; los adaptadores implementan esas interfaces.

## Persistencia

- SQL parametrizado con driver Go, sin ORM.
- Transacciones explícitas para operaciones atómicas.
- Migraciones SQL versionadas.
- Consultas paginadas y sin N+1.
- Autorización en Go; RLS solo es defensa adicional si se propaga identidad
  de forma explícita y verificable.
