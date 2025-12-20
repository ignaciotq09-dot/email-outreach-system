export const personalizationLevels = {
  basic: { signals: ['name', 'company'], responseRate: '8.5%', examples: ['Hi {firstName}', 'I noticed {company} is...'] },
  intermediate: { signals: ['recent_news', 'job_change', 'company_growth', 'location'], responseRate: '17%', examples: ['Congrats on the Series B funding', 'Saw you just joined {company}', 'With your expansion to {city}...'] },
  advanced: { signals: ['linkedin_post', 'podcast_mention', 'specific_project', 'mutual_connection'], responseRate: '32.7%', examples: ['Your LinkedIn post about {topic} resonated', 'Heard you on {podcast} discussing...', '{MutualConnection} suggested I reach out'] },
  hyperPersonalized: { signals: ['behavioral_tracking', 'tech_stack', 'content_engagement', 'timing_patterns'], responseRate: '45%+', examples: ['Noticed you visited our pricing page 3 times', 'Since you use {tool1} with {tool2}...', 'You downloaded our guide on {topic}'] }
};
