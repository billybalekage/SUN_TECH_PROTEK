// import AuthLayout from "../components/AuthLayout";
import ChangePasswordForm from "../components/ChangePasswordForm";

const ChangePasswordPage = () => (
  <div className="p-4 sm:p-6 md:p-8 lg:p-10">
    <title>Changer de mot de passe</title>
    <header className="mb-6">
      <h1 className="text-2xl font-semibold tracking-tight">
        Modifier le mot de passe
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Confirmez votre mot de passe actuel avant d’en choisir un nouveau.
      </p>
    </header>
    <ChangePasswordForm />
  </div>
);

export default ChangePasswordPage;
