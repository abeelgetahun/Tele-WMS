import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET /api/dashboard/stats
export async function GET() {
  try {
    // Get basic counts
    const [totalWarehouses, totalItems, totalUsers, pendingTransfers, lowStockItems, outOfStockItems] =
      await Promise.all([
        prisma.warehouse.count({ where: { status: "ACTIVE" } }),
        prisma.inventoryItem.count(),
        prisma.user.count({ where: { isActive: true } }),
        prisma.stockTransfer.count({ where: { status: "PENDING" } }),
        prisma.inventoryItem.count({
          where: {
            AND: [{ quantity: { gt: 0 } }, { quantity: { lte: prisma.inventoryItem.fields.minStock } }],
          },
        }),
        prisma.inventoryItem.count({ where: { quantity: 0 } }),
      ])

    // Get recent activities (last 10 transfers)
    const recentActivities = await prisma.stockTransfer.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        item: { select: { name: true, sku: true } },
        fromWarehouse: { select: { name: true } },
        toWarehouse: { select: { name: true } },
        requestedBy: { select: { name: true } },
      },
    })

    // Get warehouse stats
    const warehouseStats = await prisma.warehouse.findMany({
      where: { status: "ACTIVE" },
      select: {
        id: true,
        name: true,
        capacity: true,
        _count: {
          select: {
            inventoryItems: true,
          },
        },
      },
    })

    // Calculate utilization for each warehouse
    const warehousesWithUtilization = await Promise.all(
      warehouseStats.map(async (warehouse) => {
        const totalStock = await prisma.inventoryItem.aggregate({
          where: { warehouseId: warehouse.id },
          _sum: { quantity: true },
        })

        const utilization =
          warehouse.capacity > 0 ? Math.round(((totalStock._sum.quantity || 0) / warehouse.capacity) * 100) : 0

        return {
          name: warehouse.name,
          items: totalStock._sum.quantity || 0,
          capacity: warehouse.capacity,
          utilization,
          status: "Active",
        }
      }),
    )

    return NextResponse.json({
      stats: {
        totalWarehouses,
        totalItems,
        totalUsers,
        pendingTransfers,
        lowStockItems,
        outOfStockItems,
      },
      recentActivities: recentActivities.map((activity) => ({
        id: activity.id,
        action: "Stock Transfer",
        item: activity.item.name,
        from: activity.fromWarehouse.name,
        to: activity.toWarehouse.name,
        requestedBy: activity.requestedBy.name,
        status: activity.status,
        time: activity.createdAt,
      })),
      warehouseStats: warehousesWithUtilization,
    })
  } catch (error) {
    console.error("Get dashboard stats error:", error)
    return NextResponse.json({ error: "Failed to fetch dashboard statistics" }, { status: 500 })
  }
}
