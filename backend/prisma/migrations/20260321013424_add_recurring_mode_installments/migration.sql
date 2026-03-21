-- CreateEnum
CREATE TYPE "RecurringMode" AS ENUM ('indefinite', 'installments');

-- AlterTable
ALTER TABLE "RecurringTransaction" ADD COLUMN     "installments" INTEGER,
ADD COLUMN     "mode" "RecurringMode" NOT NULL DEFAULT 'indefinite';
