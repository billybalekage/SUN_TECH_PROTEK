import { Link, useParams } from "react-router-dom";
import { AlertTriangle, ArrowLeft, Check, FileText, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { projectStatusLabels } from "../model";
import { useProject } from "../viewmodel";

function ProjectDetailPage() {
  const { projectId } = useParams();
  const projectQuery = useProject(projectId);

  if (projectQuery.isPending) {
    return <PageMessage message="Chargement du projet..." />;
  }
  if (projectQuery.isError) {
    return <PageMessage message="Impossible de charger ce projet." error />;
  }

  const project = projectQuery.data;
  const installation = project.installation;
  const circuits = installation?.circuits ?? [];
  const uncompliantCount = circuits.filter(
    (circuit) => circuit.calculationResult?.isCompliant === false,
  ).length;

  return (
    <main className="min-h-screen bg-muted/30 px-4 py-8 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-6xl">
        <Button asChild variant="ghost" className="-ml-2 mb-4">
          <Link to="/projects">
            <ArrowLeft aria-hidden="true" />
            Tous les projets
          </Link>
        </Button>

        <header className="flex flex-col gap-5 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              Projet / {projectStatusLabels[project.status] ?? project.status}
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
              {project.clientName}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {[project.address, project.contact].filter(Boolean).join(" · ") ||
                "Aucune adresse ou contact renseigné"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {!installation ? (
              <Button asChild>
                <Link to={`/projects/new?projectId=${project.id}`}>
                  <Plus aria-hidden="true" />
                  Configurer l’installation
                </Link>
              </Button>
            ) : (
              <Button asChild>
                <Link to={`/projects/${project.id}/circuits/new`}>
                  <Plus aria-hidden="true" />
                  Ajouter un circuit
                </Link>
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              disabled
              title="La génération de rapports sera disponible ultérieurement"
            >
              <FileText aria-hidden="true" />
              Rapport bientôt disponible
            </Button>
          </div>
        </header>

        <section className="mt-7 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)]">
          <div className="border-y border-border bg-background p-5">
            <h2 className="font-semibold">Installation</h2>
            {installation ? (
              <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                <DataPoint
                  label="Tension"
                  value={`${installation.nominalVoltage} V`}
                />
                <DataPoint label="Phases" value={installation.phaseType} />
                <DataPoint label="Neutre" value={installation.neutralRegime} />
                <DataPoint
                  label="Distance réseau-TDG"
                  value={
                    installation.networkToTgdDistance
                      ? `${installation.networkToTgdDistance} m`
                      : "Non renseignée"
                  }
                />
                <DataPoint
                  label="Mode de pose"
                  value={installation.installMode ?? "Non renseigné"}
                />
                <DataPoint
                  label="Isolation"
                  value={installation.insulationType ?? "Non renseignée"}
                />
              </dl>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">
                Aucune installation n’est encore rattachée à ce projet.
              </p>
            )}
          </div>

          <div>
            <div className="flex items-end justify-between gap-4 border-b border-border pb-3">
              <div>
                <h2 className="font-semibold">Circuits</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {circuits.length} circuit{circuits.length > 1 ? "s" : ""}
                  {uncompliantCount > 0
                    ? ` · ${uncompliantCount} à vérifier`
                    : ""}
                </p>
              </div>
            </div>
            {!installation ? (
              <p className="py-5 text-sm text-muted-foreground">
                Configurez l’installation avant d’ajouter des circuits.
              </p>
            ) : circuits.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm text-muted-foreground">
                  Aucun circuit dans cette installation.
                </p>
                <Button asChild variant="outline" className="mt-4">
                  <Link to={`/projects/${project.id}/circuits/new`}>
                    <Plus aria-hidden="true" />
                    Ajouter le premier circuit
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {circuits.map((circuit) => (
                  <div
                    key={circuit.id}
                    className="flex flex-wrap items-center justify-between gap-3 py-4"
                  >
                    <div>
                      <p className="font-medium">{circuit.name}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {circuit.circuitType} · {circuit.totalPower} W ·{" "}
                        {circuit.farthestLoadDistance} m
                      </p>
                    </div>
                    <CircuitStatus result={circuit.calculationResult} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function DataPoint({ label, value }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 font-medium">{value}</dd>
    </div>
  );
}

function CircuitStatus({ result }) {
  if (!result) {
    return (
      <span className="rounded-md bg-muted px-2.5 py-1 text-xs">
        À calculer
      </span>
    );
  }

  return result.isCompliant ? (
    <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-900">
      <Check aria-hidden="true" className="size-3.5" />
      Conforme
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 rounded-md bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-950">
      <AlertTriangle aria-hidden="true" className="size-3.5" />À vérifier
    </span>
  );
}

function PageMessage({ message, error = false }) {
  return (
    <main className="grid min-h-[60vh] place-items-center bg-muted/30 p-6">
      <p
        className={
          error ? "text-sm text-destructive" : "text-sm text-muted-foreground"
        }
      >
        {message}
      </p>
    </main>
  );
}

export default ProjectDetailPage;
