import { Router } from "express";
import { router as statsRouter } from "./stats";
import { router as jobsRouter } from "./jobs";
import { router as deadLettersRouter } from "./dead-letters";
import { router as reconciliationRouter } from "./reconciliation";
import { router as controlRouter } from "./control";
import { router as pushRouter } from "./push";
import { router as syncRouter } from "./sync";

const router = Router();

router.use(statsRouter);
router.use(jobsRouter);
router.use(deadLettersRouter);
router.use(reconciliationRouter);
router.use(controlRouter);
router.use(pushRouter);
router.use(syncRouter);

export default router;
