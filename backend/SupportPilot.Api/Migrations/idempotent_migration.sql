CREATE TABLE IF NOT EXISTS "__EFMigrationsHistory" (
    "MigrationId" character varying(150) NOT NULL,
    "ProductVersion" character varying(32) NOT NULL,
    CONSTRAINT "PK___EFMigrationsHistory" PRIMARY KEY ("MigrationId")
);

START TRANSACTION;


DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261009130711_InitialCreate') THEN
    CREATE TABLE "AuditLogs" (
        "Id" uuid NOT NULL,
        "UserId" uuid,
        "Action" text NOT NULL,
        "EntityName" text NOT NULL,
        "EntityId" text NOT NULL,
        "Details" text NOT NULL,
        "IpAddress" text NOT NULL,
        "TimestampUtc" timestamp with time zone NOT NULL,
        CONSTRAINT "PK_AuditLogs" PRIMARY KEY ("Id")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261009130711_InitialCreate') THEN
    CREATE TABLE "KnowledgeArticles" (
        "Id" uuid NOT NULL,
        "Title" text NOT NULL,
        "Slug" text NOT NULL,
        "Content" text NOT NULL,
        "Category" text NOT NULL,
        "IsPublished" boolean NOT NULL,
        "ViewCount" integer NOT NULL,
        "CreatedAtUtc" timestamp with time zone NOT NULL,
        "UpdatedAtUtc" timestamp with time zone,
        CONSTRAINT "PK_KnowledgeArticles" PRIMARY KEY ("Id")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261009130711_InitialCreate') THEN
    CREATE TABLE "Organizations" (
        "Id" uuid NOT NULL,
        "Name" text NOT NULL,
        "Slug" text NOT NULL,
        "CreatedAtUtc" timestamp with time zone NOT NULL,
        CONSTRAINT "PK_Organizations" PRIMARY KEY ("Id")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261009130711_InitialCreate') THEN
    CREATE TABLE "TicketCategories" (
        "Id" uuid NOT NULL,
        "Name" text NOT NULL,
        "Description" text NOT NULL,
        "ColorHex" text NOT NULL,
        "IsActive" boolean NOT NULL,
        CONSTRAINT "PK_TicketCategories" PRIMARY KEY ("Id")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261009130711_InitialCreate') THEN
    CREATE TABLE "Users" (
        "Id" uuid NOT NULL,
        "Email" text NOT NULL,
        "FullName" text NOT NULL,
        "PasswordHash" text NOT NULL,
        "Role" integer NOT NULL,
        "IsActive" boolean NOT NULL,
        "CreatedAtUtc" timestamp with time zone NOT NULL,
        "LastLoginAtUtc" timestamp with time zone,
        "OrganizationId" uuid,
        CONSTRAINT "PK_Users" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_Users_Organizations_OrganizationId" FOREIGN KEY ("OrganizationId") REFERENCES "Organizations" ("Id")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261009130711_InitialCreate') THEN
    CREATE TABLE "Tickets" (
        "Id" uuid NOT NULL,
        "TicketReference" text NOT NULL,
        "Title" text NOT NULL,
        "Description" text NOT NULL,
        "Priority" integer NOT NULL,
        "Status" integer NOT NULL,
        "CategoryId" uuid,
        "CustomerId" uuid NOT NULL,
        "AssignedAgentId" uuid,
        "OrganizationId" uuid,
        "CreatedAtUtc" timestamp with time zone NOT NULL,
        "UpdatedAtUtc" timestamp with time zone,
        "ResolvedAtUtc" timestamp with time zone,
        CONSTRAINT "PK_Tickets" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_Tickets_Organizations_OrganizationId" FOREIGN KEY ("OrganizationId") REFERENCES "Organizations" ("Id"),
        CONSTRAINT "FK_Tickets_TicketCategories_CategoryId" FOREIGN KEY ("CategoryId") REFERENCES "TicketCategories" ("Id"),
        CONSTRAINT "FK_Tickets_Users_AssignedAgentId" FOREIGN KEY ("AssignedAgentId") REFERENCES "Users" ("Id") ON DELETE SET NULL,
        CONSTRAINT "FK_Tickets_Users_CustomerId" FOREIGN KEY ("CustomerId") REFERENCES "Users" ("Id") ON DELETE RESTRICT
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261009130711_InitialCreate') THEN
    CREATE TABLE "TicketMessages" (
        "Id" uuid NOT NULL,
        "TicketId" uuid NOT NULL,
        "SenderId" uuid NOT NULL,
        "Content" text NOT NULL,
        "IsInternalNote" boolean NOT NULL,
        "IsAiGenerated" boolean NOT NULL,
        "CreatedAtUtc" timestamp with time zone NOT NULL,
        CONSTRAINT "PK_TicketMessages" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_TicketMessages_Tickets_TicketId" FOREIGN KEY ("TicketId") REFERENCES "Tickets" ("Id") ON DELETE CASCADE,
        CONSTRAINT "FK_TicketMessages_Users_SenderId" FOREIGN KEY ("SenderId") REFERENCES "Users" ("Id") ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261009130711_InitialCreate') THEN
    CREATE INDEX "IX_TicketMessages_SenderId" ON "TicketMessages" ("SenderId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261009130711_InitialCreate') THEN
    CREATE INDEX "IX_TicketMessages_TicketId" ON "TicketMessages" ("TicketId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261009130711_InitialCreate') THEN
    CREATE INDEX "IX_Tickets_AssignedAgentId" ON "Tickets" ("AssignedAgentId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261009130711_InitialCreate') THEN
    CREATE INDEX "IX_Tickets_CategoryId" ON "Tickets" ("CategoryId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261009130711_InitialCreate') THEN
    CREATE INDEX "IX_Tickets_CustomerId" ON "Tickets" ("CustomerId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261009130711_InitialCreate') THEN
    CREATE INDEX "IX_Tickets_OrganizationId" ON "Tickets" ("OrganizationId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261009130711_InitialCreate') THEN
    CREATE UNIQUE INDEX "IX_Tickets_TicketReference" ON "Tickets" ("TicketReference");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261009130711_InitialCreate') THEN
    CREATE UNIQUE INDEX "IX_Users_Email" ON "Users" ("Email");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261009130711_InitialCreate') THEN
    CREATE INDEX "IX_Users_OrganizationId" ON "Users" ("OrganizationId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261009130711_InitialCreate') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20261009130711_InitialCreate', '8.0.4');
    END IF;
END $EF$;
COMMIT;

START TRANSACTION;


DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261012181504_AddSlaCsatAndVectorEmbeddings') THEN
    ALTER TABLE "Tickets" ADD "FirstResponseAtUtc" timestamp with time zone;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261012181504_AddSlaCsatAndVectorEmbeddings') THEN
    ALTER TABLE "Tickets" ADD "FirstResponseDueAtUtc" timestamp with time zone;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261012181504_AddSlaCsatAndVectorEmbeddings') THEN
    ALTER TABLE "Tickets" ADD "IsSlaBreached" boolean NOT NULL DEFAULT FALSE;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261012181504_AddSlaCsatAndVectorEmbeddings') THEN
    ALTER TABLE "Tickets" ADD "ResolutionDueAtUtc" timestamp with time zone;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261012181504_AddSlaCsatAndVectorEmbeddings') THEN
    ALTER TABLE "KnowledgeArticles" ADD "EmbeddingJson" text;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261012181504_AddSlaCsatAndVectorEmbeddings') THEN
    CREATE TABLE "CsatSurveys" (
        "Id" uuid NOT NULL,
        "TicketId" uuid NOT NULL,
        "CustomerId" uuid NOT NULL,
        "Rating" integer NOT NULL,
        "FeedbackComment" text,
        "SubmittedAtUtc" timestamp with time zone NOT NULL,
        CONSTRAINT "PK_CsatSurveys" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_CsatSurveys_Tickets_TicketId" FOREIGN KEY ("TicketId") REFERENCES "Tickets" ("Id") ON DELETE CASCADE,
        CONSTRAINT "FK_CsatSurveys_Users_CustomerId" FOREIGN KEY ("CustomerId") REFERENCES "Users" ("Id") ON DELETE RESTRICT
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261012181504_AddSlaCsatAndVectorEmbeddings') THEN
    CREATE INDEX "IX_CsatSurveys_CustomerId" ON "CsatSurveys" ("CustomerId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261012181504_AddSlaCsatAndVectorEmbeddings') THEN
    CREATE UNIQUE INDEX "IX_CsatSurveys_TicketId" ON "CsatSurveys" ("TicketId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261012181504_AddSlaCsatAndVectorEmbeddings') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20261012181504_AddSlaCsatAndVectorEmbeddings', '8.0.4');
    END IF;
END $EF$;
COMMIT;

