/**
 * Spam Keywords Database
 * Categorized spam trigger words and phrases
 */

export const SPAM_KEYWORDS = {
  high: [
    'free', 'click here', 'act now', 'limited time', 'urgent', 'winner',
    'congratulations', 'guarantee', 'no cost', 'risk free', 'special promotion',
    'apply now', 'call now', 'order now', 'buy now', 'clearance',
    'you have been selected', 'claim your', 'double your', 'earn money',
    'investment opportunity', 'make money', 'multilevel marketing',
    'cash bonus', 'get paid', 'income from home'
  ],
  medium: [
    'discount', 'save big', 'best price', 'lowest price', 'bargain',
    'cheap', 'deal', 'offer expires', 'trial', 'bonus',
    'subscribe', 'sign up', 'register', 'join free', 'member',
    'please read', 'important information', 'requires immediate'
  ],
  low: [
    'sale', 'new', 'exclusive', 'limited', 'opportunity',
    'amazing', 'incredible', 'unbeatable', 'special'
  ]
};

export const SUSPICIOUS_DOMAINS = [
  'bit.ly', 'tinyurl.com', 'goo.gl', 't.co', // URL shorteners
];
