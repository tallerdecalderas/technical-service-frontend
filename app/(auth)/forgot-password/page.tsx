import { PasswordRecoveryForm } from "@/components/auth/password-recovery-form";

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">Recuperar contraseña</h1>
          <p className="mt-1 text-muted-foreground">
            Te enviaremos instrucciones si la cuenta está registrada.
          </p>
        </div>
        <PasswordRecoveryForm />
      </div>
    </div>
  );
}
