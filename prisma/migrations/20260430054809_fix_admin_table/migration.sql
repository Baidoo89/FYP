/*
  Warnings:

  - You are about to drop the `AdminAccount` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "AdminAccount";

-- CreateTable
CREATE TABLE "admin_accounts" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "admin_accounts_username_key" ON "admin_accounts"("username");
