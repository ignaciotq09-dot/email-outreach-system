import type { Contact, Campaign } from "@shared/schema";
import type { WritingStyleId } from "@shared/writing-styles";

export interface CampaignContactWithContact {
  id: number;
  campaignId: number;
  contactId: number;
  addedAt: string | null;
  sentEmailId: number | null;
  contact: Contact | null;
}

export interface EmailVariant {
  subject: string;
  body: string;
  approach: string;
}

export type OutreachChannel = 'email' | 'sms' | 'linkedin' | 'email_sms' | 'email_linkedin' | 'all';

export interface ChannelValidation {
  total: number;
  emailSends: number;
  smsSends: number;
  linkedinSends: number;
  skippedEmail: Contact[];
  skippedSms: Contact[];
  skippedLinkedin: Contact[];
  hasWarnings: boolean;
  includesEmail: boolean;
  includesSms: boolean;
  includesLinkedin: boolean;
}

export interface NewContactForm {
  name: string;
  email: string;
  company: string;
  position: string;
  phone: string;
  notes: string;
  pronoun: string;
}

export interface ComposeTabNewProps {
  onNavigateToLeadFinder?: () => void;
  refreshContactsSignal?: number;
}

export interface ComposeState {
  baseMessage: string;
  activeStyles: WritingStyleId[];
  writingStyle: WritingStyleId;
  variants: EmailVariant[];
  selectedVariantIndex: number | null;
  selectedContactIds: Set<number>;
  isGenerating: boolean;
  isSending: boolean;
  feedback: string;
  isRegenerating: boolean;
  selectedProfileContact: Contact | null;
  isProfileOpen: boolean;
  activeCampaign: Campaign | null;
  showCampaignBuilder: boolean;
  outreachChannel: OutreachChannel;
  smsMessage: string;
  linkedinMessage: string;
  linkedinMessageType: 'connection_request' | 'direct_message';
  originalVariants: EmailVariant[];
  newContact: NewContactForm;
  hasInitialLoad: boolean;
}
