ALTER TABLE "Product" ALTER COLUMN "category" TYPE TEXT USING "category"::TEXT;
ALTER TABLE "Product" ADD COLUMN "topTenRank" INTEGER,
ADD COLUMN "displayOrder" INTEGER NOT NULL DEFAULT 1000,
ADD COLUMN "searchPriority" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "searchKeywords" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
CREATE UNIQUE INDEX "Product_topTenRank_key" ON "Product"("topTenRank");
ALTER TABLE "Product" ADD CONSTRAINT "Product_topTenRank_range" CHECK ("topTenRank" BETWEEN 1 AND 10);
CREATE TABLE "StoreCategory" (
 "id" TEXT PRIMARY KEY, "slug" TEXT NOT NULL UNIQUE, "label" TEXT NOT NULL,
 "image" TEXT NOT NULL DEFAULT '', "subCategories" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
 "position" INTEGER NOT NULL DEFAULT 0, "active" BOOLEAN NOT NULL DEFAULT true
);
INSERT INTO "StoreCategory" ("id","slug","label","position") VALUES
('category-women','women','Women',1),('category-men','men','Men',2),
('category-kids','kids','Kids',3),('category-accessories','accessories','Accessories',4);
INSERT INTO "StoreCategory" ("id","slug","label")
 SELECT 'category-' || "category", "category", "category" FROM "Product"
 GROUP BY "category" ON CONFLICT ("slug") DO NOTHING;
ALTER TABLE "Product" ADD CONSTRAINT "Product_category_fkey" FOREIGN KEY ("category") REFERENCES "StoreCategory"("slug") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE TABLE "StoreSettings" ("id" TEXT PRIMARY KEY DEFAULT 'main', "content" JSONB NOT NULL);
CREATE TABLE "Banner" (
 "id" TEXT PRIMARY KEY, "title" TEXT NOT NULL, "subtitle" TEXT NOT NULL DEFAULT '',
 "eyebrow" TEXT NOT NULL DEFAULT '', "image" TEXT NOT NULL, "mobileImage" TEXT NOT NULL DEFAULT '',
 "buttonLabel" TEXT NOT NULL DEFAULT '', "link" TEXT NOT NULL DEFAULT '/#catalog',
 "slot" TEXT NOT NULL DEFAULT 'hero', "position" INTEGER NOT NULL DEFAULT 0,
 "active" BOOLEAN NOT NULL DEFAULT false, "startsAt" TIMESTAMP(3), "endsAt" TIMESTAMP(3)
);
CREATE TYPE "TeamRole" AS ENUM ('admin','support','inventory');
CREATE TABLE "TeamMember" (
 "id" TEXT PRIMARY KEY, "name" TEXT NOT NULL, "email" TEXT NOT NULL UNIQUE,
 "role" "TeamRole" NOT NULL, "active" BOOLEAN NOT NULL DEFAULT true, "passwordHash" TEXT NOT NULL
);
ALTER TABLE "Session" ADD COLUMN "memberId" TEXT REFERENCES "TeamMember"("id") ON DELETE CASCADE;
CREATE TABLE "SupportTicket" (
 "id" TEXT PRIMARY KEY, "customer" TEXT NOT NULL, "email" TEXT NOT NULL, "subject" TEXT NOT NULL,
 "message" TEXT NOT NULL, "priority" TEXT NOT NULL DEFAULT 'medium', "status" TEXT NOT NULL DEFAULT 'open',
 "assigneeId" TEXT REFERENCES "TeamMember"("id") ON DELETE SET NULL,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE TABLE "TicketReply" (
 "id" TEXT PRIMARY KEY, "ticketId" TEXT NOT NULL REFERENCES "SupportTicket"("id") ON DELETE CASCADE,
 "author" TEXT NOT NULL, "text" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE "SaleRecord" (
 "id" TEXT PRIMARY KEY, "orderRef" TEXT NOT NULL UNIQUE, "customerEmail" TEXT NOT NULL,
 "region" TEXT NOT NULL, "amount" DECIMAL(12,2) NOT NULL, "status" TEXT NOT NULL DEFAULT 'completed',
 "soldAt" TIMESTAMP(3) NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
