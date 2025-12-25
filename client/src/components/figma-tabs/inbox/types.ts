// Type definitions for Inbox component

export interface InboxEmail {
    id: string;
    senderName: string;
    company: string;
    email: string;
    subject: string;
    preview: string;
    date: string;
    status: 'unread' | 'read' | 'replied';
    isStarred?: boolean;
}

export interface StatusConfig {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    textColor: string;
    bgColor: string;
    borderColor: string;
}

export interface InboxStats {
    total: number;
    unread: number;
    replied: number;
    starred: number;
}
