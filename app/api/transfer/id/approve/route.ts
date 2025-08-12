import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuth } from "@/lib/middleware"

// POST /api/transfers/[id]/approve
export const POST = withAuth(async (request: NextRequest & { user: any }, { params }: { params: { id: string } }) => {
  try {
    // Get transfer details
    const transfer = await prisma.stockTransfer.findUnique({
      where: { id: params.id },
      include: {
        item: true,
      },
    })

    if (!transfer) {
      return NextResponse.json({ error: "Transfer not found" }, { status: 404 })
    }

    if (transfer.status !== "PENDING") {
      return NextResponse.json({ error: "Transfer is not pending approval" }, { status: 400 })
    }

    // Check if item still has sufficient quantity
    const currentItem = await prisma.inventoryItem.findUnique({
      where: { id: transfer.itemId },
    })

    if (!currentItem || currentItem.quantity < transfer.quantity) {
      return NextResponse.json({ error: "Insufficient quantity available" }, { status: 400 })
    }

    // Use transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx: {
            stockTransfer: { update: (arg0: { where: { id: string }; data: { status: string; approvedById: any; approvedDate: Date }; include: { item: { select: { id: boolean; name: boolean; sku: boolean } }; fromWarehouse: { select: { id: boolean; name: boolean } }; toWarehouse: { select: { id: boolean; name: boolean } }; requestedBy: { select: { id: boolean; name: boolean } }; approvedBy: { select: { id: boolean; name: boolean } } } }) => any }; inventoryItem: {
                update: (arg0: { where: { id: any } | { id: any }; data: { quantity: { decrement: any } } | { quantity: { increment: any } } }) => any; findFirst: (arg0: { where: { sku: any; warehouseId: any } }) => any; create: (arg0: {
                    data: {
                        name: any; description: any; sku: string // Make SKU unique
                        barcode: any; quantity: any; minStock: any; maxStock: any; unitPrice: any; supplier: any; categoryId: any; warehouseId: any; status: string
                    }
                }) => any
            }
        }) => {
      // Update transfer status
      const updatedTransfer = await tx.stockTransfer.update({
        where: { id: params.id },
        data: {
          status: "APPROVED",
          approvedById: request.user.userId,
          approvedDate: new Date(),
        },
        include: {
          item: {
            select: {
              id: true,
              name: true,
              sku: true,
            },
          },
          fromWarehouse: {
            select: {
              id: true,
              name: true,
            },
          },
          toWarehouse: {
            select: {
              id: true,
              name: true,
            },
          },
          requestedBy: {
            select: {
              id: true,
              name: true,
            },
          },
          approvedBy: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      })

      // Reduce quantity in source warehouse
      await tx.inventoryItem.update({
        where: { id: transfer.itemId },
        data: {
          quantity: {
            decrement: transfer.quantity,
          },
        },
      })

      // Check if item exists in destination warehouse
      const destItem = await tx.inventoryItem.findFirst({
        where: {
          sku: currentItem.sku,
          warehouseId: transfer.toWarehouseId,
        },
      })

      if (destItem) {
        // Update existing item quantity
        await tx.inventoryItem.update({
          where: { id: destItem.id },
          data: {
            quantity: {
              increment: transfer.quantity,
            },
          },
        })
      } else {
        // Create new item in destination warehouse
        await tx.inventoryItem.create({
          data: {
            name: currentItem.name,
            description: currentItem.description,
            sku: `${currentItem.sku}-${transfer.toWarehouseId.slice(-4)}`, // Make SKU unique
            barcode: currentItem.barcode,
            quantity: transfer.quantity,
            minStock: currentItem.minStock,
            maxStock: currentItem.maxStock,
            unitPrice: currentItem.unitPrice,
            supplier: currentItem.supplier,
            categoryId: currentItem.categoryId,
            warehouseId: transfer.toWarehouseId,
            status: "IN_STOCK",
          },
        })
      }

      return updatedTransfer
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error("Approve transfer error:", error)
    return NextResponse.json({ error: "Failed to approve transfer" }, { status: 500 })
  }
})
