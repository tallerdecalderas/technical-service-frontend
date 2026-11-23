import assert from "node:assert/strict";
import test from "node:test";

import { toTechnicianPriceItem } from "./technician-price.service";

test("technician price projection excludes administration-only values", () => {
  const result = toTechnicianPriceItem({
    id: "item-1",
    companyId: "company-1",
    companyName: "Taller",
    code: "V-1",
    name: "Válvula",
    unit: "unidad",
    techPrice: "12500.00",
    costPrice: "8000.00",
    sellPrice: "10000.00",
    costInitList: "7000.00",
    marginPercent: "25.00",
    isActive: true,
    updatedAt: "2026-04-15T12:00:00Z",
  });

  assert.deepEqual(result, {
    id: "item-1",
    code: "V-1",
    name: "Válvula",
    unit: "unidad",
    techPrice: "12500.00",
  });
});
