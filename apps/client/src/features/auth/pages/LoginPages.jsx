import AuthLayout from "../components/AuthLayout";
import LoginForm from "../components/LoginForm";

const LoginPage = () => {
  return (
    <AuthLayout
      title="Bienvenue"
      description="Connectez-vous à votre espace administrateur"
    >
      <LoginForm />
    </AuthLayout>
  );
};

export default LoginPage;
