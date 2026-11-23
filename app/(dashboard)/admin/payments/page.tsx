import { getSession } from "@/lib/auth";
import { getServerCookies } from "@/lib/api-client-server";
import { listPayments } from "@/lib/services/payment.service";
import { listTechnicians } from "@/lib/services/technician.service";
import { PaymentsTable } from "@/components/paymentsRendition/payments-table"
import { redirect } from "next/navigation";

// Cache for 30 seconds - payments data updates frequently
export const revalidate = 30

export default async function AdminPaymentsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const cookies = await getServerCookies();
  const [payments, technicians] = await Promise.all([
    listPayments({}, session, cookies),
    listTechnicians(cookies),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Cobros</h1>
        <p className="text-muted-foreground">
          Gestiona los cobros realizados por técnicos
        </p>
      </div>

      <PaymentsTable
        payments={payments as any}
        technicians={technicians as any}
      />
    </div>
  )
}
