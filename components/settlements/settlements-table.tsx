"use client";

import { useState, useEffect, useCallback } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDate, formatCurrency } from "@/lib/utils";
import {
  Calendar,
  Building2,
  User,
  Clock,
  Loader2,
  AlertCircle,
  CheckCircle,
  Search,
} from "lucide-react";
import type { Settlement } from "@/types";

interface SettlementsTableProps {
  settlements: Settlement[];
  technicians: Array<{ id: string; name: string }>;
  companies: Array<{ id: string; name: string }>;
  meta: { page: number; pageSize: number; total: number; totalPages: number };
  onPageChange: (page: number) => void;
  onFiltersChange: (filters: {
    technicianId?: string;
    companyId?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
  }) => void;
  loading: boolean;
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendiente",
  LIQUIDATED: "Liquidada",
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400",
  LIQUIDATED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400",
};

export function SettlementsTable({
  settlements,
  technicians,
  companies,
  meta,
  onPageChange,
  onFiltersChange,
  loading,
}: SettlementsTableProps) {
  const [technicianFilter, setTechnicianFilter] = useState<string>("ALL");
  const [companyFilter, setCompanyFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [page, setPage] = useState<number>(meta.page);

  useEffect(() => {
    setPage(meta.page);
  }, [meta.page]);

  const filtered = settlements.filter((s) => {
    const matchTech =
      technicianFilter === "ALL" || s.technicianId === technicianFilter;
    const matchCompany =
      companyFilter === "ALL" ||
      (s.companyId && s.companyId === companyFilter);
    const matchStatus =
      statusFilter === "ALL" || s.status === statusFilter;
    let matchDate = true;
    if (dateFrom) {
      matchDate = matchDate && s.startDate >= dateFrom;
    }
    if (dateTo) {
      matchDate = matchDate && s.endDate <= dateTo;
    }
    return matchTech && matchCompany && matchStatus && matchDate;
  });

  const handleFiltersChange = useCallback(() => {
    onFiltersChange({
      technicianId: technicianFilter === "ALL" ? undefined : technicianFilter,
      companyId: companyFilter === "ALL" ? undefined : companyFilter,
      status: statusFilter === "ALL" ? undefined : statusFilter,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    });
  }, [technicianFilter, companyFilter, statusFilter, dateFrom, dateTo, onFiltersChange]);

  useEffect(() => {
    handleFiltersChange();
    setPage(1);
  }, [handleFiltersChange]);

  const totalCollected = filtered.reduce(
    (sum, s) => sum + Number(s.totalCollected || 0),
    0,
  );
  const totalDebt = filtered.reduce(
    (sum, s) => sum + Number(s.totalDebt || 0),
    0,
  );
  const totalTechBalance = filtered.reduce(
    (sum, s) => sum + Number(s.techBalance || 0),
    0,
  );

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 flex-wrap">
                <Clock className="h-5 w-5" />
                Rendiciones
              </CardTitle>
              <p className="text-muted-foreground text-sm">
                Historial y estado de rendiciones por período
              </p>
            </div>
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <Label className="text-sm font-medium">Técnico</Label>
                <Select
                  value={technicianFilter}
                  onValueChange={setTechnicianFilter}
                >
                  <SelectTrigger className="w-full md:w-[200px]">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Todos los técnicos</SelectItem>
                    {technicians.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <Label className="text-sm font-medium">Empresa</Label>
                <Select value={companyFilter} onValueChange={setCompanyFilter}>
                  <SelectTrigger className="w-full md:w-[200px]">
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Todas las empresas</SelectItem>
                    {companies.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <Label className="text-sm font-medium">Estado</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full md:w-[160px]">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Todos</SelectItem>
                    <SelectItem value="PENDING">Pendiente</SelectItem>
                    <SelectItem value="LIQUIDATED">Liquidada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <Input
                  type="date"
                  placeholder="Desde"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-[150px]"
                />
                <Input
                  type="date"
                  placeholder="Hasta"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-[150px]"
                />
              </div>
              <Button
                onClick={handleFiltersChange}
                disabled={loading}
                className="w-full sm:w-auto"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Search className="h-4 w-4 mr-2" />
                )}
                Filtrar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Período</TableHead>
                  <TableHead>Técnico</TableHead>
                  <TableHead className="text-left">Empresa</TableHead>
                  <TableHead className="text-center">Estado</TableHead>
                  <TableHead className="text-right">Cobrado</TableHead>
                  <TableHead className="text-right">Deuda</TableHead>
                  <TableHead className="text-right">Balance Técnico</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center py-8 text-muted-foreground"
                    >
                      No se encontraron rendiciones
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((s) => {
                    const isLiquidated = s.status === "LIQUIDATED";
                    return (
                      <TableRow
                        key={s.id}
                        className={
                          isLiquidated
                            ? "bg-emerald-50/40 dark:bg-emerald-950/10"
                            : ""
                        }
                      >
                        <TableCell className="text-sm">
                          {formatDate(s.startDate)} al{" "}
                          {formatDate(s.endDate)}
                        </TableCell>
                        <TableCell className="text-sm font-medium">
                          {s.technicianName}
                        </TableCell>
                        <TableCell className="text-sm">
                          {s.companyName || (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-center">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${STATUS_COLORS[s.status] || "bg-muted text-muted-foreground"}`}
                          >
                            {STATUS_LABELS[s.status] || s.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-medium text-emerald-600">
                          {formatCurrency(Number(s.totalCollected || 0))}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(Number(s.totalDebt || 0))}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(Number(s.techBalance || 0))}
                        </TableCell>
                        <TableCell className="text-right">
                          <Link
                            href={`/admin/settlements/${s.id}`}
                            className="text-primary hover:underline text-sm"
                          >
                            Ver detalle
                          </Link>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Resumen */}
          <div className="mt-4 flex items-center justify-between space-x-4 px-2">
            <div className="text-sm text-muted-foreground">
              {filtered.length} rendición(es) — Total cobrado:{ " "}
              <span className="font-semibold text-emerald-600">
                {formatCurrency(totalCollected)}
              </span>
              {totalDebt > 0 && (
                <span className="ml-2 text-red-600 font-semibold">
                  Deuda: {formatCurrency(totalDebt)}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Balance técnico:</span>
              <span
                className={`font-semibold ${
                  totalTechBalance >= 0 ? "text-emerald-600" : "text-red-600"
                }`}
              >
                {formatCurrency(totalTechBalance)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {page > 1 && (
                <Button variant="outline" size="sm" onClick={() => onPageChange(page - 1)}>
                  Anterior
                </Button>
              )}
              <span className="text-muted-foreground text-xs">
                Página {page} de {meta.totalPages}
              </span>
              {page < meta.totalPages && (
                <Button variant="outline" size="sm" onClick={() => onPageChange(page + 1)}>
                  Siguiente
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
