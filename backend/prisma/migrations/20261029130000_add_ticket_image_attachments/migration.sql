ALTER TABLE "tickets"
ADD COLUMN "attachments" JSONB NOT NULL DEFAULT '[]';

ALTER TABLE "ticket_comments"
ADD COLUMN "attachments" JSONB NOT NULL DEFAULT '[]';
