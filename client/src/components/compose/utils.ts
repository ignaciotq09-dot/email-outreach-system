import { DEFAULT_ACTIVE_STYLES, type WritingStyleId } from "@shared/writing-styles";

export const loadActiveStyles = (): WritingStyleId[] => {
  try {
    const saved = localStorage.getItem('activeWritingStyles');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed as WritingStyleId[];
      }
    }
  } catch (e) {
    console.error('Failed to load active writing styles from localStorage:', e);
  }
  return DEFAULT_ACTIVE_STYLES;
};

export const loadSelectedStyle = (activeStyles: WritingStyleId[]): WritingStyleId => {
  try {
    const saved = localStorage.getItem('selectedWritingStyle');
    if (saved) {
      const parsed = JSON.parse(saved) as WritingStyleId;
      if (activeStyles.includes(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to load selected writing style from localStorage:', e);
  }
  return activeStyles[0];
};

export const getChannelFlags = (outreachChannel: string) => {
  const isEmailEnabled = ['email', 'email_sms', 'all'].includes(outreachChannel);
  const isSmsEnabled = ['sms', 'email_sms', 'all'].includes(outreachChannel);
  return { isEmailEnabled, isSmsEnabled };
};

export const DEFAULT_NEW_CONTACT = {
  name: "",
  email: "",
  company: "",
  position: "",
  phone: "",
  notes: "",
  pronoun: "Mr.",
};
