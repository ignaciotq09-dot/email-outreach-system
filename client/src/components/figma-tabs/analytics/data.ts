// Analytics Mock Data
import type { Campaign, Contact } from './types';

export const MOCK_CAMPAIGNS: Campaign[] = [
    { id: '1', name: 'Exploring Ideas Together: Meeting Proposal', date: 'Dec 3, 2025', sent: 0, openRate: 0, replyRate: 0, status: 'draft' },
    { id: '2', name: "Follow Up: Let's Connect This Tuesday", date: 'Nov 4, 2025', sent: 0, openRate: 0, replyRate: 0, status: 'draft' },
    { id: '3', name: 'Enhance Your Website and Drive Revenue Growth', date: 'Nov 1, 2025', sent: 0, openRate: 0, replyRate: 0, status: 'draft' },
    { id: '4', name: 'Boost Your Property Listings and Profits', date: 'Nov 1, 2025', sent: 0, openRate: 0, replyRate: 0, status: 'draft' },
    { id: '5', name: 'Quick follow-up on your request', date: 'Nov 1, 2025', sent: 0, openRate: 0, replyRate: 0, status: 'draft' },
];

export const MOCK_CONTACTS: Contact[] = [
    { id: '1', name: 'Test Contact 5d85', email: 'wdgn3@exampleprovider.com', company: 'Test Company Inc', score: 0, opens: 0, replies: 0 },
    { id: '2', name: 'Test Contact f8c6', email: 'test762@exampleprovider.com', company: 'Test Company Inc', score: 0, opens: 0, replies: 0 },
    { id: '3', name: 'Debug Contact #0C', email: 'debug0C@test.com', company: 'Debug Corp', score: 0, opens: 0, replies: 0 },
    { id: '4', name: 'Alice Johnson', email: 'alice.j@testcorp.com', company: 'TechCorp Solutions', score: 0, opens: 0, replies: 0 },
    { id: '5', name: 'Bob Smith', email: 'bob.s@example.com', company: 'Innovation Labs', score: 0, opens: 0, replies: 0 },
];

export const PERFORMANCE_DATA = [
    { date: 'Dec 10', sent: 45, opened: 18, replied: 3 },
    { date: 'Dec 11', sent: 52, opened: 22, replied: 5 },
    { date: 'Dec 12', sent: 38, opened: 15, replied: 2 },
    { date: 'Dec 13', sent: 61, opened: 28, replied: 7 },
    { date: 'Dec 14', sent: 48, opened: 20, replied: 4 },
    { date: 'Dec 15', sent: 55, opened: 25, replied: 6 },
    { date: 'Dec 16', sent: 42, opened: 19, replied: 3 },
];

export const ENGAGEMENT_DATA = [
    { date: 'Nov 17', opens: 32, clicks: 18, replies: 8 },
    { date: 'Nov 24', opens: 28, clicks: 15, replies: 6 },
    { date: 'Dec 1', opens: 35, clicks: 20, replies: 9 },
    { date: 'Dec 8', opens: 40, clicks: 24, replies: 11 },
    { date: 'Dec 15', opens: 38, clicks: 22, replies: 10 },
];

export const BEST_TIMES = [
    { day: 'Sun', hours: Array(24).fill(0) },
    { day: 'Mon', hours: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
    { day: 'Tue', hours: [0, 0, 0, 0, 0, 8, 0, 9, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 7, 0, 0, 0, 0] },
    { day: 'Wed', hours: Array(24).fill(0) },
    { day: 'Thu', hours: Array(24).fill(0) },
    { day: 'Fri', hours: Array(24).fill(0) },
    { day: 'Sat', hours: Array(24).fill(0) },
];

export const DEFAULT_STATS = {
    totalSent: 472,
    openRate: 0.0,
    replyRate: 0.0,
    clickRate: 0.0,
    deliveryRate: 100.0,
    bounceRate: 0.0,
    spamScore: 0.0,
};
