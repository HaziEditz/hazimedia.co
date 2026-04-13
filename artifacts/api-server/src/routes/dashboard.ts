import { Router, type IRouter } from "express";
import { db, ordersTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import { authMiddleware, type AuthRequest } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/dashboard/summary", authMiddleware, async (req: AuthRequest, res): Promise<void> => {
  const userId = req.userId!;

  const [totalRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(ordersTable)
    .where(eq(ordersTable.userId, userId));

  const [activeRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(ordersTable)
    .where(and(eq(ordersTable.userId, userId), eq(ordersTable.status, "active")));

  const [completedRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(ordersTable)
    .where(and(eq(ordersTable.userId, userId), eq(ordersTable.status, "completed")));

  const [pendingRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(ordersTable)
    .where(and(eq(ordersTable.userId, userId), eq(ordersTable.status, "pending")));

  res.json({
    totalOrders: totalRow?.count ?? 0,
    activeOrders: activeRow?.count ?? 0,
    completedOrders: completedRow?.count ?? 0,
    pendingOrders: pendingRow?.count ?? 0,
  });
});

export default router;
