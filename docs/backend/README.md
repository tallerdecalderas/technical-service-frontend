# Documentación del backend Go

Esta carpeta contiene la documentación que se trasladará al repositorio
independiente del backend Go. El backend será la única API de negocio de
TechService; Next.js quedará como frontend y cliente HTTP.

## Documentos

- [Arquitectura hexagonal](./architecture.md)
- [Contrato HTTP](./api.md)
- [Matriz de migración](./migration.md)
- [Caché mínima y offline](./cache.md)
- [Storage](./storage.md)
- [Integraciones](./integrations.md)
- [Configuración y `example.env`](./configuration.md)

## Estado

La documentación define la arquitectura objetivo y el plan de migración. El
backend Go todavía no está implementado. Las rutas heredadas de Next.js se
mantienen hasta que su reemplazo Go esté probado y el frontend haya cambiado
su consumo.

## Regla de migración

Para cada capacidad:

1. Implementar dominio, caso de uso, adaptadores y pruebas en Go.
2. Cambiar Next.js/PWA para consumir la API Go.
3. Verificar permisos, validaciones, transiciones y datos.
4. Retirar el Route Handler y la lógica equivalente de Next.js.

No se mantienen dos fuentes activas de escritura para una capacidad ya
migrada.
