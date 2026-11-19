import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getServerCookies } from "@/lib/api-client-server";
import { getServiceById } from "@/lib/services/service.service";
import { listTechnicians } from "@/lib/services/technician.service";
import { AdminServiceDetail } from "@/components/services/admin-service-detail";

interface ServicePageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminServicePage({ params }: ServicePageProps) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    redirect("/login");
  }

  const { id } = await params;
  const cookies = await getServerCookies();
  const [service, technicians] = await Promise.all([
    getServiceById(id, session, cookies),
    listTechnicians(cookies),
  ]);

  if (!service) {
    notFound();
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <AdminServiceDetail
        service={service as any}
        technicians={technicians.filter((t: any) => t.isActive) as any}
      />
    </div>
  );
}
