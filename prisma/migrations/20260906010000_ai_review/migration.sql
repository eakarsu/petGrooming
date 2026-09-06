CREATE TABLE "PetKnowledge" (
 "id" TEXT PRIMARY KEY, "title" TEXT NOT NULL, "content" TEXT NOT NULL, "version" INTEGER NOT NULL DEFAULT 1,
 "actorId" TEXT NOT NULL REFERENCES "User"("id"), "approvedById" TEXT REFERENCES "User"("id"), "approvedAt" TIMESTAMP(3),
 "isActive" BOOLEAN NOT NULL DEFAULT true, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
 CONSTRAINT "knowledge_independent_review" CHECK ("approvedById" IS NULL OR "approvedById" <> "actorId")
);
CREATE TABLE "PetAiDraft" (
 "id" TEXT PRIMARY KEY, "actorId" TEXT NOT NULL REFERENCES "User"("id"), "petId" TEXT REFERENCES "Pet"("id"),
 "task" TEXT NOT NULL, "instructions" TEXT NOT NULL, "knowledgeIds" JSONB NOT NULL, "sourceSnapshot" JSONB NOT NULL, "sourceHash" TEXT NOT NULL,
 "status" TEXT NOT NULL DEFAULT 'PENDING', "output" JSONB, "providerRef" TEXT, "model" TEXT, "inputTokens" INTEGER, "outputTokens" INTEGER,
 "costUsd" DECIMAL(12,6), "error" TEXT, "photoBytes" BYTEA, "photoType" TEXT, "photoHash" TEXT, "photoConsent" TEXT, "photoDeletedAt" TIMESTAMP(3),
 "reviewedById" TEXT REFERENCES "User"("id"), "reviewNotes" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
 CONSTRAINT "ai_status_valid" CHECK ("status" IN ('PENDING','RUNNING','DRAFT','APPROVED','REJECTED','CANCELLED','FAILED','UNKNOWN')),
 CONSTRAINT "ai_photo_bound" CHECK ("photoBytes" IS NULL OR octet_length("photoBytes") <= 600000)
);
CREATE INDEX "PetAiDraft_actorId_createdAt_idx" ON "PetAiDraft"("actorId","createdAt");
CREATE INDEX "PetAiDraft_petId_status_idx" ON "PetAiDraft"("petId","status");
CREATE INDEX "PetAiDraft_status_createdAt_idx" ON "PetAiDraft"("status","createdAt");
