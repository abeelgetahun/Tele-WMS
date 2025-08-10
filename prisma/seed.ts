import { PrismaClient, UserRole, WarehouseStatus, ItemStatus, TransferStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed...");

  // Create categories
  const networkCategory = await prisma.category.upsert({
    where: { name: "Network Equipment" },
    update: {},
    create: {
      name: "Network Equipment",
      description: "Routers, switches, access points",
    },
  });

  const cablesCategory = await prisma.category.upsert({
    where: { name: "Cables" },
    update: {},
    create: {
      name: "Cables",
      description: "Ethernet, fiber optic, power cables",
    },
  });

  const simCategory = await prisma.category.upsert({
    where: { name: "SIM Cards" },
    update: {},
    create: {
      name: "SIM Cards",
      description: "Prepaid and postpaid SIM cards",
    },
  });

  // Create warehouses
  const addisWarehouse = await prisma.warehouse.create({
    data: {
      name: "Addis Ababa Central",
      location: "Addis Ababa, Ethiopia",
      address: "Bole Sub City, Addis Ababa",
      phone: "+251-11-123-4567",
      capacity: 5000,
      currentStock: 0,
      status: WarehouseStatus.ACTIVE,
    },
  });

  const direDawaWarehouse = await prisma.warehouse.create({
    data: {
      name: "Dire Dawa Regional",
      location: "Dire Dawa, Ethiopia",
      address: "Kezira, Dire Dawa",
      phone: "+251-25-111-2233",
      capacity: 3000,
      currentStock: 0,
      status: WarehouseStatus.ACTIVE,
    },
  });

  // Create users with hashed passwords
  const hashedPassword = await bcrypt.hash("password123", 12);

  // const adminUser2 = await prisma.user.create({
  //   data: {
  //     email: "admin@ethiotelecom.et",
  //     name: "System Administrator",
  //     password: hashedPassword,
  //     role: UserRole.ADMIN,
  //     isActive: true,
  //   },
  // });

   const adminUser = await prisma.user.create({
    data: {
      email: "abel@ethiotelecom.et",
      name: "Abel Getahun",
      password: hashedPassword,
      role: UserRole.ADMIN,
      isActive: true,
    },
  });

  const managerUser = await prisma.user.create({
    data: {
      email: "manager@ethiotelecom.et",
      name: "Alemayehu Tadesse",
      password: hashedPassword,
      role: UserRole.WAREHOUSE_MANAGER,
      warehouseId: addisWarehouse.id,
      isActive: true,
    },
  });

  const clerkUser = await prisma.user.create({
    data: {
      email: "clerk@ethiotelecom.et",
      name: "Fatuma Ahmed",
      password: hashedPassword,
      role: UserRole.INVENTORY_CLERK,
      warehouseId: direDawaWarehouse.id,
      isActive: true,
    },
  });

  // Update warehouse managers
  await prisma.warehouse.update({
    where: { id: addisWarehouse.id },
    data: { managerId: managerUser.id },
  });

  await prisma.warehouse.update({
    where: { id: direDawaWarehouse.id },
    data: { managerId: clerkUser.id },
  });

  // Create inventory items
  const router = await prisma.inventoryItem.create({
    data: {
      name: "Router TP-Link AC1200",
      description: "Dual-band wireless router with AC1200 speed",
      sku: "TPL-AC1200",
      quantity: 45,
      minStock: 20,
      maxStock: 100,
      unitPrice: 2500.0,
      supplier: "Tech Solutions Ltd",
      categoryId: networkCategory.id,
      warehouseId: addisWarehouse.id,
      status: ItemStatus.IN_STOCK,
    },
  });

  const cable = await prisma.inventoryItem.create({
    data: {
      name: "Ethernet Cable Cat6 (100m)",
      description: "100 meter Cat6 ethernet cable",
      sku: "ETH-CAT6-100",
      quantity: 15,
      minStock: 25,
      maxStock: 200,
      unitPrice: 150.0,
      supplier: "Cable Corp",
      categoryId: cablesCategory.id,
      warehouseId: direDawaWarehouse.id,
      status: ItemStatus.LOW_STOCK,
    },
  });

  const simCards = await prisma.inventoryItem.create({
    data: {
      name: "SIM Card - Prepaid",
      description: "Prepaid SIM cards for mobile services",
      sku: "SIM-PREP-001",
      quantity: 500,
      minStock: 100,
      maxStock: 1000,
      unitPrice: 25.0,
      supplier: "Ethio Telecom",
      categoryId: simCategory.id,
      warehouseId: addisWarehouse.id,
      status: ItemStatus.IN_STOCK,
    },
  });

  // Create a sample stock transfer
  await prisma.stockTransfer.create({
    data: {
      itemId: router.id,
      quantity: 10,
      fromWarehouseId: addisWarehouse.id,
      toWarehouseId: direDawaWarehouse.id,
      requestedById: clerkUser.id,
      approvedById: managerUser.id,
      status: TransferStatus.COMPLETED,
      notes: "Network expansion requirement",
      requestDate: new Date(),
      approvedDate: new Date(),
      completedDate: new Date(),
    },
  });

  // Update inventory quantities after transfer
  await prisma.inventoryItem.update({
    where: { id: router.id },
    data: { quantity: 35 },
  });

  console.log("✅ Database seeded successfully!");
  console.log("👤 Test users created:");
  console.log("   Admin: admin@ethiotelecom.et / password123");
  console.log("   Manager: manager@ethiotelecom.et / password123");
  console.log("   Clerk: clerk@ethiotelecom.et / password123");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
