// Company onboarding API routes

import type { Express, Request, Response } from 'express';
import {
    extractFromOnlinePresence,
    isValidUrl,
    isValidInstagramHandle,
    getGapQuestions,
    getManualQuestionnaire,
    saveCompanyProfile,
    getCompanyProfile,
    updateOnboardingStep,
    markOnboardingComplete,
    saveExtractedData,
    saveManualQuestionnaireData,
    updateValidatedFields,
    saveGapAnswers,
    isOnboardingComplete,
} from '../services/company-onboarding';
import type { ExtractedCompanyData } from '../services/company-onboarding/types';

interface AuthenticatedRequest extends Request {
    session: {
        userId?: number;
    } & Request['session'];
}

export function registerCompanyOnboardingRoutes(app: Express) {
    // Get current company profile
    app.get('/api/onboarding/company/profile', async (req: AuthenticatedRequest, res: Response) => {
        try {
            const userId = req.session.userId;
            if (!userId) {
                return res.status(401).json({ error: 'Not authenticated' });
            }

            const profile = await getCompanyProfile(userId);
            res.json({ profile });
        } catch (error) {
            console.error('[CompanyOnboarding] Error fetching profile:', error);
            res.status(500).json({ error: 'Failed to fetch company profile' });
        }
    });

    // Check if onboarding is complete
    app.get('/api/onboarding/company/status', async (req: AuthenticatedRequest, res: Response) => {
        try {
            const userId = req.session.userId;
            if (!userId) {
                return res.status(401).json({ error: 'Not authenticated' });
            }

            const profile = await getCompanyProfile(userId);
            res.json({
                complete: profile?.onboardingComplete ?? false,
                currentStep: profile?.onboardingStep ?? 'not_started',
                hasProfile: !!profile,
            });
        } catch (error) {
            console.error('[CompanyOnboarding] Error checking status:', error);
            res.status(500).json({ error: 'Failed to check onboarding status' });
        }
    });

    // Update onboarding step
    app.post('/api/onboarding/company/step', async (req: AuthenticatedRequest, res: Response) => {
        try {
            const userId = req.session.userId;
            if (!userId) {
                return res.status(401).json({ error: 'Not authenticated' });
            }

            const { step, hasOnlinePresence, websiteUrl, instagramHandle } = req.body;

            const profile = await updateOnboardingStep(userId, step, {
                hasOnlinePresence,
                websiteUrl,
                instagramHandle,
            });

            res.json({ profile });
        } catch (error) {
            console.error('[CompanyOnboarding] Error updating step:', error);
            res.status(500).json({ error: 'Failed to update onboarding step' });
        }
    });

    // Validate URL format
    app.post('/api/onboarding/company/validate-url', async (req: Request, res: Response) => {
        try {
            const { websiteUrl, instagramHandle } = req.body;

            const validation = {
                websiteValid: websiteUrl ? isValidUrl(websiteUrl) : true,
                instagramValid: instagramHandle ? isValidInstagramHandle(instagramHandle) : true,
            };

            res.json(validation);
        } catch (error) {
            console.error('[CompanyOnboarding] Error validating URLs:', error);
            res.status(500).json({ error: 'Failed to validate URLs' });
        }
    });

    // Extract company data from online presence
    app.post('/api/onboarding/company/extract', async (req: AuthenticatedRequest, res: Response) => {
        try {
            const userId = req.session.userId;
            if (!userId) {
                return res.status(401).json({ error: 'Not authenticated' });
            }

            const { websiteUrl, instagramHandle } = req.body;
            console.log('[API] Extract request for:', websiteUrl);

            if (!websiteUrl) {
                return res.status(400).json({ error: 'Website URL is required' });
            }

            if (!isValidUrl(websiteUrl)) {
                return res.status(400).json({ error: 'Invalid website URL format' });
            }

            if (instagramHandle && !isValidInstagramHandle(instagramHandle)) {
                return res.status(400).json({ error: 'Invalid Instagram handle format' });
            }

            // Update step to AI extraction
            await updateOnboardingStep(userId, 'ai_extraction', {
                hasOnlinePresence: true,
                websiteUrl,
                instagramHandle,
            });

            // Run AI extraction
            console.log('[API] Starting AI extraction...');
            const result = await extractFromOnlinePresence({
                websiteUrl,
                instagramHandle,
            });

            console.log('[API] Extraction complete. Success:', result.success);
            console.log('[API] Data keys:', result.data ? Object.keys(result.data) : 'no data');
            console.log('[API] Sample data:', JSON.stringify(result.data).slice(0, 500));

            if (result.success) {
                // Calculate overall confidence
                const confidenceValues = Object.values(result.confidence).filter(v => typeof v === 'number');
                const overallConfidence = confidenceValues.length > 0
                    ? Math.round(confidenceValues.reduce((a, b) => a + b, 0) / confidenceValues.length)
                    : 0;

                console.log('[API] Overall confidence:', overallConfidence);

                // Save extracted data
                await saveExtractedData(userId, result.data, overallConfidence);
                console.log('[API] Data saved to database');
            }

            res.json(result);
        } catch (error) {
            console.error('[CompanyOnboarding] Error extracting data:', error);
            res.status(500).json({ error: 'Failed to extract company data' });
        }
    });

    // Get gap questions based on extracted data
    app.get('/api/onboarding/company/gap-questions', async (req: AuthenticatedRequest, res: Response) => {
        try {
            const userId = req.session.userId;
            if (!userId) {
                return res.status(401).json({ error: 'Not authenticated' });
            }

            const profile = await getCompanyProfile(userId);
            if (!profile) {
                return res.status(404).json({ error: 'No company profile found' });
            }

            // Build extracted data from profile
            const extractedData: ExtractedCompanyData = {
                companyName: profile.companyName ?? undefined,
                businessType: profile.businessType ?? undefined,
                industry: profile.industry ?? undefined,
                yearsInBusiness: profile.yearsInBusiness ?? undefined,
                employeeCount: profile.employeeCount ?? undefined,
                tagline: profile.tagline ?? undefined,
                missionStatement: profile.missionStatement ?? undefined,
                businessDescription: profile.businessDescription ?? undefined,
                productsServices: profile.productsServices as string[] | undefined,
                pricingModel: profile.pricingModel as string[] | undefined,
                typicalDealSize: profile.typicalDealSize ?? undefined,
                idealCustomerDescription: profile.idealCustomerDescription ?? undefined,
                targetJobTitles: profile.targetJobTitles as string[] | undefined,
                targetIndustries: profile.targetIndustries as string[] | undefined,
                targetCompanySizes: profile.targetCompanySizes as string[] | undefined,
                targetGeographies: profile.targetGeographies as string[] | undefined,
                problemSolved: profile.problemSolved ?? undefined,
                uniqueDifferentiator: profile.uniqueDifferentiator ?? undefined,
                typicalResults: profile.typicalResults ?? undefined,
                notableClients: profile.notableClients ?? undefined,
                brandPersonality: profile.brandPersonality as string[] | undefined,
                formalityLevel: profile.formalityLevel ?? undefined,
                phrasesToUse: profile.phrasesToUse ?? undefined,
                phrasesToAvoid: profile.phrasesToAvoid ?? undefined,
            };

            // Use extraction confidence or default values
            const confidenceScores: Record<keyof ExtractedCompanyData, number> = {} as any;
            const baseConfidence = profile.extractionConfidence ?? 50;
            for (const key of Object.keys(extractedData) as (keyof ExtractedCompanyData)[]) {
                confidenceScores[key] = extractedData[key] !== undefined ? baseConfidence : 0;
            }

            const gaps = getGapQuestions(extractedData, confidenceScores);

            res.json({ gaps });
        } catch (error) {
            console.error('[CompanyOnboarding] Error getting gap questions:', error);
            res.status(500).json({ error: 'Failed to get gap questions' });
        }
    });

    // Save gap question answers
    app.post('/api/onboarding/company/gap-answers', async (req: AuthenticatedRequest, res: Response) => {
        try {
            const userId = req.session.userId;
            if (!userId) {
                return res.status(401).json({ error: 'Not authenticated' });
            }

            const { answers } = req.body;

            const profile = await saveGapAnswers(userId, answers);

            res.json({ profile });
        } catch (error) {
            console.error('[CompanyOnboarding] Error saving gap answers:', error);
            res.status(500).json({ error: 'Failed to save gap answers' });
        }
    });

    // Get manual questionnaire structure
    app.get('/api/onboarding/company/manual-questionnaire', async (req: Request, res: Response) => {
        try {
            const questionnaire = getManualQuestionnaire();
            res.json({ sections: questionnaire });
        } catch (error) {
            console.error('[CompanyOnboarding] Error getting questionnaire:', error);
            res.status(500).json({ error: 'Failed to get questionnaire' });
        }
    });

    // Save manual questionnaire answers
    app.post('/api/onboarding/company/manual-answers', async (req: AuthenticatedRequest, res: Response) => {
        try {
            const userId = req.session.userId;
            if (!userId) {
                return res.status(401).json({ error: 'Not authenticated' });
            }

            const { answers } = req.body;

            const profile = await saveManualQuestionnaireData(userId, answers);

            res.json({ profile });
        } catch (error) {
            console.error('[CompanyOnboarding] Error saving manual answers:', error);
            res.status(500).json({ error: 'Failed to save questionnaire answers' });
        }
    });

    // Validate field (thumbs up/down)
    app.post('/api/onboarding/company/validate-field', async (req: AuthenticatedRequest, res: Response) => {
        try {
            const userId = req.session.userId;
            if (!userId) {
                return res.status(401).json({ error: 'Not authenticated' });
            }

            const { field, isCorrect, correctedValue } = req.body;

            // Update validation status
            await updateValidatedFields(userId, {
                [field]: {
                    validated: true,
                    wasCorrect: isCorrect,
                    correctedAt: isCorrect ? undefined : new Date().toISOString(),
                },
            });

            // If corrected, update the field value
            if (!isCorrect && correctedValue !== undefined) {
                await saveCompanyProfile(userId, {
                    [field]: correctedValue,
                });
            }

            res.json({ success: true });
        } catch (error) {
            console.error('[CompanyOnboarding] Error validating field:', error);
            res.status(500).json({ error: 'Failed to validate field' });
        }
    });

    // Complete onboarding
    app.post('/api/onboarding/company/complete', async (req: AuthenticatedRequest, res: Response) => {
        try {
            const userId = req.session.userId;
            if (!userId) {
                return res.status(401).json({ error: 'Not authenticated' });
            }

            const profile = await markOnboardingComplete(userId);

            res.json({ profile, complete: true });
        } catch (error) {
            console.error('[CompanyOnboarding] Error completing onboarding:', error);
            res.status(500).json({ error: 'Failed to complete onboarding' });
        }
    });

    // Update profile directly (for corrections)
    app.patch('/api/onboarding/company/profile', async (req: AuthenticatedRequest, res: Response) => {
        try {
            const userId = req.session.userId;
            if (!userId) {
                return res.status(401).json({ error: 'Not authenticated' });
            }

            const updates = req.body;

            const profile = await saveCompanyProfile(userId, updates);

            res.json({ profile });
        } catch (error) {
            console.error('[CompanyOnboarding] Error updating profile:', error);
            res.status(500).json({ error: 'Failed to update profile' });
        }
    });
}
