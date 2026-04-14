import { Router, type IRouter } from "express";
import { db, messagesTable, ordersTable, usersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { authMiddleware, type AuthRequest } from "../middlewares/auth";
import { createPayPalOrder, capturePayPalOrder, PACKAGE_PRICES } from "../lib/paypal";

const router: IRouter = Router();

async function canAccessOrder(userId: string, orderId: string, isAdmin: boolean): Promise<typeof ordersTable.$inferSelect | null> {
  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, orderId));
  if (!order) return null;
  if (!isAdmin && order.userId !== userId) return null;
  return order;
}

router.get("/orders/:id/messages", authMiddleware, async (req: AuthRequest, res): Promise<void> => {
  const order = await canAccessOrder(req.userId!, req.params.id, req.isAdmin!);
  if (!order) {
    res.status(403).json({ error: "Forbidden", message: "Order not found or access denied" });
    return;
  }

  const messages = await db
    .select({
      id: messagesTable.id,
      orderId: messagesTable.orderId,
      userId: messagesTable.userId,
      content: messagesTable.content,
      createdAt: messagesTable.createdAt,
      senderName: usersTable.name,
      isAdmin: usersTable.isAdmin,
    })
    .from(messagesTable)
    .innerJoin(usersTable, eq(messagesTable.userId, usersTable.id))
    .where(eq(messagesTable.orderId, req.params.id))
    .orderBy(messagesTable.createdAt);

  res.json(messages.map(m => ({
    ...m,
    isAdmin: m.isAdmin === "true" || m.isAdmin === true,
  })));
});

router.post("/orders/:id/messages", authMiddleware, async (req: AuthRequest, res): Promise<void> => {
  const order = await canAccessOrder(req.userId!, req.params.id, req.isAdmin!);
  if (!order) {
    res.status(403).json({ error: "Forbidden", message: "Order not found or access denied" });
    return;
  }

  const { content } = req.body as { content: string };
  if (!content || typeof content !== "string" || content.trim().length === 0) {
    res.status(400).json({ error: "Validation error", message: "Message content is required" });
    return;
  }

  const [msg] = await db.insert(messagesTable).values({
    orderId: req.params.id,
    userId: req.userId!,
    content: content.trim(),
  }).returning();

  const [user] = await db.select({ name: usersTable.name, isAdmin: usersTable.isAdmin })
    .from(usersTable).where(eq(usersTable.id, req.userId!));

  res.status(201).json({
    id: msg.id,
    orderId: msg.orderId,
    userId: msg.userId,
    content: msg.content,
    createdAt: msg.createdAt,
    senderName: user.name,
    isAdmin: user.isAdmin === "true" || user.isAdmin === true,
  });
});

router.post("/orders/:id/pay", authMiddleware, async (req: AuthRequest, res): Promise<void> => {
  const [order] = await db.select().from(ordersTable).where(
    and(eq(ordersTable.id, req.params.id), eq(ordersTable.userId, req.userId!))
  );

  if (!order) {
    res.status(403).json({ error: "Forbidden", message: "Order not found" });
    return;
  }

  if (order.status !== "active") {
    res.status(403).json({ error: "Not ready", message: "Order is not approved for payment yet" });
    return;
  }

  const pkg = PACKAGE_PRICES[order.packageType];
  if (!pkg) {
    res.status(400).json({ error: "Invalid package", message: "Unknown package type" });
    return;
  }

  const { id: paypalOrderId, amount } = await createPayPalOrder(order.packageType);

  res.json({ paypalOrderId, amount, currency: "USD" });
});

router.post("/orders/:id/capture", authMiddleware, async (req: AuthRequest, res): Promise<void> => {
  const [order] = await db.select().from(ordersTable).where(
    and(eq(ordersTable.id, req.params.id), eq(ordersTable.userId, req.userId!))
  );

  if (!order) {
    res.status(403).json({ error: "Forbidden", message: "Order not found" });
    return;
  }

  if (order.status !== "active") {
    res.status(403).json({ error: "Not ready", message: "Order is not approved for payment yet" });
    return;
  }

  const { paypalOrderId } = req.body as { paypalOrderId: string };
  if (!paypalOrderId) {
    res.status(400).json({ error: "Validation error", message: "paypalOrderId is required" });
    return;
  }

  const captured = await capturePayPalOrder(paypalOrderId);
  if (!captured) {
    res.status(400).json({ error: "Payment failed", message: "PayPal payment could not be captured" });
    return;
  }

  const [updated] = await db.update(ordersTable)
    .set({ status: "completed" })
    .where(eq(ordersTable.id, req.params.id))
    .returning();

  res.json({
    id: updated.id,
    userId: updated.userId,
    instagramLink: updated.instagramLink,
    message: updated.message,
    packageType: updated.packageType,
    status: updated.status,
    createdAt: updated.createdAt,
  });
});

export default router;
