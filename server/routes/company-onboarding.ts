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
import type { ExtractedCompanyData, ExtractionGap } from '../services/company-onboarding/types';

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
                console.log('[API] Extraction gaps:', result.gaps?.length || 0);

                // Save extracted data with gaps
                await saveExtractedData(userId, result.data, overallConfidence, result.gaps || []);
                console.log('[API] Data saved to database');
            }

            // Return result including gaps so UI can show what wasn't found
            res.json({
                success: result.success,
                data: result.data,
                confidence: result.confidence,
                gaps: result.gaps || [], // Explicit gaps for UI awareness
                sources: result.sources,
                error: result.error,
            });
        } catch (error: any) {
            console.error('[CompanyOnboarding] Error extracting data:', error);

            // Parse error to provide user-friendly message
            let errorMessage = 'Failed to extract company data';

            if (error?.message?.includes('API key') || error?.message?.includes('401') || error?.message?.includes('Incorrect API key')) {
                errorMessage = 'AI service configuration error. Please contact support or try again later.';
            } else if (error?.message?.includes('rate limit') || error?.message?.includes('429')) {
                errorMessage = 'AI service is temporarily busy. Please try again in a few minutes.';
            } else if (error?.message?.includes('timeout') || error?.message?.includes('ETIMEDOUT')) {
                errorMessage = 'Request timed out. The website may be slow to respond - please try again.';
            } else if (error?.message?.includes('ENOTFOUND') || error?.message?.includes('network')) {
                errorMessage = 'Could not connect to the website. Please check the URL and try again.';
            } else if (error?.code === 'ECONNREFUSED') {
                errorMessage = 'Could not reach the website. Please verify the URL is correct.';
            }

            // Return structured error response
            res.status(500).json({
                success: false,
                error: errorMessage,
                data: {},
                confidence: {}
            });
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

            // Build confidence scores based on whether we have data for each field
            // If a field has a value, give it 100% confidence (we already have it)
            // If a field is missing/empty, give it 0% confidence (we need to ask)
            const confidenceScores: Record<keyof ExtractedCompanyData, number> = {} as any;

            for (const key of Object.keys(extractedData) as (keyof ExtractedCompanyData)[]) {
                const value = extractedData[key];

                // Check if field has meaningful data
                const hasValue = value !== undefined &&
                    value !== null &&
                    value !== '' &&
                    !(Array.isArray(value) && value.length === 0);

                // If we have data, give it 100% confidence to prevent asking again
                // If no data, give 0% so gap analyzer knows to ask
                confidenceScores[key] = hasValue ? 100 : 0;
            }

            console.log('[GapQuestions] Calculated confidence scores:',
                Object.entries(confidenceScores)
                    .filter(([_, score]) => score === 0)
                    .map(([key]) => key));

            // Get extraction gaps from profile (these were identified during extraction)
            const extractionGaps = (profile.extractionGaps as ExtractionGap[]) || [];
            console.log('[GapQuestions] Extraction gaps from profile:', extractionGaps.length);

            const gaps = getGapQuestions(extractedData, confidenceScores, extractionGaps);

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
