import { getSession } from "@/lib/auth";
import { getServerCookies } from "@/lib/api-client-server";
import { listSettlements } from "@/lib/services/settlement.service";
import { redirect } from "next/navigation";

export const revalidate = 30;

export default async function TechnicianSettlementsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "TECHNICIAN") redirect("/admin/dashboard");

  const cookies = await getServerCookies();

  const result = await listSettlements(
    {},
    { role: session.role, id: session.id, companyIds: session.companies?.map((c) => c.id) },
    cookies,
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Mis rendiciones
        </h1>
        <p className="text-muted-foreground">
          Consulta el estado de tus rendiciones por período
        </p>
      </div>

      <div className="rounded-md border">
        {result.settlements.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-muted-foreground">
              No tienes rendiciones generadas aún.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b">
                  <th className="px-4 py-3 text-sm font-medium text-muted-foreground">Período</th>
                  <th className="px-4 py-3 text-sm font-medium text-muted-foreground text-right">Cobrado</th>
                  <th className="px-4 py-3 text-sm font-medium text-muted-foreground text-right">Deuda</th>
                  <th className="px-4 py-3 text-sm font-medium text-muted-foreground text-right">Balance técnico</th>
                  <th className="px-4 py-3 text-sm font-medium text-muted-foreground text-center">Estado</th>
                </tr>
              </thead>
              <tbody>
                {result.settlements.map((s) => (
                  <tr key={s.id} className="border-b last:border-0">
                    <td className="px-4 py-3 text-sm">
                      {s.startDate} al {s.endDate}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-medium text-emerald-600">
                      {s.totalCollected}
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      {s.totalDebt}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-medium">
                      {s.techBalance}
                    </td>
                    <td className="px-4 py-3 text-sm text-center">
                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                        s.status === "LIQUIDATED"
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400"
                          : "bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400"
                      }`}>
                        {s.status === "LIQUIDATED" ? "Liquidada" : "Pendiente"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between space-x-4 px-2">
        <span className="text-sm text-muted-foreground">
          {result.settlements.length} rendición(es)
        </span>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Página {result.meta.page} de {result.meta.totalPages}</span>
        </div>
      </div>
    </div>
  );
}
