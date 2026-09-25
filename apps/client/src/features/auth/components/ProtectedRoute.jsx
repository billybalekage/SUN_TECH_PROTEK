import { Navigate } from "react-router-dom";
import { useAuthSession } from "../hooks/useAuthSession";

const ProtectedRoute = ({ children }) => {
  const { data, isLoading, isError, error } = useAuthSession();

  if (isLoading) {
    return (
      <div className="flex min-h-[calc(100vh-4.25rem)] items-center justify-center bg-muted/30 p-4 text-center">
        <p className="text-sm text-muted-foreground">
          Vérification de la session...
        </p>
      </div>
    );
  }

  if (isError && error?.response?.status !== 401) {
    return (
      <div className="flex min-h-[calc(100vh-4.25rem)] items-center justify-center bg-muted/30 p-4 text-center">
        <p className="text-sm text-destructive">
          Impossible de vérifier votre session pour le moment.
        </p>
      </div>
    );
  }

  if (!data) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
