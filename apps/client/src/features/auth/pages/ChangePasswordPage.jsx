import AuthLayout from "../components/AuthLayout";
import ChangePasswordForm from "../components/ChangePasswordForm";

const ChangePasswordPage = () => (
  <AuthLayout
    title="Modifier le mot de passe"
    description="Confirmez votre mot de passe actuel avant d’en choisir un nouveau."
  >
    <ChangePasswordForm />
  </AuthLayout>
);

export default ChangePasswordPage;
