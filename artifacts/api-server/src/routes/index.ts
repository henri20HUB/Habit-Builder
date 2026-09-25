import { Router, type IRouter } from "express";
import healthRouter from "./health";
import habitsRouter from "./habits";
import completionsRouter from "./completions";
import statsRouter from "./stats";

const router: IRouter = Router();

router.use(healthRouter);
router.use(habitsRouter);
router.use(completionsRouter);
router.use(statsRouter);

export default router;
