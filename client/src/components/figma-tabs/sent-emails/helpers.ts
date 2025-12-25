// Helper functions for SentEmails component

import { Clock, Reply, MailOpen, AlertCircle } from 'lucide-react';
import type { StatusConfig, SentEmail } from './types';

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
        case 'opened':
            return {
                label: 'Opened',
                icon: MailOpen,
                textColor: isDarkMode ? 'text-blue-400' : 'text-blue-600',
                bgColor: isDarkMode ? 'bg-blue-500/10' : 'bg-blue-100',
                borderColor: isDarkMode ? 'border-blue-500/30' : 'border-blue-300'
            };
        case 'bounced':
            return {
                label: 'Bounced',
                icon: AlertCircle,
                textColor: isDarkMode ? 'text-red-400' : 'text-red-600',
                bgColor: isDarkMode ? 'bg-red-500/10' : 'bg-red-100',
                borderColor: isDarkMode ? 'border-red-500/30' : 'border-red-300'
            };
        default:
            return {
                label: 'No Reply',
                icon: Clock,
                textColor: isDarkMode ? 'text-amber-400' : 'text-amber-600',
                bgColor: isDarkMode ? 'bg-amber-500/10' : 'bg-amber-100',
                borderColor: isDarkMode ? 'border-amber-500/30' : 'border-amber-300'
            };
    }
}

export function calculateStats(emails: SentEmail[]) {
    return {
        total: emails.length,
        sent: emails.length,
        opened: emails.filter(e => e.status === 'opened').length,
        replied: emails.filter(e => e.status === 'replied').length,
    };
}

export function transformArchivedEmail(email: any): SentEmail {
    return {
        id: String(email.id),
        recipientName: email.contact?.name || 'Unknown',
        company: email.contact?.company || 'Unknown',
        email: email.contact?.email || '',
        subject: email.subject || 'No Subject',
        date: email.sentAt ? new Date(email.sentAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '',
        status: email.replyReceived ? 'replied' : email.opened ? 'opened' : 'no-reply'
    };
}

export function transformArchivedSms(sms: any): SentEmail {
    return {
        id: String(sms.id),
        recipientName: sms.contact?.name || 'Unknown',
        company: sms.contact?.company || 'Unknown',
        email: sms.contact?.email || sms.toPhone || '',
        subject: sms.message?.substring(0, 50) + (sms.message?.length > 50 ? '...' : '') || 'SMS',
        date: sms.sentAt ? new Date(sms.sentAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '',
        status: sms.status === 'delivered' ? 'replied' : sms.status === 'sent' ? 'opened' : 'no-reply'
    };
}
