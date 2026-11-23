import assert from "node:assert/strict";
import test from "node:test";

process.env.NEXT_PUBLIC_API_URL ??= "http://localhost:8080";

const helpers = import("./api-client");

test("unwrapList normalizes a collection contract", async () => {
  const { unwrapList } = await helpers;
  const result = unwrapList({
    success: true,
    data: [{ id: "payment-1" }],
    meta: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
  });

  assert.deepEqual(result.data, [{ id: "payment-1" }]);
  assert.equal(result.meta.total, 1);
});

test("unwrapData returns a direct detail object", async () => {
  const { unwrapData } = await helpers;
  const result = unwrapData({
    success: true,
    data: { id: "payment-1" },
  });

  assert.deepEqual(result, { id: "payment-1" });
});

test("unwrapList rejects missing data", async () => {
  const { unwrapList } = await helpers;
  assert.throws(
    () =>
      unwrapList({
        success: true,
        meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
      }),
    /Missing data/,
  );
});

test("unwrapList rejects missing pagination meta", async () => {
  const { unwrapList } = await helpers;
  assert.throws(
    () => unwrapList({ success: true, data: [] }),
    /Missing meta/,
  );
});

test("unwrapData rejects unsuccessful responses", async () => {
  const { unwrapData } = await helpers;
  assert.throws(
    () =>
      unwrapData({
        success: false,
        error: { code: "FORBIDDEN", message: "Sin permisos" },
      }),
    /Sin permisos/,
  );
});
