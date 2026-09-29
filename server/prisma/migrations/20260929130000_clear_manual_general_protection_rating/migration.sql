UPDATE "Installation"
SET "generalProtectionRating" = NULL;

DELETE FROM "CalculationResult";

UPDATE "Circuit"
SET "validatedAt" = NULL;