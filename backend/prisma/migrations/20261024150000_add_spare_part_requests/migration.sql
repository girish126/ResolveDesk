CREATE TYPE "SparePartRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

CREATE TABLE "spare_part_requests" (
    "id" UUID NOT NULL,
    "engineer_id" UUID NOT NULL,
    "ticket_id" UUID NOT NULL,
    "part_name" VARCHAR(150) NOT NULL,
    "quantity" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "SparePartRequestStatus" NOT NULL DEFAULT 'PENDING',
    "admin_note" TEXT,
    "reviewed_by_id" UUID,
    "reviewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "spare_part_requests_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "spare_part_requests_engineer_id_created_at_idx" ON "spare_part_requests"("engineer_id", "created_at");
CREATE INDEX "spare_part_requests_ticket_id_idx" ON "spare_part_requests"("ticket_id");
CREATE INDEX "spare_part_requests_status_created_at_idx" ON "spare_part_requests"("status", "created_at");

ALTER TABLE "spare_part_requests" ADD CONSTRAINT "spare_part_requests_engineer_id_fkey"
    FOREIGN KEY ("engineer_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "spare_part_requests" ADD CONSTRAINT "spare_part_requests_ticket_id_fkey"
    FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "spare_part_requests" ADD CONSTRAINT "spare_part_requests_reviewed_by_id_fkey"
    FOREIGN KEY ("reviewed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
