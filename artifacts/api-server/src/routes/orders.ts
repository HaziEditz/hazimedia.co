import { Router, type IRouter } from "express";
import { db, ordersTable, usersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { CreateOrderBody, GetOrderParams, UpdateOrderStatusBody, UpdateOrderStatusParams } from "@workspace/api-zod";
import { authMiddleware, adminMiddleware, type AuthRequest } from "../middlewares/auth";

const router: IRouter = Router();

function serializeOrder(o: typeof ordersTable.$inferSelect) {
  return {
    id: o.id,
    userId: o.userId,
    instagramLink: o.instagramLink,
    message: o.message,
    packageType: o.packageType,
    status: o.status,
    createdAt: o.createdAt,
  };
}

router.post("/orders", authMiddleware, async (req: AuthRequest, res): Promise<void> => {
  const parsed = CreateOrderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation error", message: parsed.error.message });
    return;
  }

  const { instagramLink, message, packageType } = parsed.data;

  const [order] = await db
    .insert(ordersTable)
    .values({ userId: req.userId!, instagramLink, message, packageType })
    .returning();

  res.status(201).json(serializeOrder(order));
});

router.get("/orders", authMiddleware, async (req: AuthRequest, res): Promise<void> => {
  const orders = await db
    .select()
    .from(ordersTable)
    .where(eq(ordersTable.userId, req.userId!))
    .orderBy(ordersTable.createdAt);

  res.json(orders.map(serializeOrder));
});

router.get("/orders/:id", authMiddleware, async (req: AuthRequest, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetOrderParams.safeParse({ id: rawId });
  if (!params.success) {
    res.status(400).json({ error: "Validation error", message: params.error.message });
    return;
  }

  const [order] = await db
    .select()
    .from(ordersTable)
    .where(and(eq(ordersTable.id, params.data.id), eq(ordersTable.userId, req.userId!)))
    .limit(1);

  if (!order) {
    res.status(404).json({ error: "Not found", message: "Order not found" });
    return;
  }

  res.json(serializeOrder(order));
});

router.patch("/orders/:id/status", authMiddleware, adminMiddleware, async (req: AuthRequest, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdateOrderStatusParams.safeParse({ id: rawId });
  if (!params.success) {
    res.status(400).json({ error: "Validation error", message: params.error.message });
    return;
  }

  const body = UpdateOrderStatusBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: "Validation error", message: body.error.message });
    return;
  }

  const [order] = await db
    .update(ordersTable)
    .set({ status: body.data.status })
    .where(eq(ordersTable.id, params.data.id))
    .returning();

  if (!order) {
    res.status(404).json({ error: "Not found", message: "Order not found" });
    return;
  }

  res.json(serializeOrder(order));
});

export default router;
