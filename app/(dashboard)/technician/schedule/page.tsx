import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getServerCookies } from "@/lib/api-client-server";
import { listServices } from "@/lib/services/service.service";
import { ScheduleCalendar } from "@/components/schedule/schedule-calendar";

export default async function TechnicianSchedulePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const cookies = await getServerCookies();

  const services = await listServices(
    { technicianId: session.id },
    session,
    cookies
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground md:text-2xl">
          Mi Agenda
        </h1>
        <p className="text-muted-foreground">
          Vista semanal de tus servicios programados
        </p>
      </div>

      <ScheduleCalendar
        services={services as any}
        isAdminView={false}
        basePath="/technician/services"
      />
    </div>
  );
}
