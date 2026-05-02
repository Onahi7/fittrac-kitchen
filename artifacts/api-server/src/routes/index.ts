import { Router, type IRouter } from "express";
import healthRouter from "./health";
import adminRouter from "./admin";
import aiRouter from "./ai";
import clinicalRouter from "./clinical";
import paymentsRouter from "./payments";
import eventsRouter from "./events";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/admin", adminRouter);
router.use("/ai", aiRouter);
router.use("/clinical", clinicalRouter);
router.use("/payments", paymentsRouter);
router.use("/events", eventsRouter);

export default router;
