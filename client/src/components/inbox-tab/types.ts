// Types for inbox tab components

export interface Reply {
    id: number;
    sentEmailId: number;
    replyReceivedAt: string;
    replyContent: string;
    gmailMessageId: string;
    status: 'new' | 'handled';
    contact: {
        id: number;
        name: string;
        email: string;
        company: string;
    };
    sentEmail: {
        id: number;
        subject: string;
        body: string;
        sentAt: string;
    };
    appointment: {
        id: number;
        status: string;
        appointmentText: string;
        googleCalendarEventId: string | null;
        aiConfidence: number | null;
        platform: string | null;
        appointmentType: string | null;
        suggestedDate: string | null;
        suggestedTime: string | null;
    } | null;
}

export interface InboxStats {
    total: number;
    needsAction: number;
    pendingMeetings: number;
    newReplies: number;
    meetings: number;
    handled: number;
}

export interface InboxResponse {
    replies: Reply[];
    stats: InboxStats;
    pagination: {
        total: number;
        offset: number;
        limit: number;
        hasMore: boolean;
    };
}

export interface MonitoringSettings {
    enabled: boolean;
    smsPhoneNumber: string;
    scanIntervalMinutes: number;
    lastScanAt: string | null;
}

export interface GmailOAuthStatus {
    connected: boolean;
    hasCustomOAuth: boolean;
    email?: string;
    hasRefreshToken?: boolean;
}

export interface AutoReplySettings {
    enabled: boolean;
    bookingLink: string | null;
    customMessage: string | null;
}

export type FilterTab = 'all' | 'action' | 'appointments' | 'handled';
