-- CreateTable
CREATE TABLE "warehouse_images" (
    "id" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "warehouse_images_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "warehouse_images" ADD CONSTRAINT "warehouse_images_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
