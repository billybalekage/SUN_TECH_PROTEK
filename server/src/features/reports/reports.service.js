const PDFDocument = require("pdfkit");
const {
  calculateIb,
  checkDifferentialSensitivity,
  checkSelectivity,
  selectProtectionRating,
} = require("../../core/electric-rules");
const { NotFoundError } = require("../../common/errors/AppErrors");
const defaultRepository = require("./reports.repository");

const COLORS = {
  ink: "#17252f",
  muted: "#52636e",
  line: "#d5dde1",
  accent: "#167c80",
  green: "#176b50",
  amber: "#8a5b00",
  red: "#9f3434",
};

function formatNumber(value, digits = 2) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "Non renseigne";
  return new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: digits,
  }).format(number);
}

function formatDate(value) {
  if (!value) return "Non valide";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Non valide";
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(date);
}

function circuitStatus(circuit) {
  const result = circuit.calculationResult;
  if (!result) return "Non calcule";
  if (result.reasons?.length || !result.isCompliant) return "A corriger";
  if (result.warnings?.length) return "Controles incomplets";
  return "Conforme";
}

function hasDifferentialControlGap(installation) {
  const devices = installation.differentialDevices ?? [];
  if (installation.circuits?.length && devices.length === 0) return true;
  return devices.some((device) => {
    if (
      !Number.isInteger(device.sensitivityMa) ||
      !device.type ||
      !Number.isInteger(device.ratedCurrent) ||
      (device.circuits ?? []).length === 0
    ) {
      return true;
    }
    const coverageIsIncomplete = device.circuits.some(
      (circuit) =>
        !checkDifferentialSensitivity({
          usageLocation: circuit.usageLocation,
          chosenSensitivityMa: device.sensitivityMa,
        }).isCompliant,
    );
    const selectivityIsIncomplete = !checkSelectivity({
      upstreamSensitivityMa: 500,
      downstreamSensitivityMa: device.sensitivityMa,
      upstreamIsSelectiveType: true,
    }).isCompliant;
    return coverageIsIncomplete || selectivityIsIncomplete;
  });
}

function reportStatus(project, installation) {
  if (!installation) return "Installation a configurer";
  const circuits = installation.circuits ?? [];
  if (circuits.some((circuit) => circuitStatus(circuit) === "A corriger")) {
    return "A corriger";
  }
  if (
    circuits.length === 0 ||
    circuits.some((circuit) => circuitStatus(circuit) !== "Conforme") ||
    installation.maximumIcc == null ||
    installation.generalProtectionRating == null ||
    installation.generalProtectionType == null ||
    hasDifferentialControlGap(installation)
  ) {
    return "Controles incomplets";
  }
  return project.status === "COMPLETED" ? "Conforme" : "Pret pour validation";
}

function ensureSpace(doc, height = 44) {
  if (doc.y + height > doc.page.height - 48) doc.addPage();
}

function addRunningHeader(doc) {
  doc.save();
  doc.rect(0, 0, doc.page.width, 38).fill(COLORS.ink);
  doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(9);
  doc.text("PROTEK  |  RAPPORT DE DIMENSIONNEMENT", 44, 14);
  doc.restore();
  doc.y = 52;
}

function addSection(doc, title) {
  ensureSpace(doc, 42);
  doc.moveDown(0.6);
  doc.fillColor(COLORS.accent).font("Helvetica-Bold").fontSize(12);
  doc.text(title);
  const y = doc.y + 4;
  doc
    .moveTo(44, y)
    .lineTo(doc.page.width - 44, y)
    .strokeColor(COLORS.line)
    .stroke();
  doc.y = y + 10;
  doc.fillColor(COLORS.ink);
}

function addField(doc, label, value) {
  const text = `${label} : ${value == null || value === "" ? "Non renseigne" : value}`;
  const height = doc.heightOfString(text, { width: doc.page.width - 88 });
  ensureSpace(doc, height + 5);
  doc.font("Helvetica-Bold").fontSize(9).fillColor(COLORS.ink);
  doc.text(`${label} : `, { continued: true });
  doc
    .font("Helvetica")
    .fillColor(COLORS.muted)
    .text(value == null || value === "" ? "Non renseigne" : String(value));
}

function addStatus(doc, label, status) {
  const color =
    status === "Conforme"
      ? COLORS.green
      : status === "A corriger"
        ? COLORS.red
        : COLORS.amber;
  doc
    .font("Helvetica-Bold")
    .fontSize(9)
    .fillColor(COLORS.ink)
    .text(`${label} : `, {
      continued: true,
    });
  doc.font("Helvetica-Bold").fillColor(color).text(status);
}

