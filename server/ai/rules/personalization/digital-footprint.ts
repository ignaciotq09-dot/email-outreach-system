export const digitalFootprintSignals = {
  linkedinActivity: {
    recentPost: { pattern: 'I saw your post about {topic}', impact: '+41% response', timing: 'Reference within 48 hours', example: 'Your post about remote work challenges really hit home' },
    jobChange: { pattern: 'Congrats on the new role at {company}', impact: '+38% response', timing: 'Within 30 days of change', example: 'Congrats on joining Acme Corp as VP Sales!' },
    certification: { pattern: 'Noticed you got certified in {skill}', impact: '+28% response', example: 'Saw you just got AWS certified - impressive!' },
    articleEngagement: { pattern: 'Your comment on {article} about {topic}', impact: '+35% response', example: 'Your comment on the SaaS pricing article raised great points' },
    groupActivity: { pattern: 'Saw your question in {group}', impact: '+31% response', example: 'Saw your question in the Sales Leaders group' }
  },
  companyNews: {
    funding: { pattern: 'Congrats on the {round} funding', impact: '+45% response', timing: 'Within 2 weeks', followUp: 'Scaling must be top priority now', example: 'Congrats on the $50M Series B!' },
    acquisition: { pattern: 'With the {company} acquisition', impact: '+42% response', followUp: 'Integration challenges ahead', example: 'With acquiring TechCo, integration must be key' },
    productLaunch: { pattern: 'Saw you launched {product}', impact: '+35% response', followUp: 'Growth mode!', example: 'Saw you launched the new analytics dashboard' },
    awards: { pattern: 'Congrats on the {award}', impact: '+33% response', example: 'Congrats on winning Best Workplace!' },
    partnership: { pattern: 'Your partnership with {partner}', impact: '+31% response', example: 'Your Salesforce partnership is exciting' }
  },
  behavioralData: {
    websiteVisit: { pattern: 'Noticed you checked out {page}', impact: '+55% response', timing: 'Within 24 hours', example: 'Noticed you checked out our pricing page' },
    contentDownload: { pattern: 'You downloaded our {resource}', impact: '+52% response', example: 'Since you downloaded our ROI guide' },
    emailOpen: { pattern: 'Saw you read my previous message', impact: '+35% response', timing: 'Subtle reference only', example: 'Following up since you seemed interested' },
    featureExplore: { pattern: 'You explored our {feature}', impact: '+48% response', example: 'The integration features you viewed' },
    demoRequest: { pattern: 'You started a demo request', impact: '+65% response', urgency: 'Highest intent', example: 'Saw you started scheduling a demo' }
  }
};
