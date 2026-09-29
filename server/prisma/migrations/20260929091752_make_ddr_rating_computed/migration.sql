-- AlterTable
ALTER TABLE "DifferentialDevice" ADD COLUMN     "label" TEXT,
ALTER COLUMN "sensitivityMa" DROP NOT NULL,
ALTER COLUMN "type" DROP NOT NULL,
ALTER COLUMN "ratedCurrent" DROP NOT NULL;
