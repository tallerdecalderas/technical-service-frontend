import { getSession } from "@/lib/auth";
import { getServerCookies } from "@/lib/api-client-server";
import { listServices } from "@/lib/services/service.service";
import { listTechnicians } from "@/lib/services/technician.service";
import { ScheduleCalendar } from "@/components/schedule/schedule-calendar";
import { redirect } from "next/navigation";

export default async function AdminSchedulePage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const cookies = await getServerCookies();
  const [services, technicians] = await Promise.all([
    listServices({}, session, cookies),
    listTechnicians(cookies),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Agenda</h1>
        <p className="text-muted-foreground">Vista de servicios programados</p>
      </div>

      <ScheduleCalendar
        services={services as any}
        technicians={technicians.filter((t: any) => t.isActive)}
      />
    </div>
  );
}
