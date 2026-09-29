-- AlterTable
ALTER TABLE "CalculationResult" ADD COLUMN     "warnings" JSONB NOT NULL DEFAULT '[]';

-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN     "warnings" JSONB NOT NULL DEFAULT '[]';
