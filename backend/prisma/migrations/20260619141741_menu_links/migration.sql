-- CreateTable
CREATE TABLE "menu_links" (
    "venue_id" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,

    CONSTRAINT "menu_links_pkey" PRIMARY KEY ("venue_id","item_id")
);

-- AddForeignKey
ALTER TABLE "menu_links" ADD CONSTRAINT "menu_links_venue_id_fkey" FOREIGN KEY ("venue_id") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_links" ADD CONSTRAINT "menu_links_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
