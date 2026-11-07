"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function PasswordResetForm() {
  const router = useRouter();
  const [accessToken, setAccessToken] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fragment = new URLSearchParams(window.location.hash.slice(1));
    const token = fragment.get("access_token") ?? "";
    const type = fragment.get("type");
    setAccessToken(type === "recovery" ? token : "");
    window.history.replaceState(null, "", window.location.pathname);
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await fetch("/api/auth/password/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken, password }),
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result.error ?? "El enlace expiró o no es válido.");
        return;
      }
      router.replace("/login?passwordReset=1");
    } catch {
      setError("No se pudo conectar con el servicio de autenticación.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
      {!accessToken && (
        <Alert variant="destructive">
          <AlertDescription>El enlace expiró o no es válido. Solicita uno nuevo.</AlertDescription>
        </Alert>
      )}
      <div className="space-y-2">
        <Label htmlFor="new-password">Nueva contraseña</Label>
        <Input
          id="new-password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          disabled={loading || !accessToken}
        />
      </div>
      <Button type="submit" className="w-full" disabled={loading || !accessToken}>
        {loading ? "Actualizando..." : "Actualizar contraseña"}
      </Button>
      <div className="text-center text-sm">
        <Link href="/forgot-password" className="text-primary underline-offset-4 hover:underline">
          Solicitar otro enlace
        </Link>
      </div>
    </form>
  );
}
