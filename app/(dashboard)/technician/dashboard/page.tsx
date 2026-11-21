import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getServerCookies } from "@/lib/api-client-server";
import { listServices } from "@/lib/services/service.service";
import { TechnicianAgenda } from "@/components/technician/technician-agenda";
import { TechnicianStats } from "@/components/technician/technician-stats";
import { serialize, startOfDayInstant, toDate } from "@/lib/utils";

export default async function TechnicianDashboardPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const cookies = await getServerCookies();
  const startOfDay = toDate(startOfDayInstant());

  const todayServices = await listServices(
    { technicianId: session.id, status: undefined },
    session,
    cookies
  );

  const nonCancelled = todayServices.filter((s: any) => s.status !== "CANCELLED");
  const todayServicesFiltered = nonCancelled.filter((s: any) => {
    const d = new Date(s.scheduledDate);
    return d >= startOfDay;
  });

  const stats = {
    todayCount: todayServicesFiltered.length,
    pendingCount: todayServicesFiltered.filter((s: any) => s.status === "PENDING").length,
    inProgressCount: todayServicesFiltered.filter((s: any) => s.status === "IN_PROGRESS").length,
    completedCount: todayServicesFiltered.filter((s: any) => s.status === "COMPLETED").length,
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-foreground md:text-2xl">
          Mi Agenda
        </h1>
        <p className="text-sm text-muted-foreground">
          {new Date().toLocaleDateString("es-CL", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        </p>
      </div>

      <TechnicianStats stats={stats} />
      <TechnicianAgenda services={serialize(todayServices)} />
    </div>
  );
}
