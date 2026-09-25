import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router-dom";
import { Mail } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldLabel,
  FieldError,
  FieldGroup,
} from "@/components/ui/field";
import { useLogin } from "../hooks/useLogin";
import { loginSchema } from "../schemas/login-schema";
import PasswordField from "./PasswordField";
import AuthError from "./AuthError";

const LoginForm = () => {
  const login = useLogin();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });
  const emailErrorId = "login-email-error";

  const onSubmit = (values) => {
    login.mutate(values);
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="w-full overflow-hidden  "
    >
      <FieldGroup className="gap-2">
        <AuthError error={login.error} />

        <Field data-invalid={!!errors.email}>
          <FieldLabel htmlFor="email" className="text-sm font-medium">
            Email
          </FieldLabel>
          <div className="relative">
            <Mail
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              id="email"
              type="email"
              autoComplete="email"
              className="h-12 w-full rounded-xl bg-background/60 pl-10 text-base"
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? emailErrorId : undefined}
              {...register("email")}
            />
          </div>
          <FieldError id={emailErrorId}>{errors.email?.message}</FieldError>
        </Field>

        <PasswordField
          autoComplete="current-password"
          error={errors.password}
          className="rounded-xl bg-background/60 text-base shadow-sm"
          {...register("password")}
        />

        <Button
          type="submit"
          disabled={login.isPending}
          className="h-12 w-full rounded-xl text-sm font-semibold shadow-sm sm:text-base"
        >
          {login.isPending ? "Connexion en cours..." : "Se connecter"}
        </Button>

        <div className="flex flex-col border rounded-xl ">
          <Link
            to="/login/otp"
            className={buttonVariants({
              variant: "outline",
              className:
                "min-h-12 h-auto w-full whitespace-normal py-3 leading-snug",
            })}
          >
            Se connecter avec un code
          </Link>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Vous n&apos;avez pas encore de compte ?{" "}
          <Link
            to="/signup"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Créer un compte
          </Link>
        </p>
      </FieldGroup>
    </form>
  );
};

export default LoginForm;
