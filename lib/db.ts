/**
 * Prisma compatibility shim during migration to Go API.
 * Business data access now goes through lib/services/*.service.ts which uses apiClient.
 * This module is kept only for API route handlers that haven't been migrated yet.
 */

// Minimal stub that throws when Prisma ORM is used directly.
// Pages and services should use lib/services/*.service.ts instead.

const orm = new Proxy({}, {
  get(_target, prop: string) {
    return new Proxy({}, {
      get(_t2, method: string) {
        return (..._args: any[]) => {
          throw new Error(
            `Prisma ORM (db.orm.${prop}.${method}) is deprecated. ` +
            "Use lib/services/*.service.ts which calls the Go API instead."
          );
        };
      },
    });
  },
});

export { orm };
export const db = { orm };
export const prisma = db;
