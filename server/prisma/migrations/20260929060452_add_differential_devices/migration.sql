-- AlterTable
ALTER TABLE "Circuit" ADD COLUMN     "differentialDeviceId" TEXT;

-- AlterTable
ALTER TABLE "Installation" ADD COLUMN     "generalProtectionRating" INTEGER,
ADD COLUMN     "generalProtectionType" TEXT;

-- CreateTable
CREATE TABLE "DifferentialDevice" (
    "id" TEXT NOT NULL,
    "installationId" TEXT NOT NULL,
    "sensitivityMa" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "isSelectiveType" BOOLEAN NOT NULL DEFAULT false,
    "ratedCurrent" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DifferentialDevice_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "DifferentialDevice" ADD CONSTRAINT "DifferentialDevice_installationId_fkey" FOREIGN KEY ("installationId") REFERENCES "Installation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Circuit" ADD CONSTRAINT "Circuit_differentialDeviceId_fkey" FOREIGN KEY ("differentialDeviceId") REFERENCES "DifferentialDevice"("id") ON DELETE SET NULL ON UPDATE CASCADE;
