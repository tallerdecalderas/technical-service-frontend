"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getSettlementById,
  updateSettlement,
  liquidateSettlement,
} from "@/lib/services/settlement.service";
import { SettlementDetail } from "@/components/settlements/settlement-detail";
import type { SessionUser } from "@/types";

interface AdminSettlementDetailClientProps {
  id: string;
  initialSettlement: any;
  session: SessionUser;
  cookies: string;
}

export function AdminSettlementDetailClient({
  id,
  initialSettlement,
  session,
  cookies,
}: AdminSettlementDetailClientProps) {
  const [settlement, setSettlement] = useState<any>(initialSettlement);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const s = await getSettlementById(
        id,
        { role: session.role, id: session.id },
        cookies,
      );
      setSettlement(s);
    } catch (err: any) {
      setError(err.message || "No se pudo cargar la rendición");
    } finally {
      setLoading(false);
    }
  }, [id, session, cookies]);

  useEffect(() => {
    if (!settlement) {
      reload();
    }
  }, [reload, settlement]);

  const handleUpdate = useCallback(async (data: {
    label?: string | null;
    companyRate?: string | null;
  }) => {
    setError(null);
    try {
      const updated = await updateSettlement(
        id,
        data,
        { role: session.role, id: session.id },
        undefined,
        cookies,
      );
      setSettlement(updated);
    } catch (err: any) {
      setError(err.message || "No se pudo actualizar la rendición");
    }
  }, [id, session, cookies]);

  const handleLiquidate = useCallback(async () => {
    setError(null);
    try {
      const updated = await liquidateSettlement(
        id,
        { role: session.role, id: session.id },
        undefined,
        cookies,
      );
      setSettlement(updated);
    } catch (err: any) {
      setError(err.message || "No se pudo liquidar la rendición");
    }
  }, [id, session, cookies]);

  if (!settlement) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-2">
          <p className="text-muted-foreground">Cargando rendición...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <h2 className="text-lg font-semibold text-foreground">{error}</h2>
        <button
          onClick={() => window.history.back()}
          className="mt-4 text-primary hover:underline"
        >
          Volver
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">
          Rendición #{settlement.id.slice(0, 8)}
        </h1>
      </div>

      <SettlementDetail
        settlement={settlement}
        onLiquidate={handleLiquidate}
        onUpdate={handleUpdate}
        isAdmin={session.role === "ADMIN"}
        loading={false}
      />
    </div>
  );
}
