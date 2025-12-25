// Helper functions for Inbox component

import { Mail, Reply, MailOpen } from 'lucide-react';
import type { StatusConfig, InboxEmail, InboxStats } from './types';

export function getStatusConfig(status: string, isDarkMode: boolean): StatusConfig {
    switch (status) {
        case 'replied':
            return {
                label: 'Replied',
                icon: Reply,
                textColor: isDarkMode ? 'text-green-400' : 'text-green-600',
                bgColor: isDarkMode ? 'bg-green-500/10' : 'bg-green-100',
                borderColor: isDarkMode ? 'border-green-500/30' : 'border-green-300'
            };
        case 'read':
            return {
                label: 'Read',
                icon: MailOpen,
                textColor: isDarkMode ? 'text-blue-400' : 'text-blue-600',
                bgColor: isDarkMode ? 'bg-blue-500/10' : 'bg-blue-100',
                borderColor: isDarkMode ? 'border-blue-500/30' : 'border-blue-300'
            };
        default:
            return {
                label: 'Unread',
                icon: Mail,
                textColor: isDarkMode ? 'text-purple-400' : 'text-purple-600',
                bgColor: isDarkMode ? 'bg-purple-500/10' : 'bg-purple-100',
                borderColor: isDarkMode ? 'border-purple-500/30' : 'border-purple-300'
            };
    }
}

export function filterEmails(
    emails: InboxEmail[],
    selectedTab: 'all' | 'unread' | 'starred'
): InboxEmail[] {
    if (selectedTab === 'unread') return emails.filter(e => e.status === 'unread');
    if (selectedTab === 'starred') return emails.filter(e => e.isStarred);
    return emails;
}

export function calculateStats(emails: InboxEmail[]): InboxStats {
    return {
        total: emails.length,
        unread: emails.filter(e => e.status === 'unread').length,
        replied: emails.filter(e => e.status === 'replied').length,
        starred: emails.filter(e => e.isStarred).length,
    };
}
