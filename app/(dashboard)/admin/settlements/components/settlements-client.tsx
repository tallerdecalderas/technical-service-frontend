"use client";

import { useState, useEffect, useCallback } from "react";
import { listSettlements } from "@/lib/services/settlement.service";
import { SettlementsTable } from "@/components/settlements/settlements-table";
import type { SessionUser } from "@/types";

interface AdminSettlementsClientProps {
  session: SessionUser;
  cookies: string;
  technicians: Array<{ id: string; name: string }>;
  companies: Array<{ id: string; name: string }>;
}

export function AdminSettlementsClient({
  session,
  cookies,
  technicians,
  companies,
}: AdminSettlementsClientProps) {
  const [settlements, setSettlements] = useState<Array<any>>([]);
  const [meta, setMeta] = useState<{
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  }>({ page: 1, pageSize: 20, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [technicianFilter, setTechnicianFilter] = useState<string>("ALL");
  const [companyFilter, setCompanyFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await listSettlements(
        {
          technicianId:
            technicianFilter === "ALL" ? undefined : technicianFilter,
          companyId: companyFilter === "ALL" ? undefined : companyFilter,
          status: statusFilter === "ALL" ? undefined : statusFilter,
          dateFrom: dateFrom || undefined,
          dateTo: dateTo || undefined,
          page,
          pageSize: 20,
        },
        {
          role: session.role,
          id: session.id,
          companyIds: session.companies?.map((c) => c.id),
        },
        cookies,
      );
      setSettlements(result.settlements);
      setMeta(result.meta);
    } finally {
      setLoading(false);
    }
  }, [
    technicianFilter,
    companyFilter,
    statusFilter,
    dateFrom,
    dateTo,
    page,
    session,
    cookies,
  ]);

  useEffect(() => {
    load();
  }, [load]);

  const onPageChange = (nextPage: number) => setPage(nextPage);

  const onFiltersChange = (filters: {
    technicianId?: string;
    companyId?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
  }) => {
    setPage(1);
    if (filters.technicianId) setTechnicianFilter(filters.technicianId);
    else setTechnicianFilter("ALL");
    if (filters.companyId) setCompanyFilter(filters.companyId);
    else setCompanyFilter("ALL");
    if (filters.status) setStatusFilter(filters.status);
    else setStatusFilter("ALL");
    if (filters.dateFrom) setDateFrom(filters.dateFrom);
    if (filters.dateTo) setDateTo(filters.dateTo);
  };

  return (
    <div className="space-y-6">
      <SettlementsTable
        settlements={settlements}
        technicians={technicians}
        companies={companies}
        meta={meta}
        onPageChange={onPageChange}
        onFiltersChange={onFiltersChange}
        loading={loading}
      />
    </div>
  );
}
