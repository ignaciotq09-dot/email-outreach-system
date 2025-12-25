// Main Company Onboarding Component - Orchestrates the entire onboarding flow

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Building2, Globe, Instagram, CheckCircle2, Loader2, ArrowRight, ArrowLeft } from 'lucide-react';
import { OnlinePresenceInput } from './OnlinePresenceInput';
import { ExtractionProgress } from './ExtractionProgress';
import { ExtractedDataReview } from './ExtractedDataReview';
import { GapQuestions } from './GapQuestions';
import { ManualQuestionnaire } from './ManualQuestionnaire';
import { ProfileSummary } from './ProfileSummary';
import type { OnboardingStep, OnboardingStatus, ExtractionResult, GapQuestion, QuestionnaireSection } from './types';

interface CompanyOnboardingProps {
    onComplete?: () => void;
}

export function CompanyOnboarding({ onComplete }: CompanyOnboardingProps) {
    const queryClient = useQueryClient();
    const [step, setStep] = useState<OnboardingStep>('presence_check');
    const [hasOnlinePresence, setHasOnlinePresence] = useState<boolean | null>(null);
    const [extractionResult, setExtractionResult] = useState<ExtractionResult | null>(null);

    // Fetch current onboarding status
    const { data: status } = useQuery<OnboardingStatus>({
        queryKey: ['/api/onboarding/company/status'],
    });

    // Update step based on saved status
    // Reset intermediate steps that require prior extraction data when starting fresh
    useEffect(() => {
        if (status?.currentStep && status.currentStep !== 'not_started') {
            // These steps require data from a previous extraction that may not exist in current state
            // Reset to presence_check to start fresh
            // NOTE: 'validation' step needs extractionResult state which is lost on reload
            const intermediateSteps = ['ai_extraction', 'validation', 'gap_questions'];

            if (intermediateSteps.includes(status.currentStep)) {
                // Start fresh - user needs to go through the flow again
                setStep('presence_check');
                setHasOnlinePresence(null);
            } else if (status.currentStep === 'manual_questionnaire') {
                // Manual flow - start at questionnaire but set flag
                setStep('manual_questionnaire');
                setHasOnlinePresence(false);
            } else if (status.currentStep === 'url_input') {
                // Was at URL input - continue from there
                setStep('url_input');
                setHasOnlinePresence(true);
            } else if (status.currentStep === 'review') {
                // Review step - should have data for this
                setStep('review');
            } else {
                setStep(status.currentStep as OnboardingStep);
            }
        }
        if (status?.complete) {
            setStep('complete');
        }
    }, [status]);

    // Get gap questions
    const { data: gapData } = useQuery<{ gaps: GapQuestion[] }>({
        queryKey: ['/api/onboarding/company/gap-questions'],
        enabled: step === 'gap_questions',
    });

    // Get manual questionnaire
    const { data: questionnaireData } = useQuery<{ sections: QuestionnaireSection[] }>({
        queryKey: ['/api/onboarding/company/manual-questionnaire'],
        enabled: step === 'manual_questionnaire',
    });

    // Extract mutation - using apiRequest for proper CSRF handling
    const extractMutation = useMutation({
        mutationFn: async (data: { websiteUrl: string; instagramHandle?: string }) => {
            console.log('[CompanyOnboarding] Starting extraction for:', data.websiteUrl);
            return apiRequest<ExtractionResult>('POST', '/api/onboarding/company/extract', data);
        },
        onSuccess: (result) => {
            console.log('[CompanyOnboarding] Extraction result:', result);
            console.log('[CompanyOnboarding] Data keys:', result.data ? Object.keys(result.data) : 'no data');
            console.log('[CompanyOnboarding] Success:', result.success);
            setExtractionResult(result);
            if (result.success) {
                setStep('validation');
            } else {
                console.error('[CompanyOnboarding] Extraction failed:', result.error);
            }
        },
        onError: (error) => {
            console.error('[CompanyOnboarding] Mutation error:', error);
        },
    });

    // Complete onboarding mutation - using apiRequest for proper CSRF handling
    const completeMutation = useMutation({
        mutationFn: async () => {
            return apiRequest('POST', '/api/onboarding/company/complete');
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/onboarding/company/status'] });
            setStep('complete');
            onComplete?.();
        },
    });

    // Calculate progress - handle initial state when hasOnlinePresence is null
    const getProgress = () => {
        // Default to online presence path if not yet determined (or explicitly true)
        const steps: OnboardingStep[] = hasOnlinePresence === false
            ? ['presence_check', 'manual_questionnaire', 'review', 'complete']
            : ['presence_check', 'url_input', 'ai_extraction', 'validation', 'gap_questions', 'review', 'complete'];
        const currentIndex = steps.indexOf(step);
        // Ensure we never return negative progress
        return currentIndex >= 0 ? Math.round((currentIndex / (steps.length - 1)) * 100) : 0;
    };

    // Get current step number for display
    const getStepNumber = () => {
        const steps: OnboardingStep[] = hasOnlinePresence === false
            ? ['presence_check', 'manual_questionnaire', 'review', 'complete']
            : ['presence_check', 'url_input', 'ai_extraction', 'validation', 'gap_questions', 'review', 'complete'];
        const currentIndex = steps.indexOf(step);
        return currentIndex >= 0 ? currentIndex + 1 : 1;
    };

    const getTotalSteps = () => hasOnlinePresence === false ? 4 : 7;

    // Handle presence selection
    const handlePresenceSelection = (hasPresence: boolean) => {
        setHasOnlinePresence(hasPresence);
        setStep(hasPresence ? 'url_input' : 'manual_questionnaire');
    };

    // Handle extraction start
    const handleStartExtraction = (websiteUrl: string, instagramHandle?: string) => {
        setStep('ai_extraction');
        extractMutation.mutate({ websiteUrl, instagramHandle });
    };

    // Handle validation complete
    const handleValidationComplete = () => {
        setStep('gap_questions');
        queryClient.invalidateQueries({ queryKey: ['/api/onboarding/company/gap-questions'] });
    };

    // Handle gap answers complete
    const handleGapAnswersComplete = () => {
        setStep('review');
    };

    // Handle manual questionnaire complete
    const handleQuestionnaireComplete = () => {
        setStep('review');
    };

    // Handle final completion
    const handleComplete = () => {
        completeMutation.mutate();
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-fuchsia-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
            <div className="container mx-auto px-4 py-8 max-w-3xl">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center gap-2 mb-4">
                        <Building2 className="w-8 h-8 text-violet-600" />
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
                            Tell Us About Your Company
                        </h1>
                    </div>
                    <p className="text-muted-foreground">
                        We need to understand your business to represent you accurately in outreach
                    </p>
                </div>

                {/* Progress Bar */}
                {step !== 'complete' && (
                    <div className="mb-8">
                        <Progress value={getProgress()} className="h-2" />
                        <p className="text-sm text-muted-foreground text-center mt-2">
                            Step {getStepNumber()} of {getTotalSteps()}
                        </p>
                    </div>
                )}

                {/* Step Content */}
                {step === 'presence_check' && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Do you have an online presence?</CardTitle>
                            <CardDescription>
                                We can automatically gather information from your website and social media
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Button
                                    variant="outline"
                                    className="h-32 flex flex-col gap-2"
                                    onClick={() => handlePresenceSelection(true)}
                                >
                                    <Globe className="w-8 h-8 text-violet-600" />
                                    <span className="font-semibold">Yes, I have a website</span>
                                    <span className="text-xs text-muted-foreground">We&apos;ll analyze it automatically</span>
                                </Button>
                                <Button
                                    variant="outline"
                                    className="h-32 flex flex-col gap-2"
                                    onClick={() => handlePresenceSelection(false)}
                                >
                                    <Building2 className="w-8 h-8 text-gray-400" />
                                    <span className="font-semibold">No website yet</span>
                                    <span className="text-xs text-muted-foreground">I&apos;ll answer some questions</span>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {step === 'url_input' && (
                    <OnlinePresenceInput
                        onSubmit={handleStartExtraction}
                        onBack={() => setStep('presence_check')}
                    />
                )}

                {step === 'ai_extraction' && (
                    <ExtractionProgress
                        isLoading={extractMutation.isPending}
                        error={extractMutation.error?.message}
                    />
                )}

                {step === 'validation' && extractionResult && (
                    <ExtractedDataReview
                        data={extractionResult.data}
                        confidence={extractionResult.confidence}
                        onComplete={handleValidationComplete}
                        onBack={() => setStep('url_input')}
                    />
                )}

                {step === 'gap_questions' && gapData?.gaps && (
                    <GapQuestions
                        questions={gapData.gaps}
                        onComplete={handleGapAnswersComplete}
                        onBack={() => setStep('validation')}
                    />
                )}

                {step === 'manual_questionnaire' && questionnaireData?.sections && (
                    <ManualQuestionnaire
                        sections={questionnaireData.sections}
                        onComplete={handleQuestionnaireComplete}
                        onBack={() => setStep('presence_check')}
                    />
                )}

                {step === 'review' && (
                    <ProfileSummary
                        onComplete={handleComplete}
                        isSubmitting={completeMutation.isPending}
                        onBack={() => setStep(hasOnlinePresence ? 'gap_questions' : 'manual_questionnaire')}
                    />
                )}

                {step === 'complete' && (
                    <Card className="border-green-500 bg-green-50 dark:bg-green-900/20">
                        <CardContent className="pt-6 text-center">
                            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                            <h2 className="text-2xl font-bold mb-2">Onboarding Complete!</h2>
                            <p className="text-muted-foreground mb-6">
                                We now have everything we need to represent your company accurately
                            </p>
                            <Button onClick={onComplete}>
                                Continue to Dashboard
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}

export default CompanyOnboarding;
