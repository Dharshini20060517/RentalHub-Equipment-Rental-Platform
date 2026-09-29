import { Router, type IRouter } from "express";
import healthRouter from "./health";
import rentalhubRouter from "./rentalhub";

const router: IRouter = Router();

router.use(healthRouter);
router.use(rentalhubRouter);

export default router;
