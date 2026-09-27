import AuthLayout from "../components/AuthLayout";
import PasswordResetForm from "../components/PasswordResetForm";

const ForgotPasswordPage = () => (
  <AuthLayout
    title="Réinitialiser le mot de passe"
    description="Recevez un code par email pour choisir un nouveau mot de passe."
  >
    <PasswordResetForm />
  </AuthLayout>
);

export default ForgotPasswordPage;
