import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import AuthError from "./AuthError";
import PasswordField from "./PasswordField";
import {
  requestPasswordResetSchema,
  resetPasswordSchema,
} from "../schemas/password-schema";
import {
  useRequestPasswordReset,
  useResetPassword,
} from "../hooks/usePasswordActions";

const PasswordResetForm = () => {
  const [email, setEmail] = useState("");
  const requestReset = useRequestPasswordReset();
  const reset = useResetPassword();
  const requestForm = useForm({
    resolver: zodResolver(requestPasswordResetSchema),
    defaultValues: { email: "" },
  });
  const resetForm = useForm({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { code: "", newPassword: "", confirmPassword: "" },
  });

  const onRequest = ({ email: requestedEmail }) => {
    requestReset.mutate(
      { email: requestedEmail },
      { onSuccess: () => setEmail(requestedEmail) },
    );
  };

  const onReset = (values) => {
    reset.mutate({ email, code: values.code, newPassword: values.newPassword });
  };

  if (!email) {
    return (
      <form onSubmit={requestForm.handleSubmit(onRequest)} noValidate>
        <FieldGroup className="gap-5">
          <AuthError error={requestReset.error} />
          <Field data-invalid={!!requestForm.formState.errors.email}>
            <FieldLabel htmlFor="reset-email">Email</FieldLabel>
            <Input
              id="reset-email"
              type="email"
              autoComplete="email"
              autoFocus
              className="h-12 text-base"
              aria-invalid={!!requestForm.formState.errors.email}
              {...requestForm.register("email")}
            />
            <FieldError>
              {requestForm.formState.errors.email?.message}
            </FieldError>
          </Field>
          <Button
            type="submit"
            disabled={requestReset.isPending}
            className="h-12 w-full"
          >
            {requestReset.isPending ? "Envoi..." : "Recevoir un code"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            <Link
              to="/login"
              className="font-medium text-primary hover:underline"
            >
              Retour à la connexion
            </Link>
          </p>
        </FieldGroup>
      </form>
    );
  }

  return (
    <form onSubmit={resetForm.handleSubmit(onReset)} noValidate>
      <FieldGroup className="gap-4">
        <AuthError error={reset.error} />
        <Field data-invalid={!!resetForm.formState.errors.code}>
          <FieldLabel htmlFor="reset-code">Code de réinitialisation</FieldLabel>
          <Input
            id="reset-code"
            inputMode="numeric"
            autoComplete="one-time-code"
            autoFocus
            className="h-12 text-base tracking-[0.3em]"
            aria-invalid={!!resetForm.formState.errors.code}
            {...resetForm.register("code")}
          />
          <FieldDescription>Code envoyé à {email}.</FieldDescription>
          <FieldError>{resetForm.formState.errors.code?.message}</FieldError>
        </Field>
        <PasswordField
          id="reset-new-password"
          label="Nouveau mot de passe"
          autoComplete="new-password"
          error={resetForm.formState.errors.newPassword}
          {...resetForm.register("newPassword")}
        />
        <PasswordField
          id="reset-confirm-password"
          label="Confirmer le mot de passe"
          autoComplete="new-password"
          error={resetForm.formState.errors.confirmPassword}
          {...resetForm.register("confirmPassword")}
        />
        <Button
          type="submit"
          disabled={reset.isPending}
          className="h-12 w-full"
        >
          {reset.isPending ? "Réinitialisation..." : "Réinitialiser"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="min-h-11 w-full"
          onClick={() => setEmail("")}
        >
          Utiliser une autre adresse email
        </Button>
      </FieldGroup>
    </form>
  );
};

export default PasswordResetForm;
