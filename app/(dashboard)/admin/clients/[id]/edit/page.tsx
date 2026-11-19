import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getServerCookies } from "@/lib/api-client-server";
import { getClientById } from "@/lib/services/client.service";
import { ClientForm } from "@/components/clients/client-form";

interface EditClientPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditClientPage({ params }: EditClientPageProps) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    redirect("/login");
  }

  const { id } = await params;
  const cookies = await getServerCookies();
  const client = await getClientById(id, session, cookies);

  if (!client) {
    notFound();
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Editar Cliente</h1>
        <p className="text-muted-foreground">Actualiza los datos del cliente</p>
      </div>

      <ClientForm initialData={client} />
    </div>
  );
}
