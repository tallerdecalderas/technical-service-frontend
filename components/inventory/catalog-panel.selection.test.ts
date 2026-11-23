import assert from "node:assert/strict";
import test from "node:test";
import { findCatalogItemForCompany } from "./catalog-panel.selection";

const items = [
  {
    id: "item-1",
    companyId: "company-1",
    companyName: "Taller Norte",
    code: "V-1",
    name: "Válvula",
    techPrice: "100.00",
    updatedAt: "2026-04-15T12:00:00Z",
  },
];

test("catalog selection is cleared when its item belongs to the previous company", () => {
  assert.equal(
    findCatalogItemForCompany(items, "item-1", "company-2"),
    undefined,
  );
});

test("catalog selection remains available for the selected company", () => {
  assert.equal(
    findCatalogItemForCompany(items, "item-1", "company-1"),
    items[0],
  );
});
