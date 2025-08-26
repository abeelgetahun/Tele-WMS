import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuthorization, type AuthenticatedRequest } from "@/lib/middleware"

// POST /api/transfer/[id]/approve
export const POST = withAuthorization(
  "transfers",
  "approve",
  async (
    request: AuthenticatedRequest,
    context: { params: Promise<{ id: string }> }
  ) => {
    try {
      const { user } = request
      const { id } = await context.params

      // Get transfer details
      const transfer = await prisma.stockTransfer.findUnique({
        where: { id },
        include: {
          item: true,
          fromWarehouse: true,
          toWarehouse: true,
        },
      })

      if (!transfer) {
        return NextResponse.json({ error: "Transfer not found" }, { status: 404 })
      }

      if (transfer.status !== "PENDING") {
        return NextResponse.json(
          { error: "Transfer is not pending approval" },
          { status: 400 }
        )
      }

      // Check warehouse access for approval
      if (user.warehouseId && user.role !== "ADMIN") {
        // Non-admin users can only approve transfers from their warehouse
        if (transfer.fromWarehouseId !== user.warehouseId) {
          return NextResponse.json(
            { error: "You can only approve transfers from your assigned warehouse" },
            { status: 403 }
          )
        }
      }

      // Re-fetch current item
      const currentItem = await prisma.inventoryItem.findUnique({
        where: { id: transfer.itemId },
      })
      if (!currentItem) {
        return NextResponse.json({ error: "Item no longer exists" }, { status: 404 })
      }

      // Use transaction to ensure data consistency
      const result = await prisma.$transaction(async (tx: any) => {
        // Update transfer status
        const updatedTransfer = await tx.stockTransfer.update({
          where: { id },
          data: {
            status: "APPROVED",
            approvedById: user.userId,
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

        // Single-unit model: move the item to the destination warehouse
        await tx.inventoryItem.update({
          where: { id: transfer.itemId },
          data: {
            warehouseId: transfer.toWarehouseId,
            status: "IN_STOCK",
          },
        })

        return updatedTransfer
      })

      return NextResponse.json(result)
    } catch (error) {
      console.error("Approve transfer error:", error)
      return NextResponse.json({ error: "Failed to approve transfer" }, { status: 500 })
    }
  }
)
