import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import type { Contact, Campaign } from "@shared/schema";
import type { WritingStyleId } from "@shared/writing-styles";
import { queryClient } from "@/lib/queryClient";

import { CampaignBuilder } from "../campaign-builder";
import SpamWarning from "../spam-warning";
import ContactProfileView from "../contact-profile-view";

import ChannelSelector from "./ChannelSelector";
import MessageComposer from "./MessageComposer";
import EmailVariants from "./EmailVariants";
import ContactForm from "./ContactForm";
import ContactList from "./ContactList";
import SendPanel from "./SendPanel";
import ChannelValidationWarning from "./ChannelValidationWarning";
import { useComposeQueries } from "./hooks/useComposeQueries";
import { useComposeHandlers } from "./hooks/useComposeHandlers";
import { useSendHandlers } from "./hooks/useSendHandlers";
import { loadActiveStyles, loadSelectedStyle, DEFAULT_NEW_CONTACT } from "./utils";
import type { ComposeTabNewProps, EmailVariant, OutreachChannel, NewContactForm, ChannelValidation } from "./types";

export default function ComposeTabNew({ onNavigateToLeadFinder, refreshContactsSignal = 0 }: ComposeTabNewProps) {
  const [baseMessage, setBaseMessage] = useState("");
  const [activeStyles, setActiveStyles] = useState<WritingStyleId[]>(loadActiveStyles);
  const [writingStyle, setWritingStyle] = useState<WritingStyleId>(() => loadSelectedStyle(loadActiveStyles()));
  const [variants, setVariants] = useState<EmailVariant[]>([]);
  const [selectedVariantIndex, setSelectedVariantIndex] = useState<number | null>(null);
  const [selectedContactIds, setSelectedContactIds] = useState<Set<number>>(new Set());
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [selectedProfileContact, setSelectedProfileContact] = useState<Contact | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [activeCampaign, setActiveCampaign] = useState<Campaign | null>(null);
  const [showCampaignBuilder, setShowCampaignBuilder] = useState(false);
  const [outreachChannel, setOutreachChannel] = useState<OutreachChannel>('email');
  const [smsMessage, setSmsMessage] = useState("");
  const [originalVariants, setOriginalVariants] = useState<EmailVariant[]>([]);
  const [newContact, setNewContact] = useState<NewContactForm>(DEFAULT_NEW_CONTACT);
  const [hasInitialLoad, setHasInitialLoad] = useState(false);

  const prevRefreshSignalRef = useRef(refreshContactsSignal);
  const pendingRefreshRef = useRef(false);
  const lastExecutedCampaignIdRef = useRef<number | null>(null);

  const queries = useComposeQueries();
  const { activeDraftCampaign, campaignContactsData, isFetchingContacts, smsEnabled, variantDiversity } = queries;

  const queuedContacts = useMemo(() => {
    if (!campaignContactsData || !Array.isArray(campaignContactsData)) return [];
    return campaignContactsData.filter(cc => cc.contact !== null).map(cc => cc.contact as Contact);
  }, [campaignContactsData]);

  const isEmailEnabled = ['email', 'email_sms', 'all'].includes(outreachChannel);
  const isSmsEnabled = ['sms', 'email_sms', 'all'].includes(outreachChannel);

  const channelValidation = useMemo((): ChannelValidation => {
    const selectedContacts = queuedContacts.filter(c => selectedContactIds.has(c.id));
    const withEmail = selectedContacts.filter(c => Boolean(c.email));
    const withPhone = selectedContacts.filter(c => Boolean(c.phone));

    return {
      total: selectedContacts.length,
      emailSends: isEmailEnabled ? withEmail.length : 0,
      smsSends: isSmsEnabled ? withPhone.length : 0,
      skippedEmail: isEmailEnabled ? selectedContacts.filter(c => !c.email) : [],
      skippedSms: isSmsEnabled ? selectedContacts.filter(c => !c.phone) : [],
      hasWarnings: (isEmailEnabled && selectedContacts.some(c => !c.email)) || (isSmsEnabled && selectedContacts.some(c => !c.phone)),
      includesEmail: isEmailEnabled, includesSms: isSmsEnabled,
    };
  }, [queuedContacts, selectedContactIds, isEmailEnabled, isSmsEnabled]);

  const resetComposeState = useCallback(() => {
    setBaseMessage(""); setVariants([]); setOriginalVariants([]); setSelectedVariantIndex(null);
    setSelectedContactIds(new Set()); setFeedback(""); setShowCampaignBuilder(false); setActiveCampaign(null);
    setSmsMessage(""); setOutreachChannel('email');
  }, []);

  const handlers = useComposeHandlers({
    activeDraftCampaign, variants, originalVariants, selectedVariantIndex, writingStyle,
    setVariants, setOriginalVariants, setSelectedVariantIndex, setSelectedContactIds,
    setIsGenerating, setIsRegenerating, setActiveCampaign, setShowCampaignBuilder, setNewContact, setFeedback,
    baseMessage, feedback, variantDiversity,
    onSmsOptimized: (result) => {
      setSmsMessage(result.optimizedMessage);
    },
  });

  const sendHandlers = useSendHandlers({
    activeDraftCampaign, variants, selectedVariantIndex, selectedContactIds, channelValidation,
    smsMessage, writingStyle,
    setSelectedContactIds, setIsSending, resetComposeState, forceFetchContacts: handlers.forceFetchContacts,
  });

  const toggleChannel = useCallback((channel: 'email' | 'sms') => {
    let newEmail = isEmailEnabled, newSms = isSmsEnabled;
    if (channel === 'email') newEmail = !isEmailEnabled;
    if (channel === 'sms') newSms = !isSmsEnabled;

    if (newEmail && newSms) setOutreachChannel('email_sms');
    else if (newEmail) setOutreachChannel('email');
    else if (newSms) setOutreachChannel('sms');
    else setOutreachChannel('email');
  }, [isEmailEnabled, isSmsEnabled]);

  useEffect(() => {
    const loadContacts = async () => {
      if (activeDraftCampaign?.id && !hasInitialLoad) {
        setHasInitialLoad(true);
        await queryClient.invalidateQueries({ queryKey: ['/api/campaigns', activeDraftCampaign.id, 'contacts'] });
        await handlers.forceFetchContacts(activeDraftCampaign.id);
      }
    };
    loadContacts();
  }, [activeDraftCampaign?.id, hasInitialLoad, handlers.forceFetchContacts]);

  useEffect(() => {
    localStorage.setItem('activeWritingStyles', JSON.stringify(activeStyles));
    if (!activeStyles.includes(writingStyle)) setWritingStyle(activeStyles[0]);
  }, [activeStyles, writingStyle]);

  useEffect(() => { localStorage.setItem('selectedWritingStyle', JSON.stringify(writingStyle)); }, [writingStyle]);

  useEffect(() => {
    if (refreshContactsSignal > 0 && refreshContactsSignal !== prevRefreshSignalRef.current) {
      prevRefreshSignalRef.current = refreshContactsSignal;
      pendingRefreshRef.current = true;
      lastExecutedCampaignIdRef.current = null;
    }
  }, [refreshContactsSignal]);

  useEffect(() => {
    const exec = async () => {
      if (pendingRefreshRef.current && activeDraftCampaign?.id && lastExecutedCampaignIdRef.current !== activeDraftCampaign.id) {
        pendingRefreshRef.current = false;
        lastExecutedCampaignIdRef.current = activeDraftCampaign.id;
        await new Promise(r => setTimeout(r, 100));
        await handlers.forceFetchContacts(activeDraftCampaign.id);
      }
    };
    exec();
  }, [activeDraftCampaign?.id, handlers.forceFetchContacts]);

  if (showCampaignBuilder && activeCampaign) {
    return <CampaignBuilder campaignId={activeCampaign.id} emailSubject={activeCampaign.subject || ""} emailBody={activeCampaign.body || ""} onBack={handlers.handleBackToVariants} onNavigateToLeadFinder={onNavigateToLeadFinder} />;
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <ChannelSelector outreachChannel={outreachChannel} smsEnabled={smsEnabled} onToggleChannel={toggleChannel} />
      <MessageComposer baseMessage={baseMessage} onBaseMessageChange={setBaseMessage} writingStyle={writingStyle} onStyleChange={setWritingStyle} activeStyles={activeStyles} onActiveStylesChange={setActiveStyles} isGenerating={isGenerating} onGenerate={handlers.handleGenerateVariants} />
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-6">
          <EmailVariants variants={variants} selectedVariantIndex={selectedVariantIndex} feedback={feedback} isRegenerating={isRegenerating} onSelectVariant={handlers.handleSelectVariant} onVariantChange={handlers.handleVariantChange} onFeedbackChange={setFeedback} onRegenerate={handlers.handleRegenerateWithFeedback} />
          {selectedVariantIndex !== null && (
            <div className="space-y-6">
              <div><h2 className="text-lg font-semibold mb-3">Step 3: Choose Recipients</h2><p className="text-sm text-muted-foreground mb-4">Add new contacts or select from existing</p></div>
              {variants[selectedVariantIndex] && <SpamWarning subject={variants[selectedVariantIndex].subject} body={variants[selectedVariantIndex].body} enabled={true} />}
              <ContactForm contact={newContact} onChange={setNewContact} onSubmit={() => handlers.handleAddToQueue(newContact)} />
              <ContactList contacts={queuedContacts} selectedContactIds={selectedContactIds} outreachChannel={outreachChannel} isFetching={isFetchingContacts} onToggleContact={handlers.handleToggleContact} onRemoveContact={handlers.handleRemoveFromQueue} onRefresh={handlers.handleRefreshContacts} onDeleteAll={() => handlers.handleDeleteAllContacts(queuedContacts.length)} onNavigateToLeadFinder={onNavigateToLeadFinder} />
              <SendPanel outreachChannel={outreachChannel} smsEnabled={smsEnabled} smsMessage={smsMessage} channelValidation={channelValidation} selectedContactCount={selectedContactIds.size} isSending={isSending} onChannelChange={setOutreachChannel} onSmsMessageChange={setSmsMessage} onSend={sendHandlers.handleSendToSelected} />
              <ChannelValidationWarning validation={channelValidation} selectedCount={selectedContactIds.size} />
            </div>
          )}
        </div>
      </div>
      <ContactProfileView contact={selectedProfileContact} open={isProfileOpen} onOpenChange={async (open) => { setIsProfileOpen(open); if (!open && activeDraftCampaign?.id) await handlers.forceFetchContacts(activeDraftCampaign.id); }} />
    </div>
  );
}

export { default as ChannelSelector } from "./ChannelSelector";
export { default as MessageComposer } from "./MessageComposer";
export { default as EmailVariants } from "./EmailVariants";
export { default as ContactForm } from "./ContactForm";
export { default as ContactList } from "./ContactList";
export { default as SendPanel } from "./SendPanel";
export { default as ChannelValidationWarning } from "./ChannelValidationWarning";
export * from "./types";
