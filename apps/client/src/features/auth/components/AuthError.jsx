import { Alert, AlertDescription } from "@/components/ui/alert";

function getErrorMessage(error) {
  return (
    error?.response?.data?.error?.message ||
    error?.message ||
    "Une erreur est survenue."
  );
}

const AuthError = ({ error }) => {
  if (!error) return null;

  return (
    <Alert variant="destructive" role="alert" className="text-sm">
      <AlertDescription>{getErrorMessage(error)}</AlertDescription>
    </Alert>
  );
};

export default AuthError;
