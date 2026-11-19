import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getServerCookies } from "@/lib/api-client-server";
import { getServiceById } from "@/lib/services/service.service";
import { ServiceDetail } from "@/components/technician/service-detail";

interface ServicePageProps {
  params: Promise<{ id: string }>;
}

export default async function TechnicianServicePage({
  params,
}: ServicePageProps) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = await params;
  const cookies = await getServerCookies();
  const service = await getServiceById(id, session, cookies);

  if (!service) {
    notFound();
  }

  // Verify technician owns this service
  if ((service as any).technicianId !== session.id) {
    redirect("/technician/dashboard");
  }

  return (
    <div className="max-w-2xl mx-auto">
      <ServiceDetail service={service as any} />
    </div>
  );
}
