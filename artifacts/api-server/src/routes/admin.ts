import { Router, type IRouter } from "express";
import { db, ordersTable, usersTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { authMiddleware, adminMiddleware, type AuthRequest } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/admin/orders", authMiddleware, adminMiddleware, async (_req: AuthRequest, res): Promise<void> => {
  const rows = await db
    .select({
      id: ordersTable.id,
      userId: ordersTable.userId,
      clientName: usersTable.name,
      clientEmail: usersTable.email,
      instagramLink: ordersTable.instagramLink,
      message: ordersTable.message,
      packageType: ordersTable.packageType,
      status: ordersTable.status,
      createdAt: ordersTable.createdAt,
    })
    .from(ordersTable)
    .innerJoin(usersTable, eq(ordersTable.userId, usersTable.id))
    .orderBy(ordersTable.createdAt);

  res.json(rows);
});

router.get("/admin/summary", authMiddleware, adminMiddleware, async (_req: AuthRequest, res): Promise<void> => {
  const [clientsRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(usersTable)
    .where(eq(usersTable.isAdmin, "false"));

  const [totalRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(ordersTable);

  const [pendingRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(ordersTable)
    .where(eq(ordersTable.status, "pending"));

  const [activeRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(ordersTable)
    .where(eq(ordersTable.status, "active"));

  const [completedRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(ordersTable)
    .where(eq(ordersTable.status, "completed"));

  const [cancelledRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(ordersTable)
    .where(eq(ordersTable.status, "cancelled"));

  res.json({
    totalClients: clientsRow?.count ?? 0,
    totalOrders: totalRow?.count ?? 0,
    pendingOrders: pendingRow?.count ?? 0,
    activeOrders: activeRow?.count ?? 0,
    completedOrders: completedRow?.count ?? 0,
    cancelledOrders: cancelledRow?.count ?? 0,
  });
});

router.get("/admin/clients", authMiddleware, adminMiddleware, async (_req: AuthRequest, res): Promise<void> => {
  const clients = await db
    .select({
      id: usersTable.id,
      name: usersTable.name,
      email: usersTable.email,
      createdAt: usersTable.createdAt,
      totalOrders: sql<number>`count(${ordersTable.id})::int`,
    })
    .from(usersTable)
    .leftJoin(ordersTable, eq(usersTable.id, ordersTable.userId))
    .where(eq(usersTable.isAdmin, "false"))
    .groupBy(usersTable.id)
    .orderBy(usersTable.createdAt);

  res.json(clients);
});

export default router;
