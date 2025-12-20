export const triggerEvents = {
  companyTriggers: {
    leadershipChange: { signal: 'New {title} hired', timing: 'Within 30 days', impact: '+42% response', message: 'New leadership often means new initiatives' },
    officeMove: { signal: 'Relocated to {location}', timing: 'Within 2 weeks', impact: '+28% response', message: 'Fresh start in new space' },
    headcountGrowth: { signal: 'Hiring {number} people', timing: 'Ongoing', impact: '+35% response', message: 'Scaling teams need scaling tools' },
    layoffs: { signal: 'Restructuring announced', timing: 'Wait 30+ days', impact: 'Sensitive', message: 'Focus on efficiency gains' }
  },
  personalTriggers: {
    promotion: { signal: 'Promoted to {title}', timing: 'Within 2 weeks', impact: '+45% response', message: 'New role, new challenges' },
    speaking: { signal: 'Speaking at {event}', timing: 'Before/after event', impact: '+38% response', message: 'Your talk topic aligns with...' },
    publication: { signal: 'Published {article/book}', timing: 'Within 1 week', impact: '+41% response', message: 'Your insights on {topic}...' },
    anniversary: { signal: 'Work anniversary', timing: 'Day of', impact: '+25% response', message: 'Congrats on {years} years!' }
  }
};
