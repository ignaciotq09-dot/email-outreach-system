// Data constants for Settings component

export const INTERVAL_OPTIONS = ['15 minutes', '30 minutes', '1 hour', '2 hours', '4 hours'];

// Email provider configurations
export const EMAIL_PROVIDERS = [
    {
        id: 'gmail',
        name: 'Gmail',
        iconColor: { dark: 'text-red-400', light: 'text-red-600' },
        bgColor: { dark: 'bg-red-500/10', light: 'bg-red-100' },
        connectedMessage: 'Connected with Gmail account to send emails and track replies',
    },
    {
        id: 'outlook',
        name: 'Outlook',
        iconColor: { dark: 'text-blue-400', light: 'text-blue-600' },
        bgColor: { dark: 'bg-blue-500/10', light: 'bg-blue-100' },
        connectedMessage: 'Connected with Outlook account to send emails',
    },
    {
        id: 'yahoo',
        name: 'Yahoo Mail',
        iconColor: { dark: 'text-purple-400', light: 'text-purple-600' },
        bgColor: { dark: 'bg-purple-500/10', light: 'bg-purple-100' },
        connectedMessage: 'Connected with Yahoo account to send emails',
    },
] as const;

export type EmailProviderId = 'gmail' | 'outlook' | 'yahoo';
