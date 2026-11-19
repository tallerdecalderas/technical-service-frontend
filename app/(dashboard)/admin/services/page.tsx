import Link from "next/link";
import { getSession } from "@/lib/auth";
import { getServerCookies } from "@/lib/api-client-server";
import { listServices } from "@/lib/services/service.service";
import { listTechnicians } from "@/lib/services/technician.service";
import { Button } from "@/components/ui/button";
import { ServicesTable } from "@/components/services/services-table";
import { Plus } from "lucide-react";

// Cache for 30 seconds - services list updates frequently
export const revalidate = 30;

export default async function AdminServicesPage() {
  const session = await getSession();
  const cookies = await getServerCookies();
  const [services, technicians] = await Promise.all([
    listServices({}, session, cookies),
    listTechnicians(cookies),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Servicios</h1>
          <p className="text-muted-foreground">
            Gestiona todos los servicios del sistema
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/services/new">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Servicio
          </Link>
        </Button>
      </div>

      <ServicesTable
        services={services as any}
        technicians={technicians as any}
      />
    </div>
  );
}
