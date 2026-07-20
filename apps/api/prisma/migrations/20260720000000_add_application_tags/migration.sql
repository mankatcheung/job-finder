CREATE TABLE "ApplicationTag" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "applicationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    CONSTRAINT "ApplicationTag_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "JobApplication" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "ApplicationTag_applicationId_name_key" ON "ApplicationTag"("applicationId", "name");
CREATE INDEX "ApplicationTag_applicationId_idx" ON "ApplicationTag"("applicationId");
