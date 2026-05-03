import { Router, type IRouter } from "express";
import healthRouter from "./health";
import adminRouter from "./admin";
import aiRouter from "./ai";
import authRouter from "./auth";
import clinicalRouter from "./clinical";
import clinicalStaffRouter from "./clinical-staff";
import paymentsRouter from "./payments";
import eventsRouter from "./events";
import ridersRouter from "./riders";
import specialistsRouter from "./specialists";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/admin", adminRouter);
router.use("/ai", aiRouter);
router.use("/auth", authRouter);
router.use("/clinical", clinicalRouter);
router.use("/clinical-staff", clinicalStaffRouter);
router.use("/payments", paymentsRouter);
router.use("/events", eventsRouter);
router.use("/riders", ridersRouter);
router.use("/specialists", specialistsRouter);

export default router;
