/* ─── DTOs de transporte para Rendiciones (Settlements) ─────────────────── */

/** Respuesta del endpoint GET /api/v1/settlements (listado) */
export interface SettlementDto {
  id: string;
  technicianId: string;
  technicianName: string;
  companyId: string | null;
  companyName: string | null;
  startDate: string;
  endDate: string;
  label: string | null;
  status: string;
  companyRate: string;
  technicianRate: string;
  servicesCount: number;
  totalCollected: string;
  totalDebt: string;
  totalPartsCost: string;
  totalPartsSale: string;
  totalExpenses: string;
  totalInsurance: string;
  totalOther: string;
  totalDiscounts: string;
  totalAdvances: string;
  commissionBase: string;
  techCommission: string;
  compCommission: string;
  techBalance: string;
  liquidatedAt: string | null;
  liquidatedById: string | null;
  createdById: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Respuesta del endpoint GET /api/v1/settlements (paginated) */
export interface SettlementListResponse {
  settlements: SettlementDto[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

/** Respuesta del endpoint GET /api/v1/settlements/{id} (detalle) */
export interface SettlementDetailResponse {
  settlement: SettlementDto & {
    items: SettlementItemDto[];
    parts: SettlementPartDto[];
    expenses: SettlementExpenseDto[];
    adjustments: SettlementAdjustmentDto[];
  };
}

/** Ítem de servicio dentro de una rendición */
export interface SettlementItemDto {
  id: string;
  serviceId: string;
  orderNumber: string;
  clientName: string;
  paymentId: string | null;
  serviceAmount: string;
  collectedAmount: string;
  debtAmount: string;
  partsCostAmount: string;
  partsSaleAmount: string;
  expensesAmount: string;
  commissionBase: string;
  commissionRate: string;
  technicianAmount: string;
  companyAmount: string;
}

/** Repuesto dentro de una rendición */
export interface SettlementPartDto {
  id: string;
  serviceId: string;
  orderNumber: string;
  companyId: string | null;
  providerName: string | null;
  name: string;
  quantity: string;
  unitCost: string;
  totalCost: string;
  unitSalePrice: string;
  totalSalePrice: string;
  costUsd: string | null;
  exchangeRate: string | null;
}

/** Gasto dentro de una rendición */
export interface SettlementExpenseDto {
  id: string;
  serviceId: string;
  orderNumber: string;
  expenseId: string | null;
  concept: string;
  amount: string;
  currency: string;
  amountArs: string;
}

/** Ajuste dentro de una rendición */
export interface SettlementAdjustmentDto {
  id: string;
  kind: string;
  concept: string;
  amount: string;
}

/** Body para POST /api/v1/settlements (generar) */
export interface CreateSettlementDto {
  technicianId: string;
  companyId: string | null;
  startDate: string;
  endDate: string;
  label: string | null;
  companyRate: string;
  insurance: Array<{ kind: string; concept: string; amount: string }>;
  adjustments: Array<{ kind: string; concept: string; amount: string }>;
}

/** Body para PATCH /api/v1/settlements/{id} (editar) */
export interface UpdateSettlementDto {
  label?: string | null;
  companyRate?: string | null;
  insurance?: Array<{ kind: string; concept: string; amount: string }> | null;
  adjustments?: Array<{ kind: string; concept: string; amount: string }> | null;
}
