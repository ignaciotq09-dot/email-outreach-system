// Profile storage - save and retrieve company profiles

import { db } from '../../db';
import { companyProfiles } from '@shared/schemas/company-profile-schema';
import { eq } from 'drizzle-orm';
import type { CompanyProfile, InsertCompanyProfile, UpdateCompanyProfile } from '@shared/schemas/company-profile-schema';
import type { ExtractedCompanyData, ValidatedFields } from './types';

export async function saveCompanyProfile(
    userId: number,
    data: Partial<InsertCompanyProfile>
): Promise<CompanyProfile> {
    const existing = await getCompanyProfile(userId);

    if (existing) {
        // Update existing profile
        const [updated] = await db
            .update(companyProfiles)
            .set({
                ...data,
                updatedAt: new Date(),
            })
            .where(eq(companyProfiles.userId, userId))
            .returning();

        return updated;
    } else {
        // Create new profile
        const [created] = await db
            .insert(companyProfiles)
            .values({
                userId,
                ...data,
            })
            .returning();

        return created;
    }
}

export async function getCompanyProfile(userId: number): Promise<CompanyProfile | null> {
    const [profile] = await db
        .select()
        .from(companyProfiles)
        .where(eq(companyProfiles.userId, userId));

    return profile || null;
}

export async function updateOnboardingStep(
    userId: number,
    step: string,
    additionalData?: Partial<InsertCompanyProfile>
): Promise<CompanyProfile> {
    return saveCompanyProfile(userId, {
        onboardingStep: step,
        ...additionalData,
    });
}

export async function markOnboardingComplete(userId: number): Promise<CompanyProfile> {
    return saveCompanyProfile(userId, {
        onboardingStep: 'complete',
        onboardingComplete: true,
        completedAt: new Date(),
    });
}

export async function saveExtractedData(
    userId: number,
    extractedData: ExtractedCompanyData,
    overallConfidence: number
): Promise<CompanyProfile> {
    return saveCompanyProfile(userId, {
        dataSource: 'ai_extracted',
        extractionConfidence: overallConfidence,
        onboardingStep: 'validation',

        // Map extracted data to profile fields
        companyName: extractedData.companyName,
        businessType: extractedData.businessType,
        industry: extractedData.industry,
        yearsInBusiness: extractedData.yearsInBusiness,
        employeeCount: extractedData.employeeCount,
        tagline: extractedData.tagline,
        missionStatement: extractedData.missionStatement,

        businessDescription: extractedData.businessDescription,
        productsServices: extractedData.productsServices,
        pricingModel: extractedData.pricingModel,
        typicalDealSize: extractedData.typicalDealSize,

        idealCustomerDescription: extractedData.idealCustomerDescription,
        targetJobTitles: extractedData.targetJobTitles,
        targetIndustries: extractedData.targetIndustries,
        targetCompanySizes: extractedData.targetCompanySizes,
        targetGeographies: extractedData.targetGeographies,

        problemSolved: extractedData.problemSolved,
        uniqueDifferentiator: extractedData.uniqueDifferentiator,
        typicalResults: extractedData.typicalResults,
        notableClients: extractedData.notableClients,

        brandPersonality: extractedData.brandPersonality,
        formalityLevel: extractedData.formalityLevel,
        phrasesToUse: extractedData.phrasesToUse,
        phrasesToAvoid: extractedData.phrasesToAvoid,
    });
}

export async function saveManualQuestionnaireData(
    userId: number,
    answers: Record<string, any>
): Promise<CompanyProfile> {
    // Parse array fields from comma-separated strings
    const parseArray = (value: any): string[] | undefined => {
        if (Array.isArray(value)) return value;
        if (typeof value === 'string' && value.trim()) {
            return value.split(',').map(s => s.trim()).filter(Boolean);
        }
        return undefined;
    };

    return saveCompanyProfile(userId, {
        dataSource: 'manual',
        onboardingStep: 'review',
        hasOnlinePresence: false,

        companyName: answers.companyName,
        businessType: answers.businessType,
        industry: answers.industry,
        industryOther: answers.industryOther,
        yearsInBusiness: answers.yearsInBusiness,
        employeeCount: answers.employeeCount,

        businessDescription: answers.businessDescription,
        productsServices: parseArray(answers.productsServices),
        pricingModel: parseArray(answers.pricingModel),
        typicalDealSize: answers.typicalDealSize,

        idealCustomerDescription: answers.idealCustomerDescription,
        targetJobTitles: parseArray(answers.targetJobTitles),
        targetIndustries: parseArray(answers.targetIndustries),
        targetCompanySizes: parseArray(answers.targetCompanySizes),
        targetGeographies: parseArray(answers.targetGeographies),

        problemSolved: answers.problemSolved,
        uniqueDifferentiator: answers.uniqueDifferentiator,
        typicalResults: answers.typicalResults,
        notableClients: answers.notableClients,

        salesCycleLength: answers.salesCycleLength,
        commonObjections: parseArray(answers.commonObjections),
        currentChallenges: answers.currentChallenges,

        brandPersonality: parseArray(answers.brandPersonality),
        formalityLevel: answers.formalityLevel,
        phrasesToUse: answers.phrasesToUse,
        phrasesToAvoid: answers.phrasesToAvoid,

        desiredLeadAction: parseArray(answers.desiredLeadAction),
        additionalNotes: answers.additionalNotes,
    });
}

export async function updateValidatedFields(
    userId: number,
    fieldValidations: ValidatedFields
): Promise<CompanyProfile> {
    const existing = await getCompanyProfile(userId);
    const currentValidations = (existing?.validatedFields as ValidatedFields) || {};

    return saveCompanyProfile(userId, {
        validatedFields: {
            ...currentValidations,
            ...fieldValidations,
        },
    });
}

export async function saveGapAnswers(
    userId: number,
    answers: Record<string, any>
): Promise<CompanyProfile> {
    // Merge gap answers with existing profile
    const existing = await getCompanyProfile(userId);
    if (!existing) {
        throw new Error('No existing profile to update with gap answers');
    }

    const updates: Partial<InsertCompanyProfile> = {
        dataSource: existing.dataSource === 'ai_extracted' ? 'hybrid' : existing.dataSource,
        onboardingStep: 'review',
    };

    // Map answers to profile fields
    for (const [key, value] of Object.entries(answers)) {
        if (value !== undefined && value !== null && value !== '') {
            (updates as any)[key] = value;
        }
    }

    return saveCompanyProfile(userId, updates);
}

export async function isOnboardingComplete(userId: number): Promise<boolean> {
    const profile = await getCompanyProfile(userId);
    return profile?.onboardingComplete ?? false;
}
