import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  CircleAlert,
  FolderPlus,
  LoaderCircle,
  Plus,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuthSession } from "@/features/auth/hooks/useAuthSession";
import {
  useCreateProject,
  useDashboard,
  useProjectDetails,
} from "../viewmodel";

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  dateStyle: "medium",
});

const statusLabels = {
  DRAFT: "Brouillon",
  IN_PROGRESS: "En cours",
  COMPLETED: "Terminé",
  ARCHIVED: "Archivé",
};

function formatDate(value) {
  return dateFormatter.format(new Date(value));
}

function DashboardView() {
  const navigate = useNavigate();
  const { data: user } = useAuthSession();
  const dashboard = useDashboard();
  const createProject = useCreateProject();
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState(null);

  function handleCreateProject(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    createProject.mutate(
      {
        clientName: String(formData.get("clientName") ?? "").trim(),
        address: String(formData.get("address") ?? "").trim(),
        contact: String(formData.get("contact") ?? "").trim(),
      },
      {
        onSuccess: (project) => {
          form.reset();
          setCreateOpen(false);
          navigate(`/projects/new?projectId=${project.id}`);
        },
      },
    );
  }

  return (
    <main className="min-h-screen bg-muted/30 px-4 py-8 sm:px-8 lg:px-12">
      <div className="mx-auto w-full max-w-6xl">
        <header className="flex flex-col gap-5 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Protek / Espace électricien
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
              Bonjour{user?.fullName ? `, ${user.fullName}` : ""}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Retrouvez vos projets et les points à vérifier.
            </p>
          </div>
          <Button
            className="h-10 w-full sm:w-auto"
            onClick={() => setCreateOpen(true)}
          >
            <Plus aria-hidden="true" />
            Nouveau projet
          </Button>
        </header>

        {dashboard.isPending ? (
          <div className="flex min-h-64 items-center justify-center gap-2 text-sm text-muted-foreground">
            <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
            Chargement de votre espace...
          </div>
        ) : dashboard.isError ? (
          <section
            className="mt-8 flex flex-col items-start gap-3 border-l-4 border-destructive bg-background p-5"
            role="alert"
          >
            <div className="flex items-center gap-2 font-medium">
              <CircleAlert
                aria-hidden="true"
                className="size-5 text-destructive"
              />
              Le tableau de bord n’est pas disponible.
            </div>
            <p className="text-sm text-muted-foreground">
              Vérifiez votre connexion puis réessayez.
            </p>
            <Button variant="outline" onClick={() => dashboard.refetch()}>
              <RefreshCw aria-hidden="true" />
              Réessayer
            </Button>
          </section>
        ) : (
          <>
            <section
              aria-label="Résumé de l'activité"
              className="mt-7 grid border-y border-border bg-background sm:grid-cols-2"
            >
              <div className="flex items-center gap-4 border-b border-border p-5 sm:border-b-0 sm:border-r">
                <span className="grid size-10 place-items-center rounded-lg bg-sky-100 text-sky-800">
                  <BriefcaseBusiness aria-hidden="true" className="size-5" />
                </span>
                <div>
                  <p className="text-sm text-muted-foreground">Projets</p>
                  <p className="text-2xl font-semibold tabular-nums">
                    {dashboard.data.totalProjects}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-5">
                <span className="grid size-10 place-items-center rounded-lg bg-amber-100 text-amber-800">
                  <AlertTriangle aria-hidden="true" className="size-5" />
                </span>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Circuits à vérifier
                  </p>
                  <p className="text-2xl font-semibold tabular-nums">
                    {dashboard.data.nonCompliantCircuits}
                  </p>
                </div>
              </div>
            </section>

            <section className="mt-9" aria-labelledby="recent-projects-heading">
              <div className="flex items-end justify-between gap-4 border-b border-border pb-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Activité
                  </p>
                  <h2
                    id="recent-projects-heading"
                    className="mt-1 text-lg font-semibold"
                  >
                    Projets récents
                  </h2>
                </div>
                <div className="flex items-center gap-4">
                  {dashboard.data.recentProjects.length > 0 && (
                    <span className="text-sm text-muted-foreground">
                      {dashboard.data.recentProjects.length} dernier
                      {dashboard.data.recentProjects.length > 1 ? "s" : ""}
                    </span>
                  )}
                  <Link
                    to="/projects"
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    Tous les projets
                  </Link>
                </div>
              </div>

              {dashboard.data.recentProjects.length === 0 ? (
                <div className="flex flex-col items-center py-16 text-center">
                  <span className="grid size-12 place-items-center rounded-full bg-sky-100 text-sky-800">
                    <FolderPlus aria-hidden="true" className="size-6" />
                  </span>
                  <h3 className="mt-4 text-lg font-semibold">
                    Aucun projet pour le moment
                  </h3>
                  <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                    Créez un projet pour commencer à préparer vos calculs.
                  </p>
                  <Button className="mt-5" onClick={() => setCreateOpen(true)}>
                    <Plus aria-hidden="true" />
                    Créer mon premier projet
                  </Button>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {dashboard.data.recentProjects.map((project) => (
                    <button
                      key={project.id}
                      type="button"
                      onClick={() => setSelectedProjectId(project.id)}
                      className="group flex w-full flex-col gap-3 py-4 text-left transition-colors hover:bg-background sm:flex-row sm:items-center sm:justify-between sm:px-3"
                    >
                      <span className="min-w-0">
                        <span className="block truncate font-medium">
                          {project.clientName}
                        </span>
                        <span className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                          <CalendarDays
                            aria-hidden="true"
                            className="size-3.5"
                          />
                          Modifié le {formatDate(project.updatedAt)}
                        </span>
                      </span>
                      <span className="flex items-center justify-between gap-4 sm:justify-end">
                        <span className="rounded-md bg-muted px-2.5 py-1 text-xs font-medium">
                          {statusLabels[project.status] ?? project.status}
                        </span>
                        <ArrowRight
                          aria-hidden="true"
                          className="size-4 text-muted-foreground transition-transform group-hover:translate-x-1"
                        />
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Nouveau projet</DialogTitle>
            <DialogDescription>
              Saisissez les informations du client; vous pourrez ensuite
              configurer son installation.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateProject} className="grid gap-4">
            <label
              className="grid gap-1.5 text-sm font-medium"
              htmlFor="client-name"
            >
              Nom du client
              <Input
                id="client-name"
                name="clientName"
                required
                minLength={2}
                maxLength={150}
                autoFocus
              />
            </label>
            <label
              className="grid gap-1.5 text-sm font-medium"
              htmlFor="client-address"
            >
              Adresse{" "}
              <span className="font-normal text-muted-foreground">
                (facultatif)
              </span>
              <Input id="client-address" name="address" maxLength={255} />
            </label>
            <label
              className="grid gap-1.5 text-sm font-medium"
              htmlFor="client-contact"
            >
              Contact{" "}
              <span className="font-normal text-muted-foreground">
                (facultatif)
              </span>
              <Input id="client-contact" name="contact" maxLength={150} />
            </label>
            {createProject.isError && (
              <p className="text-sm text-destructive" role="alert">
                {createProject.error?.response?.data?.error?.message ??
                  "La création du projet a échoué. Réessayez."}
              </p>
            )}
            <DialogFooter>
              <Button
                type="submit"
                disabled={createProject.isPending}
                className="w-full sm:w-auto"
              >
                {createProject.isPending ? "Création..." : "Créer le projet"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ProjectDetailDialog
        projectId={selectedProjectId}
        onOpenChange={(open) => {
          if (!open) setSelectedProjectId(null);
        }}
      />
    </main>
  );
}

function ProjectDetailDialog({ projectId, onOpenChange }) {
  const projectQuery = useProjectDetails(projectId);
  const project = projectQuery.data;

  return (
    <Dialog open={Boolean(projectId)} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        {projectQuery.isPending ? (
          <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
            <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
            Chargement du projet...
          </div>
        ) : projectQuery.isError ? (
          <div className="py-5" role="alert">
            <p className="font-medium">Impossible de charger ce projet.</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Vérifiez votre connexion puis réessayez.
            </p>
          </div>
        ) : project ? (
          <>
            <DialogHeader>
              <DialogTitle>{project.clientName}</DialogTitle>
              <DialogDescription>
                Projet {statusLabels[project.status] ?? project.status}
              </DialogDescription>
            </DialogHeader>
            <dl className="grid gap-3 text-sm">
              <div>
                <dt className="text-muted-foreground">Adresse</dt>
                <dd>{project.address || "Non renseignée"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Contact</dt>
                <dd>{project.contact || "Non renseigné"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Installation</dt>
                <dd>
                  {project.installation
                    ? `${project.installation.nominalVoltage} V · ${project.installation.phaseType} · ${project.installation.circuits?.length ?? 0} circuit(s)`
                    : "Aucune installation créée"}
                </dd>
              </div>
              {project.installation?.circuits?.length > 0 && (
                <div>
                  <dt className="text-muted-foreground">
                    Circuits non conformes
                  </dt>
                  <dd className="flex items-center gap-1.5">
                    {project.installation.circuits.filter(
                      (circuit) =>
                        circuit.calculationResult?.isCompliant === false,
                    ).length > 0 ? (
                      <>
                        <AlertTriangle
                          aria-hidden="true"
                          className="size-4 text-amber-700"
                        />
                        {
                          project.installation.circuits.filter(
                            (circuit) =>
                              circuit.calculationResult?.isCompliant === false,
                          ).length
                        }
                      </>
                    ) : (
                      <>
                        <Check
                          aria-hidden="true"
                          className="size-4 text-emerald-700"
                        />
                        Aucun
                      </>
                    )}
                  </dd>
                </div>
              )}
            </dl>
            <Button asChild className="mt-5 w-full">
              <Link to={`/projects/${project.id}`}>Ouvrir la fiche projet</Link>
            </Button>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

export default DashboardView;
