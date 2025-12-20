import { Router } from "express";
import { runDeepDive, getDeepDiveStatus, getCachedDeepDive } from "../services/deep-dive";
import { isAuthenticated } from "../replitAuth";

const router = Router();

router.post("/api/contacts/:contactId/deep-dive", isAuthenticated, async (req, res) => {
  try {
    const userId = req.user!.id;
    const contactId = parseInt(req.params.contactId);
    
    if (isNaN(contactId)) {
      return res.status(400).json({ error: "Invalid contact ID" });
    }

    console.log('[DeepDive:API] Starting deep dive for contact:', contactId);
    
    const result = await runDeepDive(userId, contactId);
    
    res.json({ success: true, data: result });
  } catch (error: any) {
    console.error('[DeepDive:API] Error:', error);
    res.status(500).json({ error: error.message || "Deep dive failed" });
  }
});

router.get("/api/contacts/:contactId/deep-dive", isAuthenticated, async (req, res) => {
  try {
    const userId = req.user!.id;
    const contactId = parseInt(req.params.contactId);
    
    if (isNaN(contactId)) {
      return res.status(400).json({ error: "Invalid contact ID" });
    }

    const cached = await getCachedDeepDive(userId, contactId);
    
    if (cached) {
      return res.json({ success: true, data: cached, cached: true });
    }

    res.json({ success: true, data: null, cached: false });
  } catch (error: any) {
    console.error('[DeepDive:API] Error fetching cached:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get("/api/contacts/:contactId/deep-dive/status", isAuthenticated, async (req, res) => {
  try {
    const userId = req.user!.id;
    const contactId = parseInt(req.params.contactId);
    
    if (isNaN(contactId)) {
      return res.status(400).json({ error: "Invalid contact ID" });
    }

    const status = getDeepDiveStatus(userId, contactId);
    
    res.json({ success: true, status });
  } catch (error: any) {
    console.error('[DeepDive:API] Error fetching status:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
