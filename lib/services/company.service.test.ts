import assert from "node:assert/strict";
import test from "node:test";

process.env.NEXT_PUBLIC_API_URL ??= "http://localhost:8080";

const servicePromise = import("./company.service");
const originalFetch = globalThis.fetch;

test("listAuthorizedCompanies reads the authenticated company summaries from Go", async () => {
  let requestUrl: URL | undefined;
  globalThis.fetch = async (input) => {
    requestUrl = new URL(String(input));
    return new Response(
      JSON.stringify({
        data: [
          { id: "company-1", name: "Calderas Norte" },
          { id: "company-2", name: "Calderas Sur" },
        ],
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  };

  try {
    const { listAuthorizedCompanies } = await servicePromise;
    const result = await listAuthorizedCompanies();

    assert.equal(requestUrl?.pathname, "/api/v1/companies");
    assert.deepEqual(result, [
      { id: "company-1", name: "Calderas Norte" },
      { id: "company-2", name: "Calderas Sur" },
    ]);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
