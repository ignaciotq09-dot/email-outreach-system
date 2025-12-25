// Type definitions for SentEmails component

export interface SentEmail {
    id: string;
    recipientName: string;
    company: string;
    email: string;
    subject: string;
    date: string;
    status: 'no-reply' | 'replied' | 'opened' | 'bounced';
    openedAt?: string;
}

export interface StatusConfig {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    textColor: string;
    bgColor: string;
    borderColor: string;
}

export interface ArchivedPagination {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    hasMore: boolean;
}
