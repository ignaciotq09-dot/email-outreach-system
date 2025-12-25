// Figma Tabs - Central Export File
// This file exports all tab components for the application

// Main tab components - using explicit index paths
export { Analytics } from './analytics/index';
export { ComposeAndSend } from './compose-and-send/index';
export { Meetings } from './meetings/index';
export { SentEmails } from './sent-emails/index';
export { Inbox } from './inbox/index';
export { Settings } from './settings/index';
export { FindContactsModal } from './find-contacts-modal/index';
export { AddContacts } from './add-contacts/index';
export { FiltersSidebar } from './filters-sidebar/index';

// Shared components (these are single files, not directories)
export { EmailVariants } from './EmailVariants';
export { FindContacts } from './FindContacts';
export { HeroState } from './HeroState';
export { LeadCard } from './LeadCard';
export { Personalize } from './Personalize';
export { RadialScore } from './RadialScore';
export { ResultsView } from './ResultsView';
export { TabBar } from './TabBar';
export { WritingStyleModal } from './WritingStyleModal';

// Re-export types from modular components
export * from './analytics/types';
export * from './compose-and-send/types';
export * from './meetings/types';
export * from './sent-emails/types';
export * from './inbox/types';
export * from './filters-sidebar/types';
export * from './find-contacts-modal/types';
export * from './add-contacts/types';
