import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getServerCookies } from "@/lib/api-client-server";
import { getClientById } from "@/lib/services/client.service";
import { listServices } from "@/lib/services/service.service";
import { ClientDetail } from "@/components/clients/client-detail";

interface ClientPageProps {
  params: Promise<{ id: string }>;
}

async function getClientHistory(clientId: string, session: any, cookies: string) {
  const client = await getClientById(clientId, session, cookies);
  if (!client) return null;

  const services = await listServices({ clientId }, session, cookies);

  const totalServices = services.length;
  const completedServices = services.filter(
    (s: any) => s.status === "COMPLETED"
  ).length;
  const totalPaid = services.reduce(
    (sum: number, s: any) => sum + Number((s as any).payment?.amountPaid || 0),
    0
  );

  return {
    client,
    services,
    stats: {
      totalServices,
      completedServices,
      totalPaid,
    },
  };
}

export default async function AdminClientPage({ params }: ClientPageProps) {
  const { id } = await params;
  const session = await getSession();
  const cookies = await getServerCookies();
  const clientHistory = await getClientHistory(id, session, cookies);

  if (!clientHistory) {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <ClientDetail
        client={clientHistory.client as any}
        services={serialize(clientHistory.services as any)}
        stats={clientHistory.stats}
      />
    </div>
  );
}
