import { Link } from "react-router-dom";
import { buttonVariants } from "@/components/ui/button";

const NotFoundPage = () => {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 bg-muted/30 p-4 text-center">
      <p className="text-xs font-medium text-muted-foreground">Erreur 404</p>
      <h1 className="font-heading text-4xl font-semibold">Page introuvable</h1>
      <p className="max-w-sm text-xs text-muted-foreground">
        Cette page n&apos;existe pas ou n&apos;est pas encore disponible.
      </p>
      <Link to="/login" className={buttonVariants({ variant: "default" })}>
        Retour à la connexion
      </Link>
    </main>
  );
};

export default NotFoundPage;
