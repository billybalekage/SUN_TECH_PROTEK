import AuthLayout from "../components/AuthLayout";
import SignupForm from "../components/SignupForm";

const SignupPage = () => {
  return (
    <AuthLayout
      title="Créez votre compte"
      description="Rejoignez votre espace administrateur Protek"
    >
      <SignupForm />
    </AuthLayout>
  );
};

export default SignupPage;
