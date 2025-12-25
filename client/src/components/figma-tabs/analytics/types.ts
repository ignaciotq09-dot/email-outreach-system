// Analytics Types
export interface Campaign {
    id: string;
    name: string;
    date: string;
    sent: number;
    openRate: number;
    replyRate: number;
    status: 'active' | 'draft' | 'completed';
}

export interface Contact {
    id: string;
    name: string;
    email: string;
    company: string;
    score: number;
    opens: number;
    replies: number;
}

export interface AnalyticsStats {
    totalSent: number;
    openRate: number;
    replyRate: number;
    clickRate: number;
    deliveryRate: number;
    bounceRate: number;
    spamScore: number;
}
