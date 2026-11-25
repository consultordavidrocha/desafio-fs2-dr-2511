-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "email" VARCHAR(254) NOT NULL,
    "password_hash" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "courts" (
    "acronym" VARCHAR(20) NOT NULL,
    "name" VARCHAR(200) NOT NULL,

    CONSTRAINT "courts_pkey" PRIMARY KEY ("acronym")
);

-- CreateTable
CREATE TABLE "lawsuits" (
    "number" CHAR(20) NOT NULL,
    "class_name" VARCHAR(200),
    "court_acronym" VARCHAR(20) NOT NULL,

    CONSTRAINT "lawsuits_pkey" PRIMARY KEY ("number")
);

-- CreateTable
CREATE TABLE "communications" (
    "id" INTEGER NOT NULL,
    "lawsuit_number" CHAR(20) NOT NULL,
    "court_acronym" VARCHAR(20) NOT NULL,
    "availability_date" DATE NOT NULL,
    "type" VARCHAR(100) NOT NULL,
    "document_type" VARCHAR(100),
    "court_unit" VARCHAR(300),
    "content" TEXT NOT NULL,
    "link" TEXT,

    CONSTRAINT "communications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recipients" (
    "id" SERIAL NOT NULL,
    "communication_id" INTEGER NOT NULL,
    "name" VARCHAR(300) NOT NULL,
    "side" VARCHAR(20),

    CONSTRAINT "recipients_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "lawsuits_court_acronym_idx" ON "lawsuits"("court_acronym");

-- CreateIndex
CREATE INDEX "communications_availability_date_id_idx" ON "communications"("availability_date" DESC, "id" DESC);

-- CreateIndex
CREATE INDEX "communications_court_acronym_availability_date_idx" ON "communications"("court_acronym", "availability_date" DESC);

-- CreateIndex
CREATE INDEX "communications_lawsuit_number_availability_date_idx" ON "communications"("lawsuit_number", "availability_date" DESC);

-- CreateIndex
CREATE INDEX "recipients_communication_id_idx" ON "recipients"("communication_id");

-- AddForeignKey
ALTER TABLE "lawsuits" ADD CONSTRAINT "lawsuits_court_acronym_fkey" FOREIGN KEY ("court_acronym") REFERENCES "courts"("acronym") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "communications" ADD CONSTRAINT "communications_lawsuit_number_fkey" FOREIGN KEY ("lawsuit_number") REFERENCES "lawsuits"("number") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "communications" ADD CONSTRAINT "communications_court_acronym_fkey" FOREIGN KEY ("court_acronym") REFERENCES "courts"("acronym") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipients" ADD CONSTRAINT "recipients_communication_id_fkey" FOREIGN KEY ("communication_id") REFERENCES "communications"("id") ON DELETE CASCADE ON UPDATE CASCADE;
