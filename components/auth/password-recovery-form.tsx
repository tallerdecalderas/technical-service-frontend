"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiClient } from "@/lib/api-client";

export function PasswordRecoveryForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);
    try {
      const response = await apiClient.post<{ message: string }, { email: string }>("/auth/password/forgot", {
        email,
      });
      if (!response.success) {
        setError(response.error?.message ?? "No se pudo solicitar la recuperación.");
        return;
      }
      setMessage(response.data?.message);
    } catch {
      setError("No se pudo conectar con el servicio de autenticación.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {message && <Alert><AlertDescription>{message}</AlertDescription></Alert>}
      {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
      <div className="space-y-2">
        <Label htmlFor="recovery-email">Correo electrónico</Label>
        <Input
          id="recovery-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          disabled={loading}
        />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Enviando..." : "Enviar instrucciones"}
      </Button>
      <div className="text-center text-sm">
        <Link href="/login" className="text-primary underline-offset-4 hover:underline">
          Volver al inicio de sesión
        </Link>
      </div>
    </form>
  );
}
