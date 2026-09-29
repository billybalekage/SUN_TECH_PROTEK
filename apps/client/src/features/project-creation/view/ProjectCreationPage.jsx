import { useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Check, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useProject } from "@/features/projects/viewmodel";
import { useCreateInstallation, useCreateProject } from "../viewmodel";

function getErrorMessage(error, fallback) {
  return (
    error?.response?.data?.error?.message ??
    error?.response?.data?.message ??
    fallback
  );
}

function ProjectCreationPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const existingProjectId = searchParams.get("projectId");
  const existingProjectQuery = useProject(existingProjectId);
  const [createdProject, setCreatedProject] = useState(null);
  const createProject = useCreateProject();
  const createInstallation = useCreateInstallation();
  const project = createdProject ?? existingProjectQuery.data;

  function submitProject(event) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    createProject.mutate(
      {
        clientName: String(formData.get("clientName") ?? "").trim(),
        address: String(formData.get("address") ?? "").trim(),
        contact: String(formData.get("contact") ?? "").trim(),
      },
      { onSuccess: setCreatedProject },
    );
  }

  function submitInstallation(event) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const distance = String(formData.get("networkToTgdDistance") ?? "").trim();
    createInstallation.mutate(
      {
        projectId: project.id,
        nominalVoltage: Number(formData.get("nominalVoltage")),
        phaseType: formData.get("phaseType"),
        neutralRegime: formData.get("neutralRegime"),
        ...(distance ? { networkToTgdDistance: Number(distance) } : {}),
        installMode: formData.get("installMode"),
        insulationType: formData.get("insulationType"),
        generalProtectionRating: Number(
          formData.get("generalProtectionRating"),
        ),
        generalProtectionType: formData.get("generalProtectionType"),
      },
      {
        onSuccess: () => navigate(`/projects/${project.id}`, { replace: true }),
      },
    );
  }

  if (existingProjectId && existingProjectQuery.isPending && !project) {
    return <CreationMessage>Chargement du projet...</CreationMessage>;
  }
  if (existingProjectId && existingProjectQuery.isError) {
    return (
      <CreationMessage error>Impossible de charger ce projet.</CreationMessage>
    );
  }
  if (project?.installation) {
    return <Navigate to={`/projects/${project.id}`} replace />;
  }

  return (
    <main className="min-h-screen bg-muted/30 px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-2xl">
        <Button asChild variant="ghost" className="-ml-2 mb-4">
          <Link to={project ? `/projects/${project.id}` : "/dashboard"}>
            <ArrowLeft aria-hidden="true" />
            {project ? "Retour au projet" : "Retour au dashboard"}
          </Link>
        </Button>

        <header className="border-b border-border pb-5">
          <p className="text-sm text-muted-foreground">Nouveau projet</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">
            {project ? "Configurer l’installation" : "Créer un projet"}
          </h1>
          <div className="mt-5 grid grid-cols-2 gap-2 text-sm">
            <StepIndicator
              active={!project}
              complete={Boolean(project)}
              number="1"
              label="Client"
            />
            <StepIndicator
              active={Boolean(project)}
              number="2"
              label="Installation"
            />
          </div>
        </header>

        {!project ? (
          <form onSubmit={submitProject} className="mt-6 grid gap-4">
            <p className="text-sm text-muted-foreground">
              Renseignez les informations générales du client.
            </p>
            <FormInput
              id="clientName"
              name="clientName"
              label="Nom du client"
              required
              minLength={2}
              maxLength={150}
            />
            <FormInput
              id="address"
              name="address"
              label="Adresse"
              maxLength={255}
            />
            <FormInput
              id="contact"
              name="contact"
              label="Contact"
              maxLength={150}
            />
            {createProject.isError && (
              <p className="text-sm text-destructive" role="alert">
                {getErrorMessage(createProject.error, "La création a échoué.")}
              </p>
            )}
            <Button
              type="submit"
              disabled={createProject.isPending}
              className="h-10 justify-self-start"
            >
              {createProject.isPending
                ? "Création..."
                : "Continuer vers l’installation"}
            </Button>
          </form>
        ) : (
          <form
            onSubmit={submitInstallation}
            className="mt-6 grid gap-4 sm:grid-cols-2"
          >
            <p className="text-sm text-muted-foreground sm:col-span-2">
              Installation du projet « {project.clientName} ».
            </p>
            <FormInput
              id="nominalVoltage"
              name="nominalVoltage"
              label="Tension nominale (V)"
              type="number"
              min="1"
              step="any"
              defaultValue="230"
              required
            />
            <FormInput
              id="networkToTgdDistance"
              name="networkToTgdDistance"
              label="Distance réseau-TDG (m)"
              type="number"
              min="0.01"
              step="any"
            />
            <FormSelect
              id="phaseType"
              name="phaseType"
              label="Phases"
              options={[
                ["1N", "Monophasé (1N)"],
                ["3N", "Triphasé (3N)"],
              ]}
            />
            <FormSelect
              id="neutralRegime"
              name="neutralRegime"
              label="Régime de neutre"
              options={[
                ["TT", "TT"],
                ["TN", "TN"],
                ["IT", "IT"],
              ]}
            />
            <FormSelect
              id="installMode"
              name="installMode"
              label="Mode de pose"
              options={[
                ["B1", "B1 · Conduit encastré"],
                ["C", "C · Sur paroi"],
              ]}
            />
            <FormSelect
              id="insulationType"
              name="insulationType"
              label="Isolation"
              options={[
                ["PVC", "PVC"],
                ["PR", "PR"],
              ]}
            />
            <FormInput
              id="generalProtectionRating"
              name="generalProtectionRating"
              label="Calibre de la protection générale (A)"
              type="number"
              min="1"
              step="1"
              defaultValue="40"
              required
            />
            <FormSelect
              id="generalProtectionType"
              name="generalProtectionType"
              label="Type différentiel général"
              options={[
                ["A", "Type A"],
                ["AC", "Type AC"],
                ["F", "Type F"],
              ]}
            />
            {createInstallation.isError && (
              <p
                className="text-sm text-destructive sm:col-span-2"
                role="alert"
              >
                {getErrorMessage(
                  createInstallation.error,
                  "La création de l’installation a échoué.",
                )}
              </p>
            )}
            <div className="flex flex-col gap-2 sm:col-span-2 sm:flex-row sm:items-center">
              <Button
                type="submit"
                disabled={createInstallation.isPending}
                className="h-10"
              >
                {createInstallation.isPending
                  ? "Enregistrement..."
                  : "Créer l’installation"}
              </Button>
              <p className="text-xs text-muted-foreground">
                Méthodes d’ampacité actuellement disponibles : B1 et C.
              </p>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}

function FormInput({ id, name, label, ...props }) {
  return (
    <label htmlFor={id} className="grid gap-1.5 text-sm font-medium">
      {label}
      <Input id={id} name={name} className="h-10" {...props} />
    </label>
  );
}

function FormSelect({ id, name, label, options }) {
  return (
    <label htmlFor={id} className="grid gap-1.5 text-sm font-medium">
      {label}
      <select
        id={id}
        name={name}
        required
        defaultValue={options[0][0]}
        className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
      >
        {options.map(([value, title]) => (
          <option key={value} value={value}>
            {title}
          </option>
        ))}
      </select>
    </label>
  );
}

function StepIndicator({ active, complete, number, label }) {
  return (
    <div
      className={`flex items-center gap-2 border-b-2 pb-2 ${active || complete ? "border-primary text-foreground" : "border-border text-muted-foreground"}`}
    >
      <span className="grid size-6 place-items-center rounded-full bg-muted text-xs">
        {complete ? <Check aria-hidden="true" className="size-3.5" /> : number}
      </span>
      {label}
    </div>
  );
}

function CreationMessage({ children, error = false }) {
  return (
    <main className="grid min-h-[60vh] place-items-center bg-muted/30 p-6">
      <div className="flex items-center gap-2 text-sm">
        {!error && (
          <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
        )}
        <p className={error ? "text-destructive" : "text-muted-foreground"}>
          {children}
        </p>
      </div>
    </main>
  );
}

export default ProjectCreationPage;
