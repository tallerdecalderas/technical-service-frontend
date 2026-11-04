# Contrato HTTP del backend Go

## Convenciones

- Prefijo: `/api/v1`.
- HTTPS y JSON UTF-8.
- Fechas ISO 8601 con zona horaria.
- Importes decimales sin pérdida de precisión.
- Listas paginadas y filtros permitidos por recurso.
- Operaciones reintentables con `Idempotency-Key`.
- Go valida siempre sesión, rol, propiedad y transición.

Respuesta correcta:

```json
{"data": {}, "meta": {}}
```

Error:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Revisá los datos enviados.",
    "details": [],
    "requestId": "..."
  }
}
```

## Endpoints objetivo

| Módulo | Operaciones |
|---|---|
| Auth | `POST /auth/login`, `POST /auth/logout`, `GET /auth/session`, `POST /auth/password/forgot`, `POST /auth/password/reset` |
| Clientes | `GET/POST /clients`, `GET/PATCH /clients/{id}` |
| Técnicos | `GET/POST /technicians`, `GET/PATCH /technicians/{id}` |
| Servicios | `GET/POST /services`, `GET/PATCH /services/{id}`, `POST /services/{id}/status`, `POST /services/{id}/finish` |
| Agenda | `GET /schedule` |
| Historial | `GET /services/{id}/history` |
| Cobros | `GET/POST /payments`, `GET/PATCH /payments/{id}` |
| Repuestos | `GET/POST /payments/{id}/parts`, `PATCH/DELETE /payments/{id}/parts/{partId}` |
| Presupuestos | `GET/POST /estimates`, `GET /estimates/{id}`, `POST /estimates/{id}/finalize` |
| Rendiciones | `GET/POST /settlements`, `GET /settlements/{id}`, `POST /settlements/{id}/liquidate` |
| Catálogo | `GET /catalog/prices` |
| Storage | `POST /storage/signed-url`, `POST /storage/objects/{id}/confirm`, `GET /storage/objects/{id}/download-url` |
| Integraciones | `POST /integrations/google-sheets/catalog-import`, `POST /integrations/google-sheets/schedule-sync`, `GET /integrations/status`, `POST /integrations/whatsapp/log` |

## Códigos

`200` correcto, `201` creado, `204` sin contenido, `400` entrada inválida,
`401` sin sesión, `403` sin permiso, `404` no visible/inexistente, `409`
conflicto, `422` regla de dominio, `429` límite, `500` interno y `502`
dependencia externa.

## Seguridad

No devolver contraseñas, tokens, secretos, SQL ni trazas. La recuperación de
contraseña no revela si un email existe. Las claves privadas de Supabase,
Resend y Google permanecen server-side.
