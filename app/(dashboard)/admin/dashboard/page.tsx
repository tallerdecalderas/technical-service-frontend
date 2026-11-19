import { getSession } from "@/lib/auth";
import { getServerCookies } from "@/lib/api-client-server";
import { DashboardStats } from "@/components/dashboard/dashboard-stats";
import { TodayServices } from "@/components/dashboard/today-services";
import { listServices } from "@/lib/services/service.service";
import { listTechnicians } from "@/lib/services/technician.service";
import { listClients } from "@/lib/services/client.service";
import {
  startOfDayInstant,
  endOfDayInstant,
  startOfMonthInstant,
  endOfMonthInstant,
} from "@/lib/utils";
import type { Service } from "@/types";

// Cache this page for 60 seconds to reduce database load
export const revalidate = 60;

async function getDashboardData() {
  const session = await getSession();
  const cookies = await getServerCookies();
  const startOfDay = startOfDayInstant();
  const endOfDay = endOfDayInstant();
  const startOfMonth = startOfMonthInstant();
  const endOfMonth = endOfMonthInstant();

  // Fetch all data in parallel
  const [allServices, technicians, clientsResult] = await Promise.all([
    listServices({}, session, cookies),
    listTechnicians(cookies),
    listClients(undefined, undefined, cookies),
  ]);

  const todayServices = allServices.filter((s) => {
    const d = new Date(s.scheduledDate);
    return d >= startOfDay && d <= endOfDay;
  });

  return {
    stats: {
      todayServices: todayServices.length,
      pendingServices: allServices.filter((s) => s.status === "PENDING").length,
      inProgressServices: allServices.filter((s) => s.status === "IN_PROGRESS").length,
      completedThisMonth: allServices.filter(
        (s) => s.status === "COMPLETED" && new Date(s.scheduledDate) >= startOfMonth && new Date(s.scheduledDate) <= endOfMonth
      ).length,
      activeTechnicians: technicians.filter((t) => t.isActive).length,
      totalClients: clientsResult.total,
    },
    todayServices: todayServices as unknown as Service[],
  };
}

export default async function AdminDashboardPage() {
  const { stats, todayServices } = await getDashboardData();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">
          Resumen de operaciones y estado del sistema
        </p>
      </div>

      <DashboardStats stats={stats} />

      <div className="grid gap-6 lg:grid-cols-2">
        <TodayServices services={todayServices} />
      </div>
    </div>
  );
}
