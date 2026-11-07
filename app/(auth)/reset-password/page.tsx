import { PasswordResetForm } from "@/components/auth/password-reset-form";

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">Nueva contraseña</h1>
          <p className="mt-1 text-muted-foreground">
            Elegí una contraseña nueva para tu cuenta.
          </p>
        </div>
        <PasswordResetForm />
      </div>
    </div>
  );
}
