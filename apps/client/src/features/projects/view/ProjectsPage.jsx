import { useDeferredValue, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  FolderPlus,
  LoaderCircle,
  Plus,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { projectStatusLabels } from "../model";
import { useProjects } from "../viewmodel";

const dateFormatter = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" });

function ProjectsPage() {
  const projects = useProjects();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [sort, setSort] = useState("NEWEST");
  const deferredSearch = useDeferredValue(
    search.trim().toLocaleLowerCase("fr"),
  );

  const filteredProjects = (projects.data ?? [])
    .filter((project) =>
      project.clientName.toLocaleLowerCase("fr").includes(deferredSearch),
    )
    .filter((project) => status === "ALL" || project.status === status)
    .toSorted((first, second) => {
      const difference =
        new Date(first.updatedAt).getTime() -
        new Date(second.updatedAt).getTime();
      return sort === "NEWEST" ? -difference : difference;
    });

  return (
    <main className="min-h-screen bg-muted/30 px-4 py-8 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Protek / Projets</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
              Mes projets
            </h1>
          </div>
          <Button asChild className="h-10">
            <Link to="/projects/new">
              <Plus aria-hidden="true" />
              Nouveau projet
            </Link>
          </Button>
        </header>

        <div className="my-6 grid gap-3 sm:grid-cols-[minmax(0,1fr)_12rem_12rem]">
          <label className="relative">
            <span className="sr-only">Rechercher un client</span>
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Rechercher un client"
              className="h-10 pl-9"
            />
          </label>
          <label className="grid gap-1 text-xs font-medium text-muted-foreground">
            <span>Statut</span>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="h-10 rounded-lg border border-input bg-background px-3 text-sm text-foreground"
            >
              <option value="ALL">Tous les statuts</option>
              {Object.entries(projectStatusLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-xs font-medium text-muted-foreground">
            <span>Trier par date</span>
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value)}
              className="h-10 rounded-lg border border-input bg-background px-3 text-sm text-foreground"
            >
              <option value="NEWEST">Plus récents</option>
              <option value="OLDEST">Plus anciens</option>
            </select>
          </label>
        </div>

        {projects.isPending ? (
          <div className="flex min-h-56 items-center justify-center gap-2 text-sm text-muted-foreground">
            <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
            Chargement des projets...
          </div>
        ) : projects.isError ? (
          <div
            className="border-l-4 border-destructive bg-background p-5"
            role="alert"
          >
            <p className="font-medium">Impossible de charger les projets.</p>
            <Button
              className="mt-3"
              variant="outline"
              onClick={() => projects.refetch()}
            >
              Réessayer
            </Button>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="flex flex-col items-center border-y border-border bg-background px-5 py-14 text-center">
            <FolderPlus aria-hidden="true" className="size-8 text-sky-800" />
            <h2 className="mt-3 font-semibold">
              {projects.data.length === 0
                ? "Aucun projet pour le moment"
                : "Aucun résultat pour ces filtres"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {projects.data.length === 0
                ? "Créez votre premier projet pour commencer."
                : "Modifiez la recherche ou le statut sélectionné."}
            </p>
            {projects.data.length === 0 && (
              <Button asChild className="mt-4">
                <Link to="/projects/new">
                  <Plus aria-hidden="true" />
                  Créer un projet
                </Link>
              </Button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-border border-y border-border bg-background">
            {filteredProjects.map((project) => (
              <Link
                key={project.id}
                to={`/projects/${project.id}`}
                className="group flex flex-col gap-2 px-3 py-4 transition-colors hover:bg-muted/50 sm:flex-row sm:items-center sm:justify-between"
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium">
                    {project.clientName}
                  </span>
                  <span className="mt-1 block text-sm text-muted-foreground">
                    Modifié le{" "}
                    {dateFormatter.format(new Date(project.updatedAt))}
                  </span>
                </span>
                <span className="flex items-center justify-between gap-4 sm:justify-end">
                  <span className="rounded-md bg-muted px-2.5 py-1 text-xs font-medium">
                    {projectStatusLabels[project.status] ?? project.status}
                  </span>
                  <ArrowRight
                    aria-hidden="true"
                    className="size-4 text-muted-foreground transition-transform group-hover:translate-x-1"
                  />
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

export default ProjectsPage;
