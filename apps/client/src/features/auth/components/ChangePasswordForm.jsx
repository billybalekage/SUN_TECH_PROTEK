import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import AuthError from "./AuthError";
import PasswordField from "./PasswordField";
import { changePasswordSchema } from "../schemas/password-schema";
import { useChangePassword } from "../hooks/usePasswordActions";

const ChangePasswordForm = () => {
  const change = useChangePassword();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = (values) => {
    change.mutate({
      currentPassword: values.currentPassword,
      newPassword: values.newPassword,
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <FieldGroup className="gap-4">
        <AuthError error={change.error} />
        <PasswordField
          id="current-password"
          label="Mot de passe actuel"
          autoComplete="current-password"
          error={errors.currentPassword}
          {...register("currentPassword")}
        />
        <PasswordField
          id="new-password"
          label="Nouveau mot de passe"
          autoComplete="new-password"
          error={errors.newPassword}
          {...register("newPassword")}
        />
        <PasswordField
          id="confirm-new-password"
          label="Confirmer le nouveau mot de passe"
          autoComplete="new-password"
          error={errors.confirmPassword}
          {...register("confirmPassword")}
        />
        <Button
          type="submit"
          disabled={change.isPending}
          className="h-12 w-full"
        >
          {change.isPending ? "Modification..." : "Modifier le mot de passe"}
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          <Link
            to="/dashboard"
            className="font-medium text-primary hover:underline"
          >
            Retour à l’espace
          </Link>
        </p>
      </FieldGroup>
    </form>
  );
};

export default ChangePasswordForm;
