# Configuración del backend

El repositorio Go debe versionar `example.env` con nombres documentados y
valores ficticios. El archivo `.env` real se ignora y las claves de producción
se cargan desde el entorno o un gestor de secretos.

```env
APP_ENV=development
API_PORT=8080
DATABASE_URL=postgresql://user:password@db.example.supabase.co:5432/postgres
DATABASE_MAX_OPEN_CONNS=10
DATABASE_MAX_IDLE_CONNS=5
SUPABASE_URL=https://project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=replace-with-server-only-key
SUPABASE_STORAGE_BUCKET=private-service-files
RESEND_API_KEY=re_replace-with-private-key
RESEND_FROM_EMAIL=no-reply@example.com
SESSION_COOKIE_NAME=tech-service-session
SESSION_TTL=168h
PASSWORD_RESET_TTL=30m
CORS_ALLOWED_ORIGINS=http://localhost:3000
CSRF_TRUSTED_ORIGINS=http://localhost:3000
LOG_LEVEL=debug
GOOGLE_SHEETS_CREDENTIALS_JSON=replace-with-secret-manager-reference
GOOGLE_SHEETS_SPREADSHEET_ID=replace-with-spreadsheet-id
```

Nunca se usan secretos como variables públicas de Next.js.
