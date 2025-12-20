import { Router } from "express";
import { requireAuth } from "../../auth/middleware";
import { handleSearch, handleRefine, handleUndo, handleParse } from "./search-handlers";
import { handleGetSuggestions, handleGetSaved, handleSaveSearch, handleDeleteSaved } from "./saved-handlers";
import { handleGetIcp, handleRecalculateIcp, handleFeedback } from "./icp-handlers";
import { handleGetFilterOptions } from "./filter-handlers";

const router = Router();

router.post("/search", requireAuth, handleSearch);
router.post("/refine", requireAuth, handleRefine);
router.post("/undo", requireAuth, handleUndo);
router.post("/parse", requireAuth, handleParse);
router.get("/suggestions", requireAuth, handleGetSuggestions);
router.get("/saved", requireAuth, handleGetSaved);
router.post("/save", requireAuth, handleSaveSearch);
router.delete("/saved/:patternId", requireAuth, handleDeleteSaved);
router.get("/icp", requireAuth, handleGetIcp);
router.post("/icp/recalculate", requireAuth, handleRecalculateIcp);
router.post("/feedback", requireAuth, handleFeedback);
router.get("/filter-options", requireAuth, handleGetFilterOptions);

export default router;
