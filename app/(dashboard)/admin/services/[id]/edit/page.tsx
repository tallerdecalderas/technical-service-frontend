import { getSession } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { getServerCookies } from "@/lib/api-client-server";
import { getServiceById } from "@/lib/services/service.service";
import { listClients } from "@/lib/services/client.service";
import { listTechnicians } from "@/lib/services/technician.service";
import { ServiceForm } from "@/components/services/service-form";

interface EditServicePageProps {
  params: Promise<{ id: string }>;
}

export default async function EditServicePage({
  params,
}: EditServicePageProps) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    redirect("/login");
  }

  const { id } = await params;
  const cookies = await getServerCookies();

  const [service, clientsResult, technicians] = await Promise.all([
    getServiceById(id, session, cookies),
    listClients(undefined, undefined, cookies),
    listTechnicians(cookies),
  ]);

  if (!service) {
    notFound();
  }

  const clients = clientsResult.clients;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Editar Servicio</h1>
        <p className="text-muted-foreground">
          Modifica los detalles del servicio y su asignación
        </p>
      </div>

      <ServiceForm
        clients={clients}
        technicians={technicians.filter((t) => t.isActive)}
        createdById={service.createdById}
        service={service as any}
      />
    </div>
  );
}