function addBullet(doc, text) {
  const line = `- ${text}`;
  ensureSpace(
    doc,
    doc.heightOfString(line, { width: doc.page.width - 104 }) + 4,
  );
  doc.font("Helvetica").fontSize(9).fillColor(COLORS.muted);
  doc.text(line, { indent: 8 });
}

function getCircuitWarnings(circuits) {
  const warnings = [];
  for (const circuit of circuits) {
    if (!circuit.calculationResult) {
      warnings.push(`${circuit.name} : calcul non effectue`);
      continue;
    }
    for (const reason of circuit.calculationResult.reasons ?? []) {
      warnings.push(`${circuit.name} : ${reason}`);
    }
    for (const warning of circuit.calculationResult.warnings ?? []) {
      warnings.push(`${circuit.name} : ${warning}`);
    }
  }
  return [...new Set(warnings)];
}

function getDifferentialWarnings(installation) {
  if (!installation) return [];
  const warnings = [];
  const devices = installation.differentialDevices ?? [];
  if (installation.circuits?.length && devices.length === 0) {
    warnings.push("Aucun DDR n'est associe aux circuits.");
  }
  for (const device of devices) {
    const deviceName = device.label || "Dispositif differentiel";
    if (
      !Number.isInteger(device.sensitivityMa) ||
      !device.type ||
      !Number.isInteger(device.ratedCurrent)
    ) {
      warnings.push(`${deviceName} : dimensionnement incomplet.`);
    }
    for (const circuit of device.circuits ?? []) {
      const coverage = checkDifferentialSensitivity({
        usageLocation: circuit.usageLocation,
        chosenSensitivityMa: device.sensitivityMa,
      });
      for (const reason of coverage.reasons) {
        warnings.push(`${deviceName} / ${circuit.name} : ${reason}`);
      }
    }
    const selectivity = checkSelectivity({
      upstreamSensitivityMa: 500,
      downstreamSensitivityMa: device.sensitivityMa,
      upstreamIsSelectiveType: true,
    });
    for (const reason of selectivity.reasons) {
      warnings.push(`${deviceName} : selectivite a verifier - ${reason}`);
    }
  }
  if (installation.generalProtectionRating == null) {
    warnings.push("Protection generale non dimensionnee.");
  }
  return warnings;
}

function getCircuitProtectionSummary(circuit, installation) {
  const result = circuit.calculationResult;
  if (result?.inCurrent != null) {
    return {
      ib: Number(result.ib),
      inCurrent: Number(result.inCurrent),
      isPreliminary: false,
    };
  }
  if (!installation) {
    return { ib: null, inCurrent: null, isPreliminary: true };
  }

  try {
    const ib = calculateIb(
      Number(circuit.totalPower),
      Number(installation.nominalVoltage),
      Number(circuit.cosPhi),
      installation.phaseType,
    );
    return {
      ib,
      inCurrent: selectProtectionRating(ib),
      isPreliminary: true,
    };
  } catch {
    return { ib: null, inCurrent: null, isPreliminary: true };
  }
}

function addCircuitDetails(doc, circuit, installation) {
  ensureSpace(doc, 150);
  doc.moveDown(0.5);
  doc.font("Helvetica-Bold").fontSize(10).fillColor(COLORS.ink);
  doc.text(`${circuit.name} - ${circuitStatus(circuit)}`);
  addField(doc, "Type", circuit.circuitType);
  addField(doc, "Puissance", `${formatNumber(circuit.totalPower, 0)} W`);
  addField(
    doc,
    "Distance maximale",
    `${formatNumber(circuit.farthestLoadDistance)} m`,
  );
  addField(doc, "Courbe du disjoncteur", circuit.breakerTripCurve);

  const result = circuit.calculationResult;
  const protection = getCircuitProtectionSummary(circuit, installation);
  addField(
    doc,
    "Courant d'emploi Ib",
    protection.ib == null ? null : `${formatNumber(protection.ib)} A`,
  );
  addField(
    doc,
    protection.isPreliminary
      ? "Calibre indicatif minimum selon Ib"
      : "Protection recommandee In",
    protection.inCurrent == null
      ? "Aucun calibre normalise disponible"
      : `${formatNumber(protection.inCurrent, 0)} A${protection.isPreliminary ? " - a confirmer avec Iz" : ""}`,
  );

  if (result) {
    addField(doc, "Section", `${formatNumber(result.sectionMm2)} mm2`);
    addField(
      doc,
      "Intensite admissible Iz",
      `${formatNumber(result.izCurrent)} A`,
    );
    addField(
      doc,
      "Chute de tension",
      `${formatNumber(result.deltaUPercent)} %`,
    );
    addField(doc, "Icc minimal estime", `${formatNumber(result.icc)} A`);
  }

  const protectionComponents = (circuit.circuitComponents ?? []).filter(
    ({ role }) => role === "PROTECTION",
  );
  if (protectionComponents.length) {
    doc.font("Helvetica-Bold").fontSize(9).fillColor(COLORS.ink);
    doc.text("Protections associees");
    for (const { component } of protectionComponents) {
      const manufacturer = component.manufacturer?.name;
      const capacityUnit = component.technicalSpecs?.breakingCapacityUnit;
      const capacity =
        component.breakingCapacity == null
          ? "pouvoir de coupure non renseigne"
          : `coupure ${formatNumber(component.breakingCapacity)} ${capacityUnit ?? "unite inconnue"}`;
      addBullet(
        doc,
        [
          manufacturer,
          component.reference,
          component.ratedCurrent &&
            `${formatNumber(component.ratedCurrent, 0)} A`,
          capacity,
        ]
          .filter(Boolean)
          .join(" - "),
      );
    }
  } else {
    addField(
      doc,
      "Appareil catalogue associe",
      "Aucun composant catalogue lie",
    );
  }
}

