export const technographicSignals = {
  currentStack: {
    complementary: { pattern: 'Since you use {tool}, our {feature} integrates perfectly', impact: '+41% response', example: 'Since you use Salesforce, our native integration...' },
    competitive: { pattern: 'I see you use {competitor}', impact: '+38% response', approach: 'Position as enhancement not replacement', example: 'Using HubSpot? We complement it well' },
    gap: { pattern: 'Noticed you have {tool1} but not {tool2}', impact: '+43% response', example: 'You have Slack but no project management tool' },
    limitation: { pattern: '{Tool} doesn\'t handle {use_case}', impact: '+45% response', example: 'Zendesk doesn\'t handle video support' }
  },
  stackChanges: {
    recentAddition: { pattern: 'Saw you added {tool} recently', impact: '+37% response', example: 'With Datadog now in your stack...' },
    removal: { pattern: 'Noticed you moved away from {tool}', impact: '+35% response', example: 'After dropping Intercom...' },
    evaluation: { pattern: 'Researching alternatives to {tool}?', impact: '+48% response', example: 'Looking to replace Zendesk?' }
  }
};
