import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { InventoryWorkbench } from "@/components/inventory/inventory-workbench";

export default async function AdminInventoryPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "ADMIN") redirect("/technician/dashboard");

  return <InventoryWorkbench />;
}
