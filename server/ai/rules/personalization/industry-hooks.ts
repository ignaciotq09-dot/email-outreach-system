export const industryHooks = {
  seasonal: {
    retail: { q4: 'Preparing for holiday rush?', q1: 'Post-holiday optimization time', backToSchool: 'Back-to-school prep' },
    saas: { endOfQuarter: 'End of quarter push', renewal: 'Renewal season approaching', budgetPlanning: 'Budget planning for next year' },
    finance: { yearEnd: 'Year-end reporting crunch', taxSeason: 'Tax season preparation', auditTime: 'Audit season challenges' }
  },
  regulatory: {
    compliance: { pattern: 'New {regulation} requirements', impact: '+48% response', example: 'GDPR updates affecting you?' },
    deadline: { pattern: '{Regulation} deadline approaching', impact: '+52% response', urgency: 'High', example: 'SOC2 deadline in 60 days' }
  }
};
