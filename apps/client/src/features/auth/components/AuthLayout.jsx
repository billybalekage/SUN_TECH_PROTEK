import { CardContent, CardHeader, CardDescription } from "@/components/ui/card";
import { ArrowUpRight } from "lucide-react";

const AuthLayout = ({ title, description, children }) => {
  return (
    <main className="grid h-[100dvh] w-screen overflow-hidden bg-background text-foreground lg:grid-cols-2 p-3 sm:p-4 sm:overflow-hidden lg:p-6 gap-6">
      {/* Section de gauche */}
      <section className="relative flex h-full sm:p-4 lg:h-[calc(100vh-3rem)] flex-col justify-center items-center px-4 py-8 sm:px-8 lg:px-12 lg:order-1 overflow-auto">
        <div className="w-full max-w-md flex flex-col items-center">
          <div className="bg-transparent p-0 w-full">
            <CardHeader className="gap-6 p-0 pb-8 flex flex-col items-center justify-center text-center">
              {/* <img
                src="/logo.png"
                alt="SwiftGoma"
                className="h-10 w-auto object-contain"
              /> */}
              <div className="space-y-0.5 items-center flex flex-col">
                {title && (
                  <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
                    {title}
                  </h1>
                )}
                {description && (
                  <CardDescription className="max-w-sm text-base leading-relaxed flex flex-col text-center">
                    {description}
                  </CardDescription>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0 w-full">{children}</CardContent>
          </div>
          <p className="mt-10 text-center text-sm text-muted-foreground flex items-center justify-center">
            Accès sécurisé à votre espace Protek{" "}
            <ArrowUpRight className="ml-1 inline size-3.5" />
          </p>
        </div>
      </section>

      {/* Section de droite */}
      <section
        className="relative hidden h-[calc(100vh-3rem)] overflow-hidden rounded-3xl bg-primary lg:order-2 lg:flex flex-col justify-end p-12 shadow-xl"
        aria-label="SwiftGoma"
      >
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />

        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

        <div className="relative z-10 max-w-md font-medium leading-relaxed text-white/90 text-base">
          “L'idéal économique des bourgeois est d'augmenter indéfiniment le
          nombre des consommateurs.”
        </div>
      </section>
    </main>
  );
};

export default AuthLayout;
