-- Link new promotion requests to the authoritative V2 policy and staff records.
-- Every column is nullable so existing promotion requests remain valid.

-- AlterTable
ALTER TABLE "promotion_requests"
ADD COLUMN "promotionRouteId" INTEGER,
ADD COLUMN "staffRankHistoryId" INTEGER,
ADD COLUMN "staffAssignmentId" INTEGER,
ADD COLUMN "policySnapshot" JSONB;

-- CreateIndex
CREATE INDEX "promotion_requests_promotionRouteId_idx" ON "promotion_requests"("promotionRouteId");

-- CreateIndex
CREATE INDEX "promotion_requests_staffRankHistoryId_idx" ON "promotion_requests"("staffRankHistoryId");

-- CreateIndex
CREATE INDEX "promotion_requests_staffAssignmentId_idx" ON "promotion_requests"("staffAssignmentId");

-- AddForeignKey
ALTER TABLE "promotion_requests" ADD CONSTRAINT "promotion_requests_promotionRouteId_fkey" FOREIGN KEY ("promotionRouteId") REFERENCES "promotion_routes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promotion_requests" ADD CONSTRAINT "promotion_requests_staffRankHistoryId_fkey" FOREIGN KEY ("staffRankHistoryId") REFERENCES "staff_rank_history"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promotion_requests" ADD CONSTRAINT "promotion_requests_staffAssignmentId_fkey" FOREIGN KEY ("staffAssignmentId") REFERENCES "staff_organization_assignments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
