# Storage privado

Los archivos se almacenan en Supabase Storage y PostgreSQL conserva
identificador, ruta, entidad asociada, tipo, tamaño y auditoría.

Flujo:

1. Go autentica y autoriza usuario, entidad, acción, tipo y tamaño.
2. Go emite una URL firmada de corta duración.
3. El navegador carga directamente al objeto autorizado.
4. El navegador solicita confirmación a Go.
5. Go verifica el objeto y registra la asociación en PostgreSQL.
6. Go emite URLs firmadas de descarga cuando corresponda.

El frontend nunca recibe `SUPABASE_SERVICE_ROLE_KEY`. Una carga no confirmada
no aparece como archivo asociado. La caché offline de archivos se limita a lo
estrictamente necesario y se elimina junto con los datos privados de sesión.
