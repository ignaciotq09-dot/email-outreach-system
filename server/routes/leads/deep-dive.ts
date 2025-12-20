import { Router } from "express";
import OpenAI from "openai";

const router = Router();

interface LeadDeepDiveRequest {
  name: string;
  title?: string | null;
  company?: string | null;
  industry?: string | null;
  location?: string | null;
  email?: string | null;
  linkedinUrl?: string | null;
}

router.post("/api/leads/deep-dive", async (req, res) => {
  try {
    const lead: LeadDeepDiveRequest = req.body;
    
    if (!lead.name) {
      return res.status(400).json({ error: "Lead name is required" });
    }

    console.log('[LeadDeepDive] Generating insights for:', lead.name, 'at', lead.company);

    const openai = new OpenAI();
    
    const prompt = `You are a sales research assistant. Generate a brief, actionable deep dive for a sales outreach target.

TARGET PERSON:
- Name: ${lead.name}
- Title: ${lead.title || 'Unknown'}
- Company: ${lead.company || 'Unknown'}
- Industry: ${lead.industry || 'Unknown'}
- Location: ${lead.location || 'Unknown'}

Generate a JSON response with these sections:
{
  "companyInsights": {
    "summary": "2-3 sentence company overview based on what we know",
    "likelyFocus": ["3-4 likely business priorities based on industry/company"],
    "marketPosition": "Brief assessment of likely market position"
  },
  "roleContext": {
    "responsibilities": ["3-4 likely responsibilities for this title"],
    "painPoints": ["3-4 common pain points for someone in this role"],
    "goals": ["2-3 likely professional goals"]
  },
  "outreachStrategy": {
    "bestApproach": "Recommended outreach approach in 1-2 sentences",
    "talkingPoints": ["3-4 specific talking points to use in outreach"],
    "avoidTopics": ["1-2 topics to avoid"],
    "timing": "Best time/day recommendation for outreach"
  },
  "personalization": {
    "openingLines": ["2-3 personalized opening line options"],
    "valueProps": ["2-3 value propositions relevant to their role"]
  }
}

Be specific and actionable. Base insights on the title, company, and industry provided. If information is limited, make reasonable inferences based on typical patterns for similar roles/companies.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const content = response.choices[0].message.content;
    const insights = JSON.parse(content || '{}');

    console.log('[LeadDeepDive] Generated insights for:', lead.name);

    res.json({
      success: true,
      data: {
        lead: {
          name: lead.name,
          title: lead.title,
          company: lead.company,
          industry: lead.industry,
          location: lead.location,
        },
        insights,
        generatedAt: new Date().toISOString(),
      }
    });
  } catch (error: any) {
    console.error('[LeadDeepDive] Error:', error);
    res.status(500).json({ error: error.message || "Failed to generate deep dive" });
  }
});

export default router;
