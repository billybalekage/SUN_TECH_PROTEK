import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router-dom";
import { Building2, Mail, Phone, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { useSignup } from "../hooks/useSignup";
import { signupSchema } from "../schemas/signup-schema";
import PasswordField from "./PasswordField";
import AuthError from "./AuthError";

const SignupForm = () => {
  const signup = useSignup();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
      company: "",
      phone: "",
    },
  });

  const onSubmit = ({ confirmPassword, ...values }) => {
    signup.mutate(values);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="w-full">
      <FieldGroup className="gap-2">
        <AuthError error={signup.error} />

        <Field data-invalid={!!errors.fullName}>
          <FieldLabel htmlFor="fullName" className="text-sm font-medium">
            Nom complet
          </FieldLabel>
          <div className="relative">
            <UserRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="fullName"
              autoComplete="name"
              className="h-12 w-full rounded-xl bg-background/60 pl-10 text-base"
              aria-invalid={!!errors.fullName}
              {...register("fullName")}
            />
          </div>
          <FieldError>{errors.fullName?.message}</FieldError>
        </Field>

        <Field data-invalid={!!errors.email}>
          <FieldLabel htmlFor="signup-email" className="text-sm font-medium">
            Email
          </FieldLabel>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="signup-email"
              type="email"
              autoComplete="email"
              className="h-12 w-full rounded-xl bg-background/60 pl-10 text-base"
              aria-invalid={!!errors.email}
              {...register("email")}
            />
          </div>
          <FieldError>{errors.email?.message}</FieldError>
        </Field>

        <div className="grid gap-2 sm:grid-cols-2">
          <Field data-invalid={!!errors.company}>
            <FieldLabel htmlFor="company" className="text-sm font-medium">
              Entreprise{" "}
              <span className="text-muted-foreground">(optionnel)</span>
            </FieldLabel>
            <div className="relative">
              <Building2 className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="company"
                autoComplete="organization"
                className="h-12 w-full rounded-xl bg-background/60 pl-10 text-base"
                aria-invalid={!!errors.company}
                {...register("company")}
              />
            </div>
            <FieldError>{errors.company?.message}</FieldError>
          </Field>

          <Field data-invalid={!!errors.phone}>
            <FieldLabel htmlFor="phone" className="text-sm font-medium">
              Téléphone{" "}
              <span className="text-muted-foreground">(optionnel)</span>
            </FieldLabel>
            <div className="relative">
              <Phone className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="phone"
                type="tel"
                autoComplete="tel"
                className="h-12 w-full rounded-xl bg-background/60 pl-10 text-base"
                aria-invalid={!!errors.phone}
                {...register("phone")}
              />
            </div>
            <FieldError>{errors.phone?.message}</FieldError>
          </Field>
        </div>

        <PasswordField
          id="signup-password"
          autoComplete="new-password"
          error={errors.password}
          className="rounded-xl bg-background/60 text-base shadow-sm"
          {...register("password")}
        />
        <PasswordField
          id="confirmPassword"
          label="Confirmer le mot de passe"
          autoComplete="new-password"
          error={errors.confirmPassword}
          className="rounded-xl bg-background/60 text-base shadow-sm"
          {...register("confirmPassword")}
        />

        <Button
          type="submit"
          disabled={signup.isPending}
          className="mt-2 h-12 w-full rounded-xl text-sm font-semibold shadow-sm sm:text-base"
        >
          {signup.isPending ? "Création en cours..." : "Créer mon compte"}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          Vous avez déjà un compte ?{" "}
          <Link
            to="/login"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Se connecter
          </Link>
        </p>
      </FieldGroup>
    </form>
  );
};

export default SignupForm;
