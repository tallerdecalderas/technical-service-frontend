import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getServerCookies } from "@/lib/api-client-server";
import { listServices } from "@/lib/services/service.service";
import { TechnicianServicesList } from "@/components/technician/technician-services-list";

export default async function TechnicianServicesPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const cookies = await getServerCookies();

  const services = await listServices(
    { technicianId: session.id },
    session,
    cookies
  );

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-foreground md:text-2xl">
          Mis Servicios
        </h1>
        <p className="text-sm text-muted-foreground">
          Historial de todos tus servicios asignados
        </p>
      </div>

      <TechnicianServicesList services={services as any} />
    </div>
  );
}
