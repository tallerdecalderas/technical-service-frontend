# Migración de Next.js al backend Go

## Control por fase

`[ ]` pendiente, `[~]` en migración, `[x]` Go verificado, frontend cambiado y
handler legado retirado.

Cada fila exige: caso de uso y pruebas Go, cambio de cliente Next/PWA,
verificación por rol y retiro del código equivalente.

## Rutas heredadas

| Estado | Ruta Next.js | Servicio actual | Ruta Go |
|---|---|---|---|
| [ ] | `POST /api/auth/login` | `lib/auth.ts` | `POST /api/v1/auth/login` |
| [ ] | `POST /api/auth/logout` | `lib/auth.ts` | `POST /api/v1/auth/logout` |
| [ ] | `GET /api/auth/me` | `lib/auth.ts` | `GET /api/v1/auth/session` |
| [ ] | `GET/POST /api/clients` | `client.service.ts` | `GET/POST /api/v1/clients` |
| [ ] | `GET/PUT/DELETE /api/clients/{id}` | `client.service.ts` | `GET/PATCH/DELETE /api/v1/clients/{id}` |
| [ ] | `GET/POST /api/technicians` | `technician.service.ts` | `GET/POST /api/v1/technicians` |
| [ ] | `PUT/DELETE /api/technicians/{id}` | `technician.service.ts` | `PATCH/DELETE /api/v1/technicians/{id}` |
| [ ] | `GET/POST /api/services` | `service.service.ts` | `GET/POST /api/v1/services` |
| [ ] | `GET/PUT/DELETE /api/services/{id}` | `service.service.ts` | `GET/PATCH /api/v1/services/{id}` |
| [ ] | `PATCH /api/services/{id}/status` | `service.service.ts` | `POST /api/v1/services/{id}/status` |
| [ ] | `POST /api/services/{id}/finish` | `service.service.ts` | `POST /api/v1/services/{id}/finish` |
| [ ] | `GET /api/services/{id}/history` | `activity-log.service.ts` | `GET /api/v1/services/{id}/history` |
| [ ] | `GET/POST /api/payments` | `payment.service.ts` | `GET/POST /api/v1/payments` |
| [ ] | `GET/PATCH /api/payments/{id}` | `payment.service.ts` | `GET/PATCH /api/v1/payments/{id}` |
| [ ] | `GET/POST /api/payments/{id}/items` | `payment-part.service.ts` | `GET/POST /api/v1/payments/{id}/parts` |
| [ ] | `GET/POST /api/estimates` | `estimate.service.ts` | `GET/POST /api/v1/estimates` |
| [ ] | `GET/PATCH /api/estimates/{id}` | `estimate.service.ts` | `GET/POST /api/v1/estimates/{id}` |
| [ ] | `POST /api/integrations/whatsapp/log` | integración/auditoría | `POST /api/v1/integrations/whatsapp/log` |
| [ ] | `POST /api/upload` | upload actual | `/api/v1/storage/*` |

## Capacidades nuevas o sin handler equivalente

| Estado | Capacidad | Ruta Go |
|---|---|---|
| [ ] | Agenda | `GET /api/v1/schedule` |
| [ ] | Proveedores | `GET/POST /api/v1/suppliers`, `PATCH/DELETE /{id}` |
| [ ] | Rendiciones | `GET/POST /api/v1/settlements`, `POST /{id}/liquidate` |
| [ ] | Catálogo versionado | `GET /api/v1/catalog/prices` |
| [ ] | Importación de precios | `POST /api/v1/integrations/google-sheets/catalog-import` |
| [ ] | Exportación de agenda | `POST /api/v1/integrations/google-sheets/schedule-sync` |

## Orden de trabajo

1. Contrato y reglas pendientes.
2. Base hexagonal, SQL y configuración.
3. Autenticación y autorización.
4. Clientes, técnicos, servicios, agenda e historial.
5. Cobros, repuestos y presupuestos.
6. Rendiciones, inventario e integraciones.
7. Storage.
8. Cliente HTTP Next/PWA y retiro final de Prisma/handlers.
