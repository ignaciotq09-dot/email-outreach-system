export const scoringRubric = { nameUsage: 5, companyMention: 10, recentActivity: 20, specificProject: 25, mutualConnection: 20, behavioralData: 30, timingRelevance: 15, industrySpecific: 15, painPointAlignment: 25, techStackReference: 20 };

export const mergePatterns = { basic: ['{firstName}', '{company}', '{title}', '{location}'], dynamic: ['{recentPost}', '{companyNews}', '{mutualConnection}', '{previousInteraction}', '{websiteActivity}', '{downloadedContent}', '{eventAttended}'], calculated: ['{daysSinceVisit}', '{similarCompanies}', '{estimatedROI}', '{relevantCaseStudy}', '{competitorComparison}'] };

export function calculatePersonalizationScore(emailContent: string, signals: string[]): number {
  let score = 0;
  if (emailContent.includes('{firstName}') || emailContent.match(/\b[A-Z][a-z]+\b/)) score += scoringRubric.nameUsage;
  if (emailContent.includes('{company}') || signals.includes('company')) score += scoringRubric.companyMention;
  if (signals.includes('recentActivity')) score += scoringRubric.recentActivity;
  if (signals.includes('specificProject')) score += scoringRubric.specificProject;
  if (signals.includes('mutualConnection')) score += scoringRubric.mutualConnection;
  if (signals.includes('behavioral')) score += scoringRubric.behavioralData;
  return Math.min(100, score);
}
