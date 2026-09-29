/*
  Warnings:

  - You are about to drop the column `validatedAt` on the `Circuit` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Circuit" DROP COLUMN "validatedAt",
ADD COLUMN     "usageLocation" TEXT;
