import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import ordersRouter from "./orders";
import dashboardRouter from "./dashboard";
import adminRouter from "./admin";
import paymentsRouter from "./payments";
import messagesRouter from "./messages";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(ordersRouter);
router.use(dashboardRouter);
router.use(adminRouter);
router.use(paymentsRouter);
router.use(messagesRouter);

export default router;
