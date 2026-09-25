import AuthLayout from "../components/AuthLayout";
import OtpForm from "../components/OtpForm";

const VerifyOtpPage = () => {
  return (
    <AuthLayout
      title="Connexion avec un code"
      description="Recevez un code pour vous connecter à votre espace administrateur"
    >
      <OtpForm />
    </AuthLayout>
  );
};

export default VerifyOtpPage;
