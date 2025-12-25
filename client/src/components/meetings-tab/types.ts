// Types and utilities for meetings tab

import { format, isToday, isTomorrow } from "date-fns";

export interface Meeting {
    id: number;
    contactId: number;
    contactName: string;
    contactEmail: string;
    contactCompany: string;
    appointmentType: string | null;
    suggestedDate: string | null;
    suggestedTime: string | null;
    duration: number | null;
    location: string | null;
    notes: string | null;
    status: string;
    googleCalendarEventId: string | null;
    googleCalendarLink: string | null;
    detectedAt: string;
    rawEmailText: string | null;
}

export interface Booking {
    id: number;
    guestName: string;
    guestEmail: string;
    guestPhone?: string;
    guestNotes?: string;
    startTime: string;
    endTime: string;
    timezone: string;
    status: string;
    meetingLink?: string;
    createdAt: string;
}

export interface BookingPage {
    id: number;
    slug: string;
    title: string;
    description?: string;
    duration: number;
    timezone: string;
    isActive: boolean;
    bookingUrl: string;
}

export interface BookingStats {
    total: number;
    confirmed: number;
    cancelled: number;
    upcoming: number;
}

export function formatMeetingDate(dateStr: string): string {
    const date = new Date(dateStr);
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    return format(date, "EEE, MMM d");
}
