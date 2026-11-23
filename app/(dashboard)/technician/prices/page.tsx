import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { TechnicianPriceList } from "@/components/inventory/technician-price-list";

export default async function TechnicianPricesPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "TECHNICIAN") redirect("/admin/dashboard");

  const companyIds = session.companies?.map((company) => company.id) ?? [];
  return <TechnicianPriceList companyIds={companyIds} />;
}
