CREATE TABLE IF NOT EXISTS "public"."feedback" (
    "id" UUID NOT NULL,
    "ticket_id" UUID NOT NULL,
    "author_id" UUID NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feedback_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "feedback_ticket_id_key"
    ON "public"."feedback"("ticket_id");
CREATE INDEX IF NOT EXISTS "feedback_author_id_created_at_idx"
    ON "public"."feedback"("author_id", "created_at");

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conrelid = 'public.feedback'::regclass
          AND conname = 'feedback_ticket_id_fkey'
    ) THEN
        ALTER TABLE "public"."feedback"
            ADD CONSTRAINT "feedback_ticket_id_fkey"
            FOREIGN KEY ("ticket_id") REFERENCES "public"."tickets"("id")
            ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conrelid = 'public.feedback'::regclass
          AND conname = 'feedback_author_id_fkey'
    ) THEN
        ALTER TABLE "public"."feedback"
            ADD CONSTRAINT "feedback_author_id_fkey"
            FOREIGN KEY ("author_id") REFERENCES "public"."users"("id")
            ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;