function addDifferentialDetails(doc, installation) {
  const devices = installation.differentialDevices ?? [];
  if (!devices.length) {
    addField(doc, "Dispositifs differentiels", "Aucun DDR configure");
    return;
  }

  for (const device of devices) {
    ensureSpace(doc, 80);
    doc.moveDown(0.3);
    doc.font("Helvetica-Bold").fontSize(10).fillColor(COLORS.ink);
    doc.text(device.label || "Dispositif differentiel");
    addField(
      doc,
      "Calibre",
      device.ratedCurrent == null ? null : `${device.ratedCurrent} A`,
    );
    addField(
      doc,
      "Sensibilite / type",
      `${device.sensitivityMa ?? "Non renseignee"} mA / ${device.type ?? "Non renseigne"}`,
    );
    addField(
      doc,
      "Circuits proteges",
      (device.circuits ?? []).map(({ name }) => name).join(", ") || "Aucun",
    );

    for (const circuit of device.circuits ?? []) {
      const coverage = checkDifferentialSensitivity({
        usageLocation: circuit.usageLocation,
        chosenSensitivityMa: device.sensitivityMa,
      });
      addBullet(
        doc,
        `${circuit.name} : ${coverage.isCompliant ? "sensibilite adaptee" : coverage.reasons.join("; ") || "verification impossible"}`,
      );
    }

    const selectivity = checkSelectivity({
      upstreamSensitivityMa: 500,
      downstreamSensitivityMa: device.sensitivityMa,
      upstreamIsSelectiveType: true,
    });
    addBullet(
      doc,
      `Selectivite amont (hypothese : 500 mA selectif) : ${selectivity.isCompliant ? "conforme" : selectivity.reasons.join("; ") || "a verifier"}`,
    );
  }
}

