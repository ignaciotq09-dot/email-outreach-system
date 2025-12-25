// Type definitions for Meetings component

export interface Meeting {
    id: string;
    attendeeName: string;
    company: string;
    email: string;
    title: string;
    date: string;
    time: string;
    duration: string;
    platform: 'zoom' | 'google-meet' | 'teams' | 'phone' | 'in-person';
    status: 'upcoming' | 'completed' | 'cancelled';
    meetingLink?: string;
    notes?: string;
}

export interface PlatformConfig {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    bgColor: string;
    borderColor: string;
}

export interface StatusConfig {
    label: string;
    color: string;
    bgColor: string;
    borderColor: string;
}

export interface MeetingStats {
    total: number;
    upcoming: number;
    completed: number;
    cancelled: number;
}
