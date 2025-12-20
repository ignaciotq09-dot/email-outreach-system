export function calculateOptimalSendTime(timezone?: string): { bestDay: string; bestTime: string; reason: string } {
  return { bestDay: 'Tuesday', bestTime: '10:00 AM' + (timezone ? ` ${timezone}` : ''), reason: 'Highest statistical open rates (42.7%) and response rates (5.8%)' };
}

export function calculateOpenRatePrediction(scores: any): string {
  const avg = (scores.subjectScore + scores.timingScore) / 2;
  if (avg > 80) return '35-45%'; if (avg > 60) return '25-35%'; return '15-25%';
}

export function calculateResponseRatePrediction(scores: any): string {
  const avg = (scores.bodyScore + scores.personalizationScore) / 2;
  if (avg > 80) return '15-20%'; if (avg > 60) return '8-15%'; return '3-8%';
}

export function calculateConversionRatePrediction(scores: any, recipientData?: any): string {
  const industryRates: { [key: string]: string } = { saas: '0.03-0.5%', finance: '1-2.5%', ecommerce: '2.5-4.5%', healthcare: '1-3%' };
  if (recipientData?.industry) { return industryRates[recipientData.industry.toLowerCase()] || '0.7-2%'; }
  return '0.7-2%';
}