function buildProjectReport(project) {
  const doc = new PDFDocument({
    size: "A4",
    margins: { top: 52, right: 44, bottom: 48, left: 44 },
  });
  const chunks = [];

  return new Promise((resolve, reject) => {
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("error", reject);
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("pageAdded", () => addRunningHeader(doc));

    doc.rect(0, 0, doc.page.width, 92).fill(COLORS.ink);
    doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(10);
    doc.text("PROTEK  /  ETUDE ELECTRIQUE", 44, 18);
    doc.fontSize(19).text("Dimensionnement et coordination", 44, 40);
    doc
      .fontSize(10)
      .font("Helvetica")
      .text("Rapport de l'installation", 44, 68);
    doc.y = 110;

    const installation = project.installation;
    const circuits = installation?.circuits ?? [];
    const calculatedCount = circuits.filter(
      (circuit) => circuit.calculationResult,
    ).length;

    addSection(doc, "Identification du projet");
    addField(doc, "Projet / client", project.clientName);
    addField(doc, "Adresse de l'installation", project.address);
    addField(doc, "Contact client", project.contact);
    addField(doc, "Societe", project.owner?.company);
    addField(doc, "Electricien responsable", project.owner?.fullName);
    addField(doc, "Telephone", project.owner?.phone);
    addField(doc, "Courriel", project.owner?.email);
    addField(doc, "Statut du projet", project.status);
    addField(
      doc,
      "Date du rapport",
      new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(
        new Date(),
      ),
    );

    addSection(doc, "Synthese");
    addStatus(doc, "Etat des controles", reportStatus(project, installation));
    addField(
      doc,
      "Circuits calcules",
      `${calculatedCount} / ${circuits.length}`,
    );
    addField(
      doc,
      "Circuits a corriger",
      circuits.filter((circuit) => circuitStatus(circuit) === "A corriger")
        .length,
    );
    addField(
      doc,
      "Circuits avec controles incomplets",
      circuits.filter(
        (circuit) =>
          circuitStatus(circuit) !== "Conforme" &&
          circuitStatus(circuit) !== "A corriger",
      ).length,
    );

    addSection(doc, "Caracteristiques de l'installation");
    if (!installation) {
      addField(doc, "Installation", "Non configuree");
    } else {
      addField(
        doc,
        "Tension nominale",
        `${formatNumber(installation.nominalVoltage)} V`,
      );
      addField(doc, "Phases", installation.phaseType);
      addField(doc, "Regime de neutre", installation.neutralRegime);
      addField(doc, "Mode de pose", installation.installMode);
      addField(doc, "Isolation", installation.insulationType);
      addField(
        doc,
        "Distance reseau-TDG",
        installation.networkToTgdDistance == null
          ? null
          : `${formatNumber(installation.networkToTgdDistance)} m`,
      );
      addField(
        doc,
        "Icc,max reseau",
        installation.maximumIcc == null
          ? "Non renseigne - pouvoir de coupure non verifie"
          : `${formatNumber(installation.maximumIcc)} A`,
      );
      addField(
        doc,
        "Protection generale",
        installation.generalProtectionRating == null
          ? "A calculer"
          : `${installation.generalProtectionRating} A - type ${installation.generalProtectionType ?? "non renseigne"}`,
      );
    }

    addSection(doc, "Resultats par circuit");
    if (!circuits.length) addField(doc, "Circuits", "Aucun circuit ajoute");
    for (const circuit of circuits)
      addCircuitDetails(doc, circuit, installation);

    addSection(doc, "Protections differentielles et coordination");
    if (installation) addDifferentialDetails(doc, installation);
    addField(
      doc,
      "Protection generale",
      installation?.generalProtectionRating == null
        ? "Non dimensionnee"
        : `${installation.generalProtectionRating} A`,
    );
    addBullet(
      doc,
      "Selectivite generale : hypothese amont selectif a 500 mA; verifier la compatibilite avec les appareils installes.",
    );

    addSection(doc, "Reserves et recommandations");
    const warnings = getCircuitWarnings(circuits);
    warnings.push(...getDifferentialWarnings(installation));
    if (installation?.maximumIcc == null) {
      warnings.push(
        "Icc,max reseau non renseigne : le pouvoir de coupure n'est pas verifie.",
      );
    }
    if (circuits.some((circuit) => !circuit.calculationResult)) {
      warnings.push(
        "Un ou plusieurs circuits n'ont pas encore de resultat de calcul.",
      );
    }
    const uniqueWarnings = [...new Set(warnings)];
    if (!uniqueWarnings.length)
      addBullet(
        doc,
        "Aucune reserve enregistree; faire valider les donnees et hypotheses avant execution.",
      );
    for (const warning of uniqueWarnings) addBullet(doc, warning);
    addBullet(
      doc,
      "Ce rapport est etabli a partir des informations saisies. Il ne remplace pas la verification sur site ni la validation par un professionnel habilite.",
    );

    addSection(doc, "Validation");
    addField(doc, "Responsable de l'etude", project.owner?.fullName);
    addField(doc, "Date de validation", formatDate(project.validatedAt));
    ensureSpace(doc, 75);
    doc
      .moveDown(1.5)
      .strokeColor(COLORS.line)
      .moveTo(44, doc.y)
      .lineTo(260, doc.y)
      .stroke();
    doc
      .moveDown(0.4)
      .font("Helvetica")
      .fontSize(8)
      .fillColor(COLORS.muted)
      .text("Signature");
    doc.end();
  });
}

function createReportsService(repository = defaultRepository) {
  return {
    async generateProjectReport(projectId, userId) {
      const project = await repository.findProjectReportData(projectId, userId);
      if (!project)
        throw new NotFoundError(`Projet introuvable : ${projectId}`);
      return buildProjectReport(project);
    },
  };
}

module.exports = {
  ...createReportsService(),
  createReportsService,
  circuitStatus,
  getCircuitProtectionSummary,
  formatDate,
  reportStatus,
};
