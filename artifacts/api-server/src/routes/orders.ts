import { Router, type IRouter } from "express";
import { db, ordersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { CreateOrderBody, GetOrderParams } from "@workspace/api-zod";
import { authMiddleware, type AuthRequest } from "../middlewares/auth";

const router: IRouter = Router();

router.post("/orders", authMiddleware, async (req: AuthRequest, res): Promise<void> => {
  const parsed = CreateOrderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation error", message: parsed.error.message });
    return;
  }

  const { instagramLink, message, packageType } = parsed.data;

  const [order] = await db
    .insert(ordersTable)
    .values({
      userId: req.userId!,
      instagramLink,
      message,
      packageType,
    })
    .returning();

  res.status(201).json({
    id: order.id,
    userId: order.userId,
    instagramLink: order.instagramLink,
    message: order.message,
    packageType: order.packageType,
    status: order.status,
    createdAt: order.createdAt,
  });
});

router.get("/orders", authMiddleware, async (req: AuthRequest, res): Promise<void> => {
  const orders = await db
    .select()
    .from(ordersTable)
    .where(eq(ordersTable.userId, req.userId!))
    .orderBy(ordersTable.createdAt);

  res.json(
    orders.map((o) => ({
      id: o.id,
      userId: o.userId,
      instagramLink: o.instagramLink,
      message: o.message,
      packageType: o.packageType,
      status: o.status,
      createdAt: o.createdAt,
    }))
  );
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

  res.json({
    id: order.id,
    userId: order.userId,
    instagramLink: order.instagramLink,
    message: order.message,
    packageType: order.packageType,
    status: order.status,
    createdAt: order.createdAt,
  });
});

export default router;
