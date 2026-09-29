import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  LoaderCircle,
  Plus,
  Play,
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
import { usageLocationLabels } from "@/features/installation/model";
import {
  useAssignCircuitToDifferentialDevice,
  useCreateDifferentialDevice,
  useDifferentialDeviceCoverage,
  useDifferentialDevices,
} from "@/features/installation/viewmodel";
import { useProject } from "@/features/projects/viewmodel";
import { useCalculateCircuit, useCreateCircuit } from "../viewmodel";

function errorMessage(error, fallback) {
  const validationDetails = error?.response?.data?.details;

  return (
    error?.response?.data?.error?.message ??
    error?.response?.data?.message ??
    (Array.isArray(validationDetails) ? validationDetails.join(" ") : null) ??
    fallback
  );
}

function CircuitCalculationPage() {
  const { projectId } = useParams();
  const projectQuery = useProject(projectId);
  const installationId = projectQuery.data?.installation?.id;
  const differentialDevicesQuery = useDifferentialDevices(installationId);
  const createCircuit = useCreateCircuit(projectId);
  const calculateCircuit = useCalculateCircuit(projectId);
  const createDifferentialDevice = useCreateDifferentialDevice(
    projectId,
    installationId,
  );
  const assignCircuit = useAssignCircuitToDifferentialDevice(projectId);
  const [createdCircuit, setCreatedCircuit] = useState(null);
  const [selectedDeviceId, setSelectedDeviceId] = useState("");
  const [assignmentDeviceId, setAssignmentDeviceId] = useState("");
  const [deviceDialogOpen, setDeviceDialogOpen] = useState(false);
  const differentialDevices = differentialDevicesQuery.data ?? [];
  const selectedDevice =
    differentialDevices.find((device) => device.id === selectedDeviceId) ??
    differentialDevices[0];
  const activeDeviceId = selectedDevice?.id ?? "";
  const coverageQuery = useDifferentialDeviceCoverage(activeDeviceId);

  function submitDifferentialDevice(event) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    createDifferentialDevice.mutate(
      {
        installationId,
        sensitivityMa: Number(formData.get("sensitivityMa")),
        type: String(formData.get("type")),
        isSelectiveType: formData.get("isSelectiveType") === "on",
        ratedCurrent: Number(formData.get("ratedCurrent")),
      },
      {
        onSuccess: (device) => {
          setSelectedDeviceId(device.id);
          setDeviceDialogOpen(false);
        },
      },
    );
  }

  function submitCircuit(event) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    createCircuit.mutate(
      {
        installationId: projectQuery.data.installation.id,
        name: String(formData.get("name")).trim(),
        circuitType: String(formData.get("circuitType")),
        totalPower: Number(formData.get("totalPower")),
        farthestLoadDistance: Number(formData.get("farthestLoadDistance")),
        cosPhi: Number(formData.get("cosPhi")),
        numberOfCircuits: Number(formData.get("numberOfCircuits")),
        usageLocation: String(formData.get("usageLocation")),
      },
      {
        onSuccess: (circuit) => {
          setCreatedCircuit(circuit);
          setAssignmentDeviceId(activeDeviceId);
          assignCircuit.mutate({
            circuitId: circuit.id,
            differentialDeviceId: activeDeviceId,
          });
        },
      },
    );
  }

  function retryAssignment() {
    if (!createdCircuit || !assignmentDeviceId) return;
    assignCircuit.mutate({
      circuitId: createdCircuit.id,
      differentialDeviceId: assignmentDeviceId,
    });
  }

  if (projectQuery.isPending) {
    return <PageMessage>Chargement du projet...</PageMessage>;
  }
  if (projectQuery.isError) {
    return <PageMessage error>Impossible de charger ce projet.</PageMessage>;
  }
  if (!projectQuery.data.installation) {
    return (
      <PageMessage>
        <p>Configurez l’installation avant d’ajouter un circuit.</p>
        <Button asChild className="mt-4">
          <Link to={`/projects/new?projectId=${projectId}`}>
            Configurer l’installation
          </Link>
        </Button>
      </PageMessage>
    );
  }

  const calculation = calculateCircuit.data;

  return (
    <main className="min-h-screen bg-muted/30 px-4 py-8 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-3xl">
        <Button asChild variant="ghost" className="-ml-2 mb-4">
          <Link to={`/projects/${projectId}`}>
            <ArrowLeft aria-hidden="true" />
            Retour au projet
          </Link>
        </Button>
        <header className="border-b border-border pb-5">
          <p className="text-sm text-muted-foreground">
            {projectQuery.data.clientName} / Calcul
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">
            Nouveau circuit
          </h1>
        </header>

        {!createdCircuit ? (
          <>
            <section className="mt-6 border-y border-border bg-background p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="font-semibold">Protection différentielle</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Chaque circuit doit être rattaché à un DDR de cette
                    installation.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDeviceDialogOpen(true)}
                >
                  <Plus aria-hidden="true" />
                  Créer un DDR
                </Button>
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <FormSelect
                  id="differentialDeviceId"
                  name="differentialDeviceId"
                  label="DDR assigné"
                  value={activeDeviceId}
                  onChange={(event) => setSelectedDeviceId(event.target.value)}
                  disabled={differentialDevicesQuery.isPending}
                  required
                  options={[
                    ["", "Sélectionner un DDR"],
                    ...differentialDevices.map((device) => [
                      device.id,
                      `${device.sensitivityMa} mA · type ${device.type} · ${device.ratedCurrent} A${device.isSelectiveType ? " · sélectif" : ""}`,
                    ]),
                  ]}
                />
                {selectedDevice && (
                  <div className="self-end text-sm" aria-live="polite">
                    {coverageQuery.isPending ? (
                      <p className="text-muted-foreground">
                        Vérification de la couverture...
                      </p>
                    ) : coverageQuery.isError ? (
                      <p className="text-destructive" role="alert">
                        {errorMessage(
                          coverageQuery.error,
                          "La couverture du DDR n’a pas pu être vérifiée.",
                        )}
                      </p>
                    ) : (selectedDevice.circuits ?? []).length === 0 ? (
                      <p className="text-muted-foreground">
                        Aucun circuit affecté à ce DDR
                      </p>
                    ) : coverageQuery.data ? (
                      <p
                        className={
                          coverageQuery.data.isCompliant
                            ? "font-medium text-emerald-800"
                            : "font-medium text-amber-800"
                        }
                      >
                        {coverageQuery.data.isCompliant
                          ? "Couverture conforme"
                          : "Couverture à vérifier"}
                      </p>
                    ) : null}
                  </div>
                )}
              </div>
              {differentialDevicesQuery.isError && (
                <p className="mt-3 text-sm text-destructive" role="alert">
                  {errorMessage(
                    differentialDevicesQuery.error,
                    "Impossible de charger les DDR de l’installation.",
                  )}
                </p>
              )}
              {createDifferentialDevice.isError && (
                <p className="mt-3 text-sm text-destructive" role="alert">
                  {errorMessage(
                    createDifferentialDevice.error,
                    "La création du DDR a échoué.",
                  )}
                </p>
              )}
            </section>
            <form
              onSubmit={submitCircuit}
              className="mt-6 grid gap-4 sm:grid-cols-2"
            >
              <FormInput
                id="name"
                name="name"
                label="Nom du circuit"
                type="text"
                maxLength={100}
                required
                className="sm:col-span-2"
              />
              <label
                htmlFor="circuitType"
                className="grid gap-1.5 text-sm font-medium sm:col-span-2"
              >
                Type de circuit
                <select
                  id="circuitType"
                  name="circuitType"
                  required
                  className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
                >
                  <option value="ECLAIRAGE">Éclairage</option>
                  <option value="AUTRES_USAGES">Autres usages</option>
                </select>
              </label>
              <FormSelect
                id="usageLocation"
                name="usageLocation"
                label="Emplacement d’usage"
                options={Object.entries(usageLocationLabels)}
              />
              <FormInput
                id="totalPower"
                name="totalPower"
                label="Puissance totale (W)"
                type="number"
                min="0.01"
                step="any"
                required
              />
              <FormInput
                id="farthestLoadDistance"
                name="farthestLoadDistance"
                label="Distance de la charge la plus éloignée (m)"
                type="number"
                min="0.01"
                step="any"
                required
              />
              <FormInput
                id="cosPhi"
                name="cosPhi"
                label="Facteur de puissance (cos φ)"
                type="number"
                min="0.01"
                max="1"
                step="0.01"
                defaultValue="0.8"
                required
              />
              <FormInput
                id="numberOfCircuits"
                name="numberOfCircuits"
                label="Circuits groupés"
                type="number"
                min="1"
                step="1"
                defaultValue="1"
                required
              />
              {createCircuit.isError && (
                <p
                  className="text-sm text-destructive sm:col-span-2"
                  role="alert"
                >
                  {errorMessage(
                    createCircuit.error,
                    "La création du circuit a échoué.",
                  )}
                </p>
              )}
              <Button
                type="submit"
                disabled={
                  createCircuit.isPending ||
                  assignCircuit.isPending ||
                  !activeDeviceId
                }
                className="h-10 justify-self-start sm:col-span-2"
              >
                {createCircuit.isPending || assignCircuit.isPending
                  ? "Enregistrement..."
                  : "Créer le circuit"}
              </Button>
            </form>
          </>
        ) : (
          <section className="mt-6 space-y-5">
            <div className="flex flex-col gap-3 border-y border-border bg-background p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium">{createdCircuit.name}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {createdCircuit.circuitType} · prêt pour le calcul.
                </p>
              </div>
              {assignCircuit.isError ? (
                <Button
                  onClick={retryAssignment}
                  disabled={assignCircuit.isPending}
                  className="h-10"
                >
                  {assignCircuit.isPending
                    ? "Assignation..."
                    : "Réessayer l’assignation"}
                </Button>
              ) : assignCircuit.isPending ? (
                <Button disabled className="h-10">
                  <LoaderCircle aria-hidden="true" className="animate-spin" />
                  Assignation au DDR...
                </Button>
              ) : (
                <Button
                  onClick={() =>
                    calculateCircuit.mutate(createdCircuit.id, {
                      onSuccess: () => setCreatedCircuit(null),
                    })
                  }
                  disabled={calculateCircuit.isPending}
                  className="h-10"
                >
                  {calculateCircuit.isPending ? (
                    <LoaderCircle aria-hidden="true" className="animate-spin" />
                  ) : (
                    <Play aria-hidden="true" />
                  )}
                  {calculateCircuit.isPending
                    ? "Calcul..."
                    : "Lancer le calcul"}
                </Button>
              )}
            </div>
            {assignCircuit.isError && (
              <p className="text-sm text-destructive" role="alert">
                Le circuit a été créé, mais son assignation au DDR a échoué.{" "}
                {errorMessage(assignCircuit.error, "Réessayez l’assignation.")}
              </p>
            )}
            {calculateCircuit.isError && (
              <p className="text-sm text-destructive" role="alert">
                {errorMessage(calculateCircuit.error, "Le calcul a échoué.")}
              </p>
            )}
          </section>
        )}

        {calculation && <CalculationResult result={calculation} />}
      </div>
      <Dialog open={deviceDialogOpen} onOpenChange={setDeviceDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouveau dispositif différentiel</DialogTitle>
            <DialogDescription>
              Le DDR sera enregistré dans cette installation.
            </DialogDescription>
          </DialogHeader>
          <form
            id="differential-device-form"
            onSubmit={submitDifferentialDevice}
            className="grid gap-4"
          >
            <FormSelect
              id="sensitivityMa"
              name="sensitivityMa"
              label="Sensibilité différentielle (mA)"
              options={[
                ["10", "10 mA"],
                ["30", "30 mA"],
                ["100", "100 mA"],
                ["300", "300 mA"],
                ["500", "500 mA"],
                ["1000", "1000 mA"],
              ]}
            />
            <FormSelect
              id="deviceType"
              name="type"
              label="Type différentiel"
              options={[
                ["A", "Type A"],
                ["AC", "Type AC"],
                ["F", "Type F"],
              ]}
            />
            <FormInput
              id="ratedCurrent"
              name="ratedCurrent"
              label="Calibre (A)"
              type="number"
              min="1"
              step="1"
              defaultValue="40"
              required
            />
            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                name="isSelectiveType"
                type="checkbox"
                className="size-4 accent-primary"
              />
              Type sélectif
            </label>
          </form>
          {createDifferentialDevice.isError && (
            <p className="text-sm text-destructive" role="alert">
              {errorMessage(
                createDifferentialDevice.error,
                "La création du DDR a échoué.",
              )}
            </p>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={createDifferentialDevice.isPending}
              onClick={() => setDeviceDialogOpen(false)}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              form="differential-device-form"
              disabled={createDifferentialDevice.isPending}
            >
              {createDifferentialDevice.isPending
                ? "Création..."
                : "Créer le DDR"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}

function CalculationResult({ result }) {
  const compliant = result.isCompliant;

  return (
    <section className="mt-8" aria-labelledby="calculation-result-heading">
      <div className="border-b border-border pb-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Résultat
        </p>
        <h2
          id="calculation-result-heading"
          className="mt-1 text-lg font-semibold"
        >
          Dimensionnement du circuit
        </h2>
      </div>

      <div className="mt-4 grid grid-cols-2 border-y border-border bg-background sm:grid-cols-3">
        <ResultValue label="Courant d’emploi Ib" value={`${result.ib} A`} />
        <ResultValue label="Protection In" value={`${result.inCurrent} A`} />
        <ResultValue
          label="Intensité Iz corrigée"
          value={`${result.izCurrent} A`}
        />
        <ResultValue
          label="Section retenue"
          value={`${result.sectionMm2} mm²`}
        />
        <ResultValue
          label="Chute de tension ΔU"
          value={`${result.deltaUPercent} %`}
        />
        <ResultValue label="Court-circuit Icc" value={`${result.icc} A`} />
      </div>

      <div
        className={`mt-5 border-l-4 p-5 ${compliant ? "border-emerald-600 bg-emerald-50" : "border-amber-600 bg-amber-50"}`}
        role={compliant ? "status" : "alert"}
      >
        <div className="flex items-center gap-2 font-semibold">
          {compliant ? (
            <Check aria-hidden="true" className="size-5 text-emerald-800" />
          ) : (
            <AlertTriangle
              aria-hidden="true"
              className="size-5 text-amber-800"
            />
          )}
          {compliant ? "Circuit conforme" : "Conformité à vérifier"}
        </div>
        {!compliant &&
          (result.reasons?.length ? (
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
              {result.reasons.map((reason, index) => (
                <li key={`${index}-${reason}`}>{reason}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm">
              Le circuit ne respecte pas les critères de coordination.
            </p>
          ))}
      </div>
    </section>
  );
}

function ResultValue({ label, value }) {
  return (
    <div className="border-b border-r border-border p-4 last:border-r-0">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function FormInput({ id, name, label, className, ...props }) {
  return (
    <label
      htmlFor={id}
      className={`grid gap-1.5 text-sm font-medium ${className ?? ""}`}
    >
      {label}
      <Input id={id} name={name} className="h-10" {...props} />
    </label>
  );
}

function FormSelect({ id, name, label, options, ...props }) {
  return (
    <label htmlFor={id} className="grid gap-1.5 text-sm font-medium">
      {label}
      <select
        id={id}
        name={name}
        className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
        {...props}
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

function PageMessage({ children, error = false }) {
  return (
    <main className="grid min-h-[60vh] place-content-center bg-muted/30 p-6 text-center">
      <div
        className={
          error ? "text-sm text-destructive" : "text-sm text-muted-foreground"
        }
      >
        {children}
      </div>
    </main>
  );
}

export default CircuitCalculationPage;
