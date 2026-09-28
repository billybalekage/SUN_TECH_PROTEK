// import AuthLayout from "../components/AuthLayout";
import ChangePasswordForm from "../components/ChangePasswordForm";

const ChangePasswordPage = () => (
  <div
    className="p-4 sm:p-6 md:p-8 lg:p-10"
    title="Modifier le mot de passe"
    description="Confirmez votre mot de passe actuel avant d’en choisir un nouveau."
  >
    <title>Changer de mot de passe</title>
    <ChangePasswordForm />
  </div>
);

export default ChangePasswordPage;
