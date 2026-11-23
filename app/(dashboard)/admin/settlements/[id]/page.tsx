import { getSession } from "@/lib/auth";
import { getServerCookies } from "@/lib/api-client-server";
import { getSettlementById } from "@/lib/services/settlement.service";
import { AdminSettlementDetailClient } from "../components/settlement-detail-client";
import { redirect } from "next/navigation";

export const revalidate = 30;

export default async function AdminSettlementDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "ADMIN") redirect("/technician/dashboard");

  const cookies = await getServerCookies();
  const { id } = await params;

  // Cargar datos iniciales en el servidor
  const settlement = await getSettlementById(
    id,
    { role: session.role, id: session.id },
    cookies,
  );

  return (
    <AdminSettlementDetailClient
      id={id}
      initialSettlement={settlement}
      session={session}
      cookies={cookies}
    />
  );
}
