// Shim for temporal-polyfill/full/global
// Provides minimal Temporal global for Prisma compatibility during migration
if (typeof globalThis.Temporal === "undefined") {
  (globalThis as any).Temporal = {
    Now: {
      instant: () => ({
        epochMilliseconds: Date.now(),
        toString: () => new Date().toISOString(),
      }),
    },
    Instant: {
      fromEpochMilliseconds: (ms: number) => ({
        epochMilliseconds: ms,
        toString: () => new Date(ms).toISOString(),
      }),
    },
  };
}
