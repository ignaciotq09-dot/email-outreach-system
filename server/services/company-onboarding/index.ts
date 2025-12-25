// Company onboarding service - main exports

export { extractFromOnlinePresence, isValidUrl, isValidInstagramHandle } from './online-extractor';
export { getGapQuestions, analyzeGaps, hasRequiredGaps, getCriticalGapCount } from './gap-analyzer';
export { getManualQuestionnaire, getTotalQuestionCount, getRequiredQuestionCount } from './manual-questionnaire';
export {
    saveCompanyProfile,
    getCompanyProfile,
    updateOnboardingStep,
    markOnboardingComplete,
    saveExtractedData,
    saveManualQuestionnaireData,
    updateValidatedFields,
    saveGapAnswers,
    isOnboardingComplete,
} from './profile-storage';

export type {
    OnlinePresenceInput,
    ExtractedCompanyData,
    ExtractionResult,
    ValidationSection,
    GapQuestion,
    QuestionnaireSection,
    QuestionnaireQuestion,
    FieldValidation,
    ValidatedFields,
} from './types';
