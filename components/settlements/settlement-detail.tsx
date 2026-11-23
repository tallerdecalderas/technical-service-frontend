"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatCurrency } from "@/lib/utils";
import {
  Clock,
  Building2,
  User,
  Package,
  CreditCard,
  Loader2,
  AlertCircle,
  CheckCircle,
  MoreHorizontal,
} from "lucide-react";
import type { Settlement } from "@/types";
import { apiClient } from "@/lib/api-client";

interface SettlementDetailProps {
  settlement: Settlement;
  onLiquidate: (id: string) => Promise<void>;
  onUpdate: (id: string, data: {
    label?: string | null;
    companyRate?: string | null;
  }) => Promise<void>;
  isAdmin: boolean;
  loading: boolean;
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendiente",
  LIQUIDATED: "Liquidada",
};

const STATUS_VARIANT: Record<string, string> = {
  PENDING: "warning",
  LIQUIDATED: "success",
};

export function SettlementDetail({
  settlement,
  onLiquidate,
  onUpdate,
  isAdmin,
  loading,
}: SettlementDetailProps) {
  const isLiquidated = settlement.status === "LIQUIDATED";
  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState(settlement.label || "");
  const [companyRate, setCompanyRate] = useState(settlement.companyRate || "");
  const [liquidating, setLiquidating] = useState(false);

  const handleSave = async () => {
    await onUpdate(settlement.id, {
      label: label || null,
      companyRate: companyRate || undefined,
    });
    setEditing(false);
  };

  const handleLiquidate = async () => {
    setLiquidating(true);
    try {
      await onLiquidate(settlement.id);
    } finally {
      setLiquidating(false);
    }
  };

  const totalItems = settlement.items?.length || 0;
  const totalParts = settlement.parts?.length || 0;
  const totalExpenses = settlement.expenses?.length || 0;
  const totalAdjustments = settlement.adjustments?.length || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Rendición #{settlement.id.slice(0, 8)}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={STATUS_VARIANT[settlement.status]}>
              {STATUS_LABELS[settlement.status] || settlement.status}
            </Badge>
            {isAdmin && !isLiquidated && !loading && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleLiquidate}
                disabled={liquidating}
                className="flex items-center gap-2"
              >
                {liquidating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                Liquidar
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-muted/50 p-3 rounded-lg">
              <p className="text-xs text-muted-foreground">Técnico</p>
              <p className="font-medium">{settlement.technicianName}</p>
            </div>
            <div className="bg-muted/50 p-3 rounded-lg">
              <p className="text-xs text-muted-foreground">Empresa</p>
              <p className="font-medium">
                {settlement.companyName || "—"}
              </p>
            </div>
            <div className="bg-muted/50 p-3 rounded-lg">
              <p className="text-xs text-muted-foreground">Período</p>
              <p className="font-medium">
                {formatDate(settlement.startDate)} al{" "}
                {formatDate(settlement.endDate)}
              </p>
            </div>
            <div className="bg-muted/50 p-3 rounded-lg">
              <p className="text-xs text-muted-foreground">Estado</p>
              <p className="font-medium">
                {STATUS_LABELS[settlement.status] || settlement.status}
              </p>
            </div>
          </div>

          {settlement.label && (
            <div className="bg-muted/50 p-3 rounded-lg">
              <p className="text-xs text-muted-foreground">Etiqueta</p>
              <p className="font-medium">{settlement.label}</p>
            </div>
          )}

          {/* Edición rápida (solo ADMIN y PENDING) */}
          {isAdmin && !isLiquidated && (
            <div className="flex items-center gap-4 pt-2 border-t">
              <div className="flex items-center gap-2">
                <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Editar:</span>
              </div>
              {editing ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    placeholder="Etiqueta"
                    className="w-[200px] text-sm"
                  />
                  <Input
                    value={companyRate}
                    onChange={(e) => setCompanyRate(e.target.value)}
                    type="number"
                    step="0.01"
                    placeholder="Tasa empresa"
                    className="w-[140px] text-sm"
                  />
                  <Button size="sm" onClick={handleSave}>Guardar</Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditing(false)}
                  >
                    Cancelar
                  </Button>
                </div>
              ) : (
                <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>
                  Editar datos
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Totales */}
      <Card>
        <CardHeader>
          <CardTitle>Totales (cálculos oficiales de Go)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground">Cobrado</p>
              <p className="font-semibold text-emerald-600">
                {formatCurrency(Number(settlement.totalCollected || 0))}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground">Deuda</p>
              <p className="font-semibold text-red-600">
                {formatCurrency(Number(settlement.totalDebt || 0))}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground">Repuestos (costo)</p>
              <p className="font-semibold">
                {formatCurrency(Number(settlement.totalPartsCost || 0))}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground">Balance técnico</p>
              <p className={`font-semibold ${
                Number(settlement.techBalance || 0) >= 0
                  ? "text-emerald-600"
                  : "text-red-600"
              }`}>
                {formatCurrency(Number(settlement.techBalance || 0))}
              </p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground">Comisión técnica</p>
              <p className="font-semibold">
                {formatCurrency(Number(settlement.techCommission || 0))}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground">Comisión empresa</p>
              <p className="font-semibold">
                {formatCurrency(Number(settlement.compCommission || 0))}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground">Gastos</p>
              <p className="font-semibold">
                {formatCurrency(Number(settlement.totalExpenses || 0))}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground">Aseguradoras</p>
              <p className="font-semibold">
                {formatCurrency(Number(settlement.totalInsurance || 0))}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Items (Servicios) */}
      {totalItems > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Servicios ({totalItems})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Orden</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead className="text-right">Cobrado</TableHead>
                    <TableHead className="text-right">Deuda</TableHead>
                    <TableHead className="text-right">Costo repuestos</TableHead>
                    <TableHead className="text-right">Gastos</TableHead>
                    <TableHead className="text-right">Técnico</TableHead>
                    <TableHead className="text-right">Empresa</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {settlement.items?.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="text-sm">
                        {item.orderNumber}
                      </TableCell>
                      <TableCell className="text-sm">
                        {item.clientName}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {formatCurrency(Number(item.collectedAmount || 0))}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {formatCurrency(Number(item.debtAmount || 0))}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {formatCurrency(Number(item.partsCostAmount || 0))}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {formatCurrency(Number(item.expensesAmount || 0))}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {formatCurrency(Number(item.technicianAmount || 0))}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {formatCurrency(Number(item.companyAmount || 0))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Parts (Repuestos) */}
      {totalParts > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Repuestos ({totalParts})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Proveedor</TableHead>
                    <TableHead className="text-right">Cantidad</TableHead>
                    <TableHead className="text-right">Costo unitario</TableHead>
                    <TableHead className="text-right">Costo total</TableHead>
                    <TableHead className="text-right">Precio venta unitario</TableHead>
                    <TableHead className="text-right">Total venta</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {settlement.parts?.map((part) => (
                    <TableRow key={part.id}>
                      <TableCell className="text-sm">{part.name}</TableCell>
                      <TableCell className="text-sm">
                        {part.providerName || "—"}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {part.quantity}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {formatCurrency(Number(part.unitCost || 0))}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {formatCurrency(Number(part.totalCost || 0))}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {formatCurrency(Number(part.unitSalePrice || 0))}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {formatCurrency(Number(part.totalSalePrice || 0))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Expenses (Gastos) */}
      {totalExpenses > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Gastos ({totalExpenses})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Concepto</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                    <TableHead className="text-right">Monto ARS</TableHead>
                    <TableHead className="text-right">Moneda</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {settlement.expenses?.map((exp) => (
                    <TableRow key={exp.id}>
                      <TableCell className="text-sm">{exp.concept}</TableCell>
                      <TableCell className="text-right text-sm">
                        {formatCurrency(Number(exp.amount || 0))}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {formatCurrency(Number(exp.amountArs || 0))}
                      </TableCell>
                      <TableCell className="text-right text-sm">{exp.currency}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Adjustments (Ajustes) */}
      {totalAdjustments > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MoreHorizontal className="h-4 w-4" />
              Ajustes ({totalAdjustments})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Concepto</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {settlement.adjustments?.map((adj) => (
                    <TableRow key={adj.id}>
                      <TableCell className="text-sm">{adj.kind}</TableCell>
                      <TableCell className="text-sm">{adj.concept}</TableCell>
                      <TableCell className="text-right text-sm">
                        {formatCurrency(Number(adj.amount || 0))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {!totalItems && !totalParts && !totalExpenses && !totalAdjustments && (
        <div className="text-center py-8 text-muted-foreground">
          <AlertCircle className="h-8 w-8 mx-auto mb-2" />
          <p>No hay detalles cargados en esta rendición.</p>
        </div>
      )}
    </div>
  );
}
