import { getSession } from "@/lib/auth";
import { getServerCookies } from "@/lib/api-client-server";
import { listEstimates } from "@/lib/services/estimate.service";
import { EstimatesTable } from "@/components/estimates/estimates-table"
import { redirect } from "next/navigation";

export const revalidate = 0 // Disable static cache for estimates to ensure real-time status

export default async function AdminEstimatesPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const cookies = await getServerCookies();
  const estimates = await listEstimates({}, session, cookies);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Presupuestos</h1>
        <p className="text-muted-foreground">
          Revisa y gestiona los presupuestos enviados por los técnicos
        </p>
      </div>

      <EstimatesTable initialEstimates={estimates as any} />
    </div>
  )
}
