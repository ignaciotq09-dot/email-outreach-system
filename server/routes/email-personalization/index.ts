import { Router } from "express";
import { router as settingsRouter } from "./settings";
import { router as voiceSamplesRouter } from "./voice-samples";
import { router as personasRouter } from "./personas";
import { router as editsRouter } from "./edits";
import { router as summaryRouter } from "./summary";

const router = Router();

router.use(settingsRouter);
router.use(voiceSamplesRouter);
router.use(personasRouter);
router.use(editsRouter);
router.use(summaryRouter);

export default router;
