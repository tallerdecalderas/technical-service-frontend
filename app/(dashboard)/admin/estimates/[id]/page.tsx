import { notFound, redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import { getServerCookies } from "@/lib/api-client-server"
import { getEstimateById } from "@/lib/services/estimate.service"
import { EstimateDetail } from "@/components/estimates/estimate-detail"

export const revalidate = 0 // Ensure fresh data on details page

interface EstimatePageProps {
  params: Promise<{ id: string }>
}

export default async function AdminEstimatePage({ params }: EstimatePageProps) {
  const { id } = await params
  const session = await getSession();
  if (!session) redirect("/login");
  const cookies = await getServerCookies();

  const estimate = await getEstimateById(id, session, cookies)

  if (!estimate) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Detalle del Presupuesto
        </h1>
        <p className="text-muted-foreground">
          Información del presupuesto ingresado por el técnico
        </p>
      </div>

      <EstimateDetail estimate={estimate as any} />
    </div>
  )
}
