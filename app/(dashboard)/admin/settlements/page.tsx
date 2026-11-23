import { getSession } from "@/lib/auth";
import { getServerCookies } from "@/lib/api-client-server";
import { listSettlements } from "@/lib/services/settlement.service";
import { listTechnicians } from "@/lib/services/technician.service";
import { listCompanies } from "@/lib/services/company.service";
import { AdminSettlementsClient } from "./components/settlements-client";
import { redirect } from "next/navigation";

export const revalidate = 30;

export default async function AdminSettlementsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "ADMIN") redirect("/technician/dashboard");

  const cookies = await getServerCookies();

  // Datos iniciales para filtros
  const [technicians, companies] = await Promise.all([
    listTechnicians(cookies).then((ts) =>
      ts.map((t) => ({ id: t.id, name: t.name })),
    ),
    listCompanies(cookies).then((cs) =>
      cs.map((c) => ({ id: c.id, name: c.name })),
    ),
  ]);

  return (
    <AdminSettlementsClient
      session={session}
      cookies={cookies}
      technicians={technicians}
      companies={companies}
    />
  );
}
