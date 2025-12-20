export function getAvailableTechnologies(): string[] {
  return ['Salesforce', 'HubSpot', 'Pipedrive', 'Zoho CRM', 'Marketo', 'Mailchimp', 'Constant Contact', 'ActiveCampaign',
    'AWS', 'Google Cloud', 'Microsoft Azure', 'Heroku', 'WordPress', 'Shopify', 'Magento', 'WooCommerce',
    'React', 'Angular', 'Vue.js', 'Next.js', 'Node.js', 'Python', 'Java', 'Ruby on Rails',
    'Slack', 'Microsoft Teams', 'Zoom', 'Asana', 'Jira', 'Notion', 'Monday.com', 'Trello',
    'Stripe', 'PayPal', 'Square', 'QuickBooks', 'Xero', 'NetSuite', 'SAP'];
}

export function getSeniorityOptions(): { value: string; label: string }[] {
  return [{ value: 'Entry', label: 'Entry Level' }, { value: 'Junior', label: 'Junior' }, { value: 'Mid-Level', label: 'Mid-Level' },
    { value: 'Senior', label: 'Senior' }, { value: 'Manager', label: 'Manager' }, { value: 'Director', label: 'Director' },
    { value: 'VP', label: 'VP' }, { value: 'C-Level', label: 'C-Level' }, { value: 'Partner', label: 'Partner' },
    { value: 'Owner', label: 'Owner' }, { value: 'Founder', label: 'Founder' }];
}

export function getRevenueOptions(): { value: string; label: string }[] {
  return [{ value: 'Under $1M', label: 'Under $1M' }, { value: '$1M-$10M', label: '$1M - $10M' },
    { value: '$10M-$50M', label: '$10M - $50M' }, { value: '$50M-$100M', label: '$50M - $100M' },
    { value: '$100M-$500M', label: '$100M - $500M' }, { value: '$500M-$1B', label: '$500M - $1B' }, { value: 'Over $1B', label: 'Over $1B' }];
}
