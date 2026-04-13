import { Router, type IRouter } from "express";
import { db, ordersTable } from "@workspace/db";
import { CreatePaypalOrderBody, CapturePaypalOrderBody } from "@workspace/api-zod";
import { authMiddleware, type AuthRequest } from "../middlewares/auth";
import { createPayPalOrder, capturePayPalOrder } from "../lib/paypal";

const router: IRouter = Router();

router.post("/payments/create-paypal-order", authMiddleware, async (req: AuthRequest, res): Promise<void> => {
  const parsed = CreatePaypalOrderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation error", message: parsed.error.message });
    return;
  }

  const { packageType } = parsed.data;

  const { id: paypalOrderId, amount } = await createPayPalOrder(packageType);

  res.json({
    paypalOrderId,
    amount,
    currency: "USD",
  });
});

router.post("/payments/capture-paypal-order", authMiddleware, async (req: AuthRequest, res): Promise<void> => {
  const parsed = CapturePaypalOrderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation error", message: parsed.error.message });
    return;
  }

  const { paypalOrderId, instagramLink, message, packageType } = parsed.data;

  const captured = await capturePayPalOrder(paypalOrderId);
  if (!captured) {
    res.status(400).json({ error: "Payment failed", message: "PayPal payment could not be captured" });
    return;
  }

  const [order] = await db
    .insert(ordersTable)
    .values({
      userId: req.userId!,
      instagramLink,
      message,
      packageType,
      status: "pending",
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

export default router;
