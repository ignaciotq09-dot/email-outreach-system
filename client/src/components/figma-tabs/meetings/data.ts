// Mock data for Meetings component

import type { Meeting } from './types';

export const MOCK_MEETINGS: Meeting[] = [
    {
        id: '1',
        attendeeName: 'Sarah Mitchell',
        company: 'TechVentures Inc',
        email: 'sarah.m@techventures.com',
        title: 'Product Demo & Partnership Discussion',
        date: 'Dec 18, 2025',
        time: '2:00 PM',
        duration: '30 min',
        platform: 'zoom',
        status: 'upcoming',
        meetingLink: 'https://zoom.us/j/123456789',
        notes: 'Interested in enterprise plan'
    },
    {
        id: '2',
        attendeeName: 'Michael Chen',
        company: 'Growth Partners',
        email: 'michael.c@growthpartners.com',
        title: 'Strategy Session',
        date: 'Dec 18, 2025',
        time: '4:30 PM',
        duration: '45 min',
        platform: 'google-meet',
        status: 'upcoming',
        meetingLink: 'https://meet.google.com/xyz-abcd-efg'
    },
    {
        id: '3',
        attendeeName: 'Emily Johnson',
        company: 'Startup Labs',
        email: 'emily.j@startuplabs.com',
        title: 'Initial Consultation',
        date: 'Dec 19, 2025',
        time: '10:00 AM',
        duration: '30 min',
        platform: 'teams',
        status: 'upcoming',
        meetingLink: 'https://teams.microsoft.com/l/meetup-join/...'
    },
    {
        id: '4',
        attendeeName: 'David Park',
        company: 'Innovation Corp',
        email: 'david.p@innovationcorp.com',
        title: 'Follow-up Call',
        date: 'Dec 19, 2025',
        time: '3:00 PM',
        duration: '15 min',
        platform: 'phone',
        status: 'upcoming'
    },
    {
        id: '5',
        attendeeName: 'Lisa Anderson',
        company: 'Digital Solutions',
        email: 'lisa.a@digitalsolutions.com',
        title: 'Contract Review Meeting',
        date: 'Dec 15, 2025',
        time: '11:00 AM',
        duration: '60 min',
        platform: 'zoom',
        status: 'completed'
    },
    {
        id: '6',
        attendeeName: 'James Wilson',
        company: 'Cloud Services Ltd',
        email: 'james.w@cloudservices.com',
        title: 'Technical Integration Discussion',
        date: 'Dec 14, 2025',
        time: '2:00 PM',
        duration: '45 min',
        platform: 'google-meet',
        status: 'completed'
    },
    {
        id: '7',
        attendeeName: 'Rachel Green',
        company: 'Marketing Pro',
        email: 'rachel.g@marketingpro.com',
        title: 'Campaign Planning Session',
        date: 'Dec 13, 2025',
        time: '1:00 PM',
        duration: '30 min',
        platform: 'teams',
        status: 'cancelled'
    },
];
