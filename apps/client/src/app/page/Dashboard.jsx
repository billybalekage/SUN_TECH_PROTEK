import { Link } from "react-router-dom";
import { KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";

const DashboardPage = () => {
  return (
    <main className="flex min-h-[calc(100vh-4.25rem)] items-center justify-center bg-muted/30 p-4 text-center">
      <div>
        <p className="text-xs font-medium text-muted-foreground">Protek</p>
        <h1 className="mt-2 text-3xl font-semibold">
          Bienvenue dans votre espace
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Votre tableau de bord sera bientôt disponible.
        </p>
        <Button asChild className="mt-6">
          <Link to="/password/change">
            <KeyRound aria-hidden="true" className="size-4" />
            Modifier mon mot de passe
          </Link>
        </Button>
      </div>
    </main>
  );
};

export default DashboardPage;
