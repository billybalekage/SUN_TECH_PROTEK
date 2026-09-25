import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldLabel,
  FieldError,
  FieldGroup,
  FieldDescription,
} from "@/components/ui/field";
import { useRequestOtp, useVerifyOtp } from "../hooks/useOtp";
import { requestOtpSchema, verifyOtpSchema } from "../schemas/otp-schema";
import AuthError from "./AuthError";

const OtpForm = () => {
  const [email, setEmail] = useState(null);

  const requestOtp = useRequestOtp();
  const verifyOtp = useVerifyOtp();

  const requestForm = useForm({
    resolver: zodResolver(requestOtpSchema),
    defaultValues: { email: "" },
  });

  const verifyForm = useForm({
    resolver: zodResolver(verifyOtpSchema),
    defaultValues: { code: "" },
  });

  const onRequestSubmit = (values) => {
    requestOtp.mutate(values, {
      onSuccess: () => setEmail(values.email),
    });
  };

  const onVerifySubmit = (values) => {
    verifyOtp.mutate({ email, ...values });
  };

  if (!email) {
    return (
      <form onSubmit={requestForm.handleSubmit(onRequestSubmit)} noValidate>
        <FieldGroup className="gap-5">
          <AuthError error={requestOtp.error} />

          <Field data-invalid={!!requestForm.formState.errors.email}>
            <FieldLabel htmlFor="otp-email" className="text-sm font-medium">
              Email
            </FieldLabel>
            <Input
              id="otp-email"
              type="email"
              autoComplete="email"
              autoFocus
              className="h-12 w-full rounded-lg text-base"
              aria-invalid={!!requestForm.formState.errors.email}
              aria-describedby={
                requestForm.formState.errors.email
                  ? "otp-email-error"
                  : undefined
              }
              {...requestForm.register("email")}
            />
            <FieldError id="otp-email-error">
              {requestForm.formState.errors.email?.message}
            </FieldError>
          </Field>

          <Button
            type="submit"
            disabled={requestOtp.isPending}
            className="h-12 w-full text-base"
          >
            {requestOtp.isPending ? "Envoi..." : "Envoyer le code"}
          </Button>
        </FieldGroup>
      </form>
    );
  }

  return (
    <form onSubmit={verifyForm.handleSubmit(onVerifySubmit)} noValidate>
      <FieldGroup className="gap-5">
        <AuthError error={verifyOtp.error} />

        <Field data-invalid={!!verifyForm.formState.errors.code}>
          <FieldLabel htmlFor="otp-code" className="text-sm font-medium">
            Code reçu par email
          </FieldLabel>
          <Input
            id="otp-code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            autoFocus
            className="h-12 w-full rounded-lg text-base tracking-[0.3em] sm:text-lg"
            aria-invalid={!!verifyForm.formState.errors.code}
            aria-describedby="otp-code-description otp-code-error"
            {...verifyForm.register("code")}
          />
          <FieldDescription id="otp-code-description">
            Code envoyé à {email}.
          </FieldDescription>
          <FieldError id="otp-code-error">
            {verifyForm.formState.errors.code?.message}
          </FieldError>
        </Field>

        <Button
          type="submit"
          disabled={verifyOtp.isPending}
          className="h-12 w-full text-base"
        >
          {verifyOtp.isPending ? "Vérification..." : "Vérifier"}
        </Button>

        <Button
          type="button"
          variant="ghost"
          className="min-h-12 w-full text-base"
          onClick={() => setEmail(null)}
        >
          Utiliser une autre adresse email
        </Button>
      </FieldGroup>
    </form>
  );
};

export default OtpForm;
