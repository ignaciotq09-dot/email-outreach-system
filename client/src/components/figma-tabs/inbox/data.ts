// Mock data for Inbox component

import type { InboxEmail } from './types';

export const MOCK_INBOX: InboxEmail[] = [
    { id: '1', senderName: 'Alice Johnson', company: 'TechCorp Solutions', email: 'alice.j@techcorp.com', subject: 'Re: Partnership Opportunity', preview: 'Thanks for reaching out! I\'d love to discuss this further...', date: 'Nov 15, 2025', status: 'unread', isStarred: true },
    { id: '2', senderName: 'Bob Smith', company: 'Startup XYZ', email: 'bob.s@startupxyz.com', subject: 'Re: Demo Follow-up', preview: 'The demo looks great. Can we schedule a call next week?', date: 'Nov 15, 2025', status: 'unread' },
    { id: '3', senderName: 'Carol Baseline', company: 'Gamma LLC', email: 'carol.b@gammaexample.com', subject: 'Re: Collaboration Proposal', preview: 'I reviewed your proposal and have a few questions...', date: 'Nov 14, 2025', status: 'read' },
    { id: '4', senderName: 'David Chen', company: 'Innovation Labs', email: 'david.c@innovationlabs.com', subject: 'Meeting Request', preview: 'Would you be available for a 30-minute call on Thursday?', date: 'Nov 14, 2025', status: 'replied' },
    { id: '5', senderName: 'Emma Wilson', company: 'Digital Agency', email: 'emma.w@digitalagency.com', subject: 'Re: Pricing Discussion', preview: 'Your pricing structure looks reasonable. Let\'s move forward...', date: 'Nov 13, 2025', status: 'read' },
    { id: '6', senderName: 'Frank Martinez', company: 'Cloud Services', email: 'frank.m@cloudservices.com', subject: 'Integration Questions', preview: 'I have some technical questions about the integration...', date: 'Nov 13, 2025', status: 'unread', isStarred: true },
    { id: '7', senderName: 'Grace Kim', company: 'Marketing Pro', email: 'grace.k@marketingpro.com', subject: 'Re: Campaign Strategy', preview: 'The campaign strategy you outlined looks promising...', date: 'Nov 12, 2025', status: 'replied' },
    { id: '8', senderName: 'Henry Lopez', company: 'Consulting Group', email: 'henry.l@consultinggroup.com', subject: 'Follow-up Question', preview: 'Quick question about the timeline you mentioned...', date: 'Nov 12, 2025', status: 'read' },
    { id: '9', senderName: 'Isabel Torres', company: 'Growth Ventures', email: 'isabel.t@growthventures.com', subject: 'Re: Partnership Terms', preview: 'I\'ve reviewed the terms and they look good overall...', date: 'Nov 11, 2025', status: 'replied' },
    { id: '10', senderName: 'Jack Peterson', company: 'Software Inc', email: 'jack.p@softwareinc.com', subject: 'Feature Request', preview: 'Would it be possible to add support for...', date: 'Nov 11, 2025', status: 'read' },
];
