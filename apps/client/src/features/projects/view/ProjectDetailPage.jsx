import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  CircleCheck,
  FileText,
  LoaderCircle,
  Eye,
  Pencil,
  Play,
  Plus,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  circuitTypeLabels,
  usageLocationLabels,
} from "@/features/installation/model";
import {
  useComputeDifferentialDeviceRating,
  useDeviceCoverageReports,
  useDifferentialDevices,
  useInstallationSelectivity,
} from "@/features/installation/viewmodel";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { projectStatusLabels } from "../model";
import { useProject } from "../viewmodel";
import { useGenerateProjectReport } from "@/features/report/viewmodel";
import {
  useCalculateCircuit,
  useDeleteCircuit,
  useUpdateCircuit,
  useValidateCircuit,
} from "@/features/calculation/viewmodel";

function getErrorMessage(error, fallback) {
  const validationDetails = error?.response?.data?.details;

  return (
    error?.response?.data?.error?.message ??
    error?.response?.data?.message ??
    (Array.isArray(validationDetails) ? validationDetails.join(" ") : null) ??
    fallback
  );
}

function ProjectDetailPage() {
  const { projectId } = useParams();
  const projectQuery = useProject(projectId);
  const installationId = projectQuery.data?.installation?.id;
  const differentialDevicesQuery = useDifferentialDevices(installationId);
  const differentialDevices = differentialDevicesQuery.data ?? [];
  const coverageQueries = useDeviceCoverageReports(differentialDevices);
  const selectivityQuery = useInstallationSelectivity(installationId);
  const computeDeviceRating = useComputeDifferentialDeviceRating(projectId);
  const calculateCircuit = useCalculateCircuit(projectId);
  const validateCircuit = useValidateCircuit(projectId);
  const updateCircuit = useUpdateCircuit(projectId);
  const deleteCircuit = useDeleteCircuit(projectId);
  const generateProjectReport = useGenerateProjectReport();
  const [editingCircuit, setEditingCircuit] = useState(null);
  const [deletingCircuit, setDeletingCircuit] = useState(null);
  const [viewingCircuit, setViewingCircuit] = useState(null);

  function submitCircuitUpdate(event) {
    event.preventDefault();
    if (!editingCircuit) return;

    const formData = new FormData(event.currentTarget);
    updateCircuit.mutate(
      {
        circuitId: editingCircuit.id,
        data: {
          name: String(formData.get("name")).trim(),
          circuitType: String(formData.get("circuitType")),
          totalPower: Number(formData.get("totalPower")),
          farthestLoadDistance: Number(formData.get("farthestLoadDistance")),
          cosPhi: Number(formData.get("cosPhi")),
          numberOfCircuits: Number(formData.get("numberOfCircuits")),
          usageLocation: String(formData.get("usageLocation")),
          breakerTripCurve: String(formData.get("breakerTripCurve")) || null,
        },
      },
      { onSuccess: () => setEditingCircuit(null) },
    );
  }

  if (projectQuery.isPending) {
    return <PageMessage message="Chargement du projet..." />;
  }
  if (projectQuery.isError) {
    return <PageMessage message="Impossible de charger ce projet." error />;
  }

  const project = projectQuery.data;
  const installation = project.installation;
  const circuits = installation?.circuits ?? [];
  const calculatedCircuits = circuits.filter(
    (circuit) => circuit.calculationResult,
  );
  const uncalculatedCircuits = circuits.filter(
    (circuit) => !circuit.calculationResult,
  );
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
              disabled={generateProjectReport.isPending}
              onClick={() => generateProjectReport.mutate(project.id)}
              title="Télécharger le rapport PDF du projet"
            >
              {generateProjectReport.isPending ? (
                <LoaderCircle aria-hidden="true" className="animate-spin" />
              ) : (
                <FileText aria-hidden="true" />
              )}
              {generateProjectReport.isPending
                ? "Génération..."
                : "Télécharger le rapport"}
            </Button>
            {generateProjectReport.isError && (
              <p className="mt-3 text-sm text-destructive" role="alert">
                {getErrorMessage(
                  generateProjectReport.error,
                  "La génération du rapport a échoué.",
                )}
              </p>
            )}
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
                <DataPoint
                  label="Protection générale"
                  value={
                    installation.generalProtectionRating
                      ? `${installation.generalProtectionRating} A · type ${installation.generalProtectionType ?? "non renseigné"}`
                      : "À calculer après dimensionnement des circuits"
                  }
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
                  {calculatedCircuits.length} calculé
                  {calculatedCircuits.length > 1 ? "s" : ""} ·{" "}
                  {uncalculatedCircuits.length} non calculé
                  {uncalculatedCircuits.length > 1 ? "s" : ""}
                  {uncompliantCount > 0
                    ? ` · ${uncompliantCount} non conforme(s)`
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
                {calculatedCircuits.length > 0 && (
                  <section aria-labelledby="calculated-circuits-heading">
                    <h3
                      id="calculated-circuits-heading"
                      className="border-b border-border py-3 text-sm font-semibold"
                    >
                      Circuits calculés ({calculatedCircuits.length})
                    </h3>
                    {calculatedCircuits.map((circuit) => (
                      <div
                        key={circuit.id}
                        className="flex flex-col gap-3 border-b border-border py-4 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div>
                          <p className="font-medium">{circuit.name}</p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {circuit.circuitType} · {circuit.totalPower} W ·{" "}
                            {circuit.farthestLoadDistance} m
                          </p>
                          <CircuitProtectionDetails circuit={circuit} />
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <CircuitStatus result={circuit.calculationResult} />
                          {circuit.validatedAt ? (
                            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-900">
                              <CircleCheck
                                aria-hidden="true"
                                className="size-3.5"
                              />
                              Validé
                            </span>
                          ) : (
                            <Button
                              type="button"
                              size="sm"
                              disabled={validateCircuit.isPending}
                              onClick={() => validateCircuit.mutate(circuit.id)}
                            >
                              {validateCircuit.isPending &&
                              validateCircuit.variables === circuit.id ? (
                                <LoaderCircle
                                  aria-hidden="true"
                                  className="animate-spin"
                                />
                              ) : (
                                <CircleCheck aria-hidden="true" />
                              )}
                              Valider le calcul
                            </Button>
                          )}
                          <Button
                            type="button"
                            size="sm"
                            disabled={calculateCircuit.isPending}
                            onClick={() =>
                              calculateCircuit.mutate(circuit.id, {
                                onSuccess: (result) =>
                                  setViewingCircuit((current) =>
                                    current?.id === circuit.id
                                      ? {
                                          ...current,
                                          calculationResult: result,
                                          differentialDevice:
                                            result.differentialDevice ??
                                            current.differentialDevice,
                                        }
                                      : current,
                                  ),
                              })
                            }
                          >
                            {calculateCircuit.isPending &&
                            calculateCircuit.variables === circuit.id ? (
                              <LoaderCircle
                                aria-hidden="true"
                                className="animate-spin"
                              />
                            ) : (
                              <Play aria-hidden="true" />
                            )}
                            Recalculer
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => setViewingCircuit(circuit)}
                          >
                            <Eye aria-hidden="true" />
                            Voir les résultats
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingCircuit(circuit)}
                          >
                            <Pencil aria-hidden="true" />
                            Modifier
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="destructive"
                            onClick={() => setDeletingCircuit(circuit)}
                          >
                            <Trash2 aria-hidden="true" />
                            Supprimer
                          </Button>
                        </div>
                      </div>
                    ))}
                  </section>
                )}
                {uncalculatedCircuits.length > 0 && (
                  <section aria-labelledby="uncalculated-circuits-heading">
                    <h3
                      id="uncalculated-circuits-heading"
                      className="border-b border-border py-3 text-sm font-semibold"
                    >
                      Circuits non calculés ({uncalculatedCircuits.length})
                    </h3>
                    {uncalculatedCircuits.map((circuit) => (
                      <div
                        key={circuit.id}
                        className="flex flex-col gap-3 border-b border-border py-4 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div>
                          <p className="font-medium">{circuit.name}</p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {circuit.circuitType} · {circuit.totalPower} W ·{" "}
                            {circuit.farthestLoadDistance} m
                          </p>
                          <CircuitProtectionDetails circuit={circuit} />
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-md bg-muted px-2.5 py-1 text-xs">
                            Non calculé
                          </span>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => setViewingCircuit(circuit)}
                          >
                            <Eye aria-hidden="true" />
                            Détails
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            disabled={calculateCircuit.isPending}
                            onClick={() => calculateCircuit.mutate(circuit.id)}
                          >
                            {calculateCircuit.isPending &&
                            calculateCircuit.variables === circuit.id ? (
                              <LoaderCircle
                                aria-hidden="true"
                                className="animate-spin"
                              />
                            ) : (
                              <Play aria-hidden="true" />
                            )}
                            Lancer le calcul
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingCircuit(circuit)}
                          >
                            <Pencil aria-hidden="true" />
                            Modifier
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="destructive"
                            onClick={() => setDeletingCircuit(circuit)}
                          >
                            <Trash2 aria-hidden="true" />
                            Supprimer
                          </Button>
                        </div>
                      </div>
                    ))}
                  </section>
                )}
              </div>
            )}
            {(calculateCircuit.isError ||
              validateCircuit.isError ||
              updateCircuit.isError ||
              deleteCircuit.isError) && (
              <p className="mt-3 text-sm text-destructive" role="alert">
                {getErrorMessage(
                  calculateCircuit.error ??
                    validateCircuit.error ??
                    updateCircuit.error ??
                    deleteCircuit.error,
                  "Une action sur le circuit a échoué.",
                )}
              </p>
            )}
          </div>
        </section>
        {installation && (
          <section
            className="mt-8 border-y border-border"
            aria-labelledby="differential-devices-heading"
          >
            <div className="flex flex-col gap-3 border-b border-border py-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 id="differential-devices-heading" className="font-semibold">
                  Dispositifs différentiels
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {differentialDevices.length} DDR · {circuits.length} circuits
                </p>
              </div>
              {selectivityQuery.data && (
                <p
                  className={`text-sm font-medium ${selectivityQuery.data.isCompliant ? "text-emerald-800" : "text-amber-800"}`}
                  role={selectivityQuery.data.isCompliant ? "status" : "alert"}
                >
                  Sélectivité générale :{" "}
                  {selectivityQuery.data.perDevice?.some(
                    (device) => !device.isRated,
                  )
                    ? "à calculer après dimensionnement des DDR"
                    : selectivityQuery.data.isCompliant
                      ? "conforme"
                      : "à vérifier"}{" "}
                  · hypothèse amont sélectif{" "}
                  {selectivityQuery.data.assumption.upstreamSensitivityMa} mA
                </p>
              )}
            </div>
            {differentialDevicesQuery.isPending ? (
              <p className="py-4 text-sm text-muted-foreground">
                Chargement des DDR...
              </p>
            ) : differentialDevicesQuery.isError ? (
              <p className="py-4 text-sm text-destructive" role="alert">
                {getErrorMessage(
                  differentialDevicesQuery.error,
                  "Impossible de charger les DDR.",
                )}
              </p>
            ) : differentialDevices.length === 0 ? (
              <p className="py-4 text-sm text-muted-foreground">
                Aucun DDR n’est encore configuré. Il sera créé automatiquement
                lors de l’ajout du premier circuit.
              </p>
            ) : (
              <div className="divide-y divide-border">
                {differentialDevices.map((device, index) => {
                  const coverageQuery = coverageQueries[index];
                  const isDeviceRated =
                    Number.isInteger(device.sensitivityMa) &&
                    typeof device.type === "string" &&
                    Number.isInteger(device.ratedCurrent);
                  return (
                    <div
                      key={device.id}
                      className="grid gap-3 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
                    >
                      <div>
                        <p className="font-medium">
                          {device.sensitivityMa != null
                            ? `${device.sensitivityMa} mA · type ${device.type} · ${device.ratedCurrent} A`
                            : `${device.label || "DDR"} · À dimensionner`}
                          {device.isSelectiveType ? " · sélectif" : ""}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {(device.circuits ?? []).length} circuit(s) protégé(s)
                          {(device.circuits ?? []).length > 0 && ": "}
                          {(device.circuits ?? [])
                            .map((circuit) => circuit.name)
                            .filter(Boolean)
                            .join(", ")}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-sm">
                        {(device.circuits ?? []).length === 0 ? (
                          <span className="text-muted-foreground">
                            Aucun circuit affecté
                          </span>
                        ) : !isDeviceRated ? (
                          <span className="text-amber-800">À dimensionner</span>
                        ) : coverageQuery?.isPending ? (
                          <span className="text-muted-foreground">
                            Vérification...
                          </span>
                        ) : coverageQuery?.isError ? (
                          <span className="text-destructive" role="alert">
                            Vérification indisponible
                          </span>
                        ) : coverageQuery?.data ? (
                          <span
                            className={`font-medium ${coverageQuery.data.isCompliant ? "text-emerald-800" : "text-amber-800"}`}
                            role={
                              coverageQuery.data.isCompliant
                                ? "status"
                                : "alert"
                            }
                          >
                            Couverture{" "}
                            {coverageQuery.data.isCompliant
                              ? "conforme"
                              : "à vérifier"}
                          </span>
                        ) : null}
                        {(device.circuits ?? []).length > 0 && (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={computeDeviceRating.isPending}
                            onClick={() =>
                              computeDeviceRating.mutate(device.id)
                            }
                          >
                            {computeDeviceRating.isPending &&
                            computeDeviceRating.variables === device.id ? (
                              <LoaderCircle
                                aria-hidden="true"
                                className="animate-spin"
                              />
                            ) : null}
                            {isDeviceRated ? "Recalculer" : "Dimensionner"}
                          </Button>
                        )}
                      </div>
                      {computeDeviceRating.isError &&
                        computeDeviceRating.variables === device.id && (
                          <p
                            className="text-sm text-destructive sm:col-span-2"
                            role="alert"
                          >
                            {getErrorMessage(
                              computeDeviceRating.error,
                              "Le dimensionnement du DDR a échoué.",
                            )}
                          </p>
                        )}
                    </div>
                  );
                })}
              </div>
            )}
            {selectivityQuery.isError && (
              <p
                className="border-t border-border py-3 text-sm text-destructive"
                role="alert"
              >
                {getErrorMessage(
                  selectivityQuery.error,
                  "La sélectivité n’a pas pu être vérifiée.",
                )}
              </p>
            )}
          </section>
        )}
      </div>
      <Dialog
        open={Boolean(viewingCircuit)}
        onOpenChange={(open) => {
          if (!open) setViewingCircuit(null);
        }}
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {viewingCircuit?.calculationResult
                ? "Résultats du calcul"
                : "Détails du circuit"}
            </DialogTitle>
            <DialogDescription>{viewingCircuit?.name}</DialogDescription>
          </DialogHeader>
          {viewingCircuit && (
            <dl className="grid grid-cols-2 gap-x-4 gap-y-4 text-sm">
              <DataPoint label="Type" value={viewingCircuit.circuitType} />
              <DataPoint
                label="Courbe du disjoncteur"
                value={viewingCircuit.breakerTripCurve ?? "Non renseignée"}
              />
              <DataPoint
                label="Emplacement d’usage"
                value={
                  usageLocationLabels[viewingCircuit.usageLocation] ??
                  "Non renseigné"
                }
              />
              <DataPoint
                label="DDR assigné"
                value={
                  viewingCircuit.differentialDevice
                    ? `${viewingCircuit.differentialDevice.sensitivityMa} mA · type ${viewingCircuit.differentialDevice.type}`
                    : "Aucun"
                }
              />
              <DataPoint
                label="Puissance totale"
                value={`${viewingCircuit.totalPower} W`}
              />
              <DataPoint
                label="Distance maximale"
                value={`${viewingCircuit.farthestLoadDistance} m`}
              />
              <DataPoint
                label="Facteur de puissance"
                value={viewingCircuit.cosPhi}
              />
              <DataPoint
                label="Circuits groupés"
                value={viewingCircuit.numberOfCircuits}
              />
              {viewingCircuit.calculationResult && (
                <>
                  <DataPoint
                    label="Courant d'emploi"
                    value={`${viewingCircuit.calculationResult.ib} A`}
                  />
                  <DataPoint
                    label="Chute de tension"
                    value={`${viewingCircuit.calculationResult.deltaUPercent} %`}
                  />
                  <DataPoint
                    label="Section retenue"
                    value={`${viewingCircuit.calculationResult.sectionMm2} mm²`}
                  />
                  <DataPoint
                    label="Calibre de protection"
                    value={`${viewingCircuit.calculationResult.inCurrent} A`}
                  />
                  <DataPoint
                    label="Intensité admissible"
                    value={`${viewingCircuit.calculationResult.izCurrent} A`}
                  />
                  {viewingCircuit.calculationResult.icc != null && (
                    <DataPoint
                      label="Courant de court-circuit"
                      value={`${viewingCircuit.calculationResult.icc} A`}
                    />
                  )}
                  <DataPoint
                    label="Conformité électrique"
                    value={
                      !viewingCircuit.calculationResult.isCompliant
                        ? "Non conforme"
                        : viewingCircuit.calculationResult.warnings?.length
                          ? "Vérification incomplète"
                          : "Conforme"
                    }
                  />
                  <DataPoint
                    label="Calcul effectué le"
                    value={new Date(
                      viewingCircuit.calculationResult.computedAt,
                    ).toLocaleString("fr-FR")}
                  />
                </>
              )}
            </dl>
          )}
          {viewingCircuit?.calculationResult?.isCompliant === false && (
            <section
              className="border-l-4 border-amber-600 bg-amber-50 p-4"
              aria-labelledby="circuit-noncompliance-heading"
            >
              <h3
                id="circuit-noncompliance-heading"
                className="font-semibold text-amber-950"
              >
                Raisons de la non-conformité
              </h3>
              {viewingCircuit.calculationResult.reasons?.length ? (
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-amber-950">
                  {viewingCircuit.calculationResult.reasons.map(
                    (reason, index) => (
                      <li key={`${index}-${reason}`}>{reason}</li>
                    ),
                  )}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-amber-950">
                  Les motifs ne sont pas disponibles pour cet ancien calcul.
                  Relancez le calcul pour les enregistrer.
                </p>
              )}
            </section>
          )}
          {viewingCircuit?.calculationResult?.warnings?.length > 0 && (
            <section
              className="border-l-4 border-amber-500 bg-amber-50 p-4"
              aria-labelledby="circuit-incomplete-checks-heading"
            >
              <h3
                id="circuit-incomplete-checks-heading"
                className="font-semibold text-amber-950"
              >
                Contrôles incomplets
              </h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-amber-950">
                {viewingCircuit.calculationResult.warnings.map(
                  (warning, index) => (
                    <li key={`${index}-${warning}`}>{warning}</li>
                  ),
                )}
              </ul>
            </section>
          )}
        </DialogContent>
      </Dialog>
      <Dialog
        open={Boolean(editingCircuit)}
        onOpenChange={(open) => {
          if (!open && !updateCircuit.isPending) setEditingCircuit(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le circuit</DialogTitle>
            <DialogDescription>
              Modifiez les caractéristiques du circuit puis enregistrez.
            </DialogDescription>
          </DialogHeader>
          {editingCircuit && (
            <form
              key={editingCircuit.id}
              id="edit-circuit-form"
              onSubmit={submitCircuitUpdate}
              className="grid gap-4"
            >
              <FormInput
                id="edit-circuit-name"
                name="name"
                label="Nom du circuit"
                defaultValue={editingCircuit.name}
                maxLength={100}
                required
              />
              <label
                htmlFor="edit-circuit-usage-location"
                className="grid gap-1.5 text-sm font-medium"
              >
                Emplacement d’usage
                <select
                  id="edit-circuit-usage-location"
                  name="usageLocation"
                  defaultValue={editingCircuit.usageLocation ?? "AUTRES"}
                  required
                  className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
                >
                  {Object.entries(usageLocationLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label
                htmlFor="edit-circuit-type"
                className="grid gap-1.5 text-sm font-medium"
              >
                Type de circuit
                <select
                  id="edit-circuit-type"
                  name="circuitType"
                  defaultValue={editingCircuit.circuitType}
                  required
                  className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
                >
                  {Object.entries(circuitTypeLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label
                htmlFor="edit-circuit-breaker-curve"
                className="grid gap-1.5 text-sm font-medium"
              >
                Courbe du disjoncteur
                <select
                  id="edit-circuit-breaker-curve"
                  name="breakerTripCurve"
                  defaultValue={editingCircuit.breakerTripCurve ?? ""}
                  className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
                >
                  <option value="">Non renseignée</option>
                  <option value="B">B · 5 × In</option>
                  <option value="C">C · 10 × In</option>
                  <option value="D">D · 20 × In</option>
                </select>
              </label>
              <FormInput
                id="edit-circuit-power"
                name="totalPower"
                label="Puissance totale (W)"
                type="number"
                min="0.01"
                step="any"
                defaultValue={editingCircuit.totalPower}
                required
              />
              <FormInput
                id="edit-circuit-distance"
                name="farthestLoadDistance"
                label="Distance de la charge la plus éloignée (m)"
                type="number"
                min="0.01"
                step="any"
                defaultValue={editingCircuit.farthestLoadDistance}
                required
              />
              <FormInput
                id="edit-circuit-cos-phi"
                name="cosPhi"
                label="Facteur de puissance (cos φ)"
                type="number"
                min="0.01"
                max="1"
                step="0.01"
                defaultValue={editingCircuit.cosPhi}
                required
              />
              <FormInput
                id="edit-circuit-count"
                name="numberOfCircuits"
                label="Circuits groupés"
                type="number"
                min="1"
                step="1"
                defaultValue={editingCircuit.numberOfCircuits}
                required
              />
            </form>
          )}
          {updateCircuit.isError && (
            <p className="text-sm text-destructive" role="alert">
              {getErrorMessage(
                updateCircuit.error,
                "La modification a échoué.",
              )}
            </p>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={updateCircuit.isPending}
              onClick={() => setEditingCircuit(null)}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              form="edit-circuit-form"
              disabled={updateCircuit.isPending}
            >
              {updateCircuit.isPending ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <AlertDialog
        open={Boolean(deletingCircuit)}
        onOpenChange={(open) => {
          if (!open && !deleteCircuit.isPending) setDeletingCircuit(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce circuit ?</AlertDialogTitle>
            <AlertDialogDescription>
              {deletingCircuit?.name} sera supprimé définitivement avec son
              résultat de calcul.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteCircuit.isError && (
            <p className="text-sm text-destructive" role="alert">
              {getErrorMessage(deleteCircuit.error, "La suppression a échoué.")}
            </p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteCircuit.isPending}>
              Annuler
            </AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              disabled={deleteCircuit.isPending}
              onClick={() => {
                if (!deletingCircuit) return;
                deleteCircuit.mutate(deletingCircuit.id, {
                  onSuccess: () => setDeletingCircuit(null),
                });
              }}
            >
              {deleteCircuit.isPending ? "Suppression..." : "Supprimer"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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

function DataPoint({ label, value }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 font-medium">{value}</dd>
    </div>
  );
}

function CircuitProtectionDetails({ circuit }) {
  const device = circuit.differentialDevice;

  return (
    <p className="mt-1 text-xs text-muted-foreground">
      {usageLocationLabels[circuit.usageLocation] ??
        "Emplacement non renseigné"}
      {" · "}
      {device
        ? `DDR ${device.sensitivityMa} mA, type ${device.type}`
        : "Aucun DDR assigné"}
    </p>
  );
}

function CircuitStatus({ result }) {
  if (!result) {
    return null;
  }

  if (result.isCompliant && result.warnings?.length > 0) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-950">
        <AlertTriangle aria-hidden="true" className="size-3.5" />
        Vérification incomplète
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
      <AlertTriangle aria-hidden="true" className="size-3.5" />
      Non conforme
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
