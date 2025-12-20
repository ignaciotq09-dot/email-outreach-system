import { useCallback, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Contact, Campaign } from "@shared/schema";
import type { CampaignContactWithContact, EmailVariant, NewContactForm } from "../types";
import { DEFAULT_NEW_CONTACT } from "../utils";

interface SmsOptimizationResult {
  optimizedMessage: string;
  charCount: number;
  segmentCount: number;
  hookPreview: string;
  warnings: string[];
  suggestions: string[];
}

interface UseComposeHandlersProps {
  activeDraftCampaign: Campaign | undefined;
  variants: EmailVariant[];
  originalVariants: EmailVariant[];
  selectedVariantIndex: number | null;
  writingStyle: string;
  setVariants: (v: EmailVariant[] | ((p: EmailVariant[]) => EmailVariant[])) => void;
  setOriginalVariants: (v: EmailVariant[]) => void;
  setSelectedVariantIndex: (i: number | null) => void;
  setSelectedContactIds: (s: Set<number> | ((p: Set<number>) => Set<number>)) => void;
  setIsGenerating: (b: boolean) => void;
  setIsRegenerating: (b: boolean) => void;
  setActiveCampaign: (c: Campaign | null) => void;
  setShowCampaignBuilder: (b: boolean) => void;
  setNewContact: (c: NewContactForm) => void;
  setFeedback: (f: string) => void;
  baseMessage: string;
  feedback: string;
  variantDiversity: number;
  // SMS optimization callback
  onSmsOptimized?: (result: SmsOptimizationResult) => void;
}

export function useComposeHandlers(props: UseComposeHandlersProps) {
  const { toast } = useToast();
  const editTrackingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const forceFetchContacts = useCallback(async (campaignId: number): Promise<CampaignContactWithContact[]> => {
    const queryKey = ['/api/campaigns', campaignId, 'contacts'];
    await queryClient.cancelQueries({ queryKey });
    return await queryClient.fetchQuery<CampaignContactWithContact[]>({
      queryKey, staleTime: 0, gcTime: 0, networkMode: 'always',
    }) ?? [];
  }, []);

  const handleRefreshContacts = useCallback(async () => {
    if (!props.activeDraftCampaign?.id) return;
    try {
      await queryClient.invalidateQueries({ queryKey: ['/api/campaigns', props.activeDraftCampaign.id, 'contacts'] });
      const freshData = await forceFetchContacts(props.activeDraftCampaign.id);
      toast({ title: "Contacts Refreshed", description: `${freshData.filter(cc => cc.contact !== null).length} contacts loaded` });
    } catch {
      toast({ title: "Refresh Failed", description: "Could not load contacts.", variant: "destructive" });
    }
  }, [props.activeDraftCampaign?.id, forceFetchContacts, toast]);

  const trackEditSilently = useCallback(async (original: EmailVariant, edited: EmailVariant) => {
    const originalText = `Subject: ${original.subject}\n\n${original.body}`;
    const editedText = `Subject: ${edited.subject}\n\n${edited.body}`;
    if (originalText === editedText) return;
    try {
      await apiRequest('POST', '/api/user/email-edits', { originalText, editedText, editType: 'variant_modification', context: edited.approach });
    } catch { }
  }, []);

  const handleAddToQueue = useCallback(async (newContact: NewContactForm) => {
    if (!props.activeDraftCampaign?.id) {
      toast({ title: "Error", description: "No active campaign.", variant: "destructive" });
      return;
    }
    if (!newContact.name || !newContact.email || !newContact.company) {
      toast({ title: "Missing Information", description: "Please fill in name, email, and company.", variant: "destructive" });
      return;
    }
    try {
      const result = await apiRequest<{ contact: Contact }>("POST", `/api/campaigns/${props.activeDraftCampaign.id}/contacts`, newContact);
      props.setNewContact(DEFAULT_NEW_CONTACT);
      await queryClient.invalidateQueries({ queryKey: ['/api/campaigns', props.activeDraftCampaign.id, 'contacts'] });
      await forceFetchContacts(props.activeDraftCampaign.id);
      toast({ title: "Contact Added", description: `${result.contact.name} has been added.` });
    } catch (error: any) {
      toast({ title: "Error", description: error?.message || "Failed to add contact.", variant: "destructive" });
    }
  }, [props.activeDraftCampaign?.id, props.setNewContact, forceFetchContacts, toast]);

  const handleRemoveFromQueue = useCallback(async (contactId: number) => {
    if (!props.activeDraftCampaign?.id) return;
    try {
      await apiRequest("DELETE", `/api/campaigns/${props.activeDraftCampaign.id}/contacts/by-contact/${contactId}`);
      props.setSelectedContactIds(prev => { const n = new Set(prev); n.delete(contactId); return n; });
      await queryClient.invalidateQueries({ queryKey: ['/api/campaigns', props.activeDraftCampaign.id, 'contacts'] });
      await forceFetchContacts(props.activeDraftCampaign.id);
    } catch {
      toast({ title: "Error", description: "Failed to remove contact.", variant: "destructive" });
    }
  }, [props.activeDraftCampaign?.id, props.setSelectedContactIds, forceFetchContacts, toast]);

  const handleDeleteAllContacts = useCallback(async (count: number) => {
    if (count === 0 || !props.activeDraftCampaign?.id) return;
    try {
      await apiRequest("DELETE", `/api/campaigns/${props.activeDraftCampaign.id}/contacts/all`);
      props.setSelectedContactIds(new Set());
      await queryClient.invalidateQueries({ queryKey: ['/api/campaigns', props.activeDraftCampaign.id, 'contacts'] });
      await forceFetchContacts(props.activeDraftCampaign.id);
      toast({ title: "Contacts Deleted", description: `Removed all contacts` });
    } catch {
      toast({ title: "Error", description: "Failed to delete contacts.", variant: "destructive" });
    }
  }, [props.activeDraftCampaign?.id, props.setSelectedContactIds, forceFetchContacts, toast]);

  const handleGenerateVariants = useCallback(async () => {
    if (!props.baseMessage) {
      toast({ title: "Missing Message", description: "Please enter a base message.", variant: "destructive" });
      return;
    }
    props.setIsGenerating(true);
    try {
      // Generate email variants and optimize for SMS in parallel
      const [emailResult, smsResult] = await Promise.all([
        apiRequest<{ variants: EmailVariant[] }>("POST", "/api/emails/generate", {
          baseMessage: props.baseMessage, writingStyle: props.writingStyle, variantDiversity: props.variantDiversity
        }),
        apiRequest<SmsOptimizationResult>("POST", "/api/sms/optimize", {
          baseMessage: props.baseMessage,
          context: 'sales',
        }).catch(() => null), // SMS optimization is optional, don't fail if it errors
      ]);

      props.setVariants(emailResult.variants);
      props.setOriginalVariants(JSON.parse(JSON.stringify(emailResult.variants)));
      props.setSelectedVariantIndex(null);

      // If SMS optimization succeeded, notify parent
      if (smsResult && props.onSmsOptimized) {
        props.onSmsOptimized(smsResult);
      }

      const smsNote = smsResult ? ` SMS optimized to ${smsResult.charCount} chars.` : '';
      toast({ title: "Variants Generated", description: `3 email variants generated!${smsNote}` });
    } catch {
      toast({ title: "Error", description: "Failed to generate variants.", variant: "destructive" });
    } finally {
      props.setIsGenerating(false);
    }
  }, [props.baseMessage, props.writingStyle, props.variantDiversity, props.setVariants, props.setOriginalVariants, props.setSelectedVariantIndex, props.setIsGenerating, props.onSmsOptimized, toast]);

  const handleRegenerateWithFeedback = useCallback(async () => {
    if (!props.feedback.trim()) return;
    props.setIsRegenerating(true);
    try {
      const result = await apiRequest<{ variants: EmailVariant[] }>("POST", "/api/emails/regenerate", {
        baseMessage: props.baseMessage, writingStyle: props.writingStyle, currentVariants: props.variants, feedback: props.feedback, variantDiversity: props.variantDiversity
      });
      props.setVariants(result.variants);
      props.setOriginalVariants(JSON.parse(JSON.stringify(result.variants)));
      props.setSelectedVariantIndex(null);
      props.setFeedback("");
      toast({ title: "Variants Regenerated", description: "New variants generated!" });
    } catch {
      toast({ title: "Error", description: "Failed to regenerate variants.", variant: "destructive" });
    } finally {
      props.setIsRegenerating(false);
    }
  }, [props.feedback, props.baseMessage, props.writingStyle, props.variants, props.variantDiversity, props.setVariants, props.setOriginalVariants, props.setSelectedVariantIndex, props.setFeedback, props.setIsRegenerating, toast]);

  const handleToggleContact = useCallback((id: number) => {
    props.setSelectedContactIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }, [props.setSelectedContactIds]);

  const handleVariantChange = useCallback((index: number, updated: EmailVariant) => {
    props.setVariants(prev => { const n = [...prev]; n[index] = updated; return n; });
    if (props.originalVariants[index]) {
      if (editTrackingTimeoutRef.current) clearTimeout(editTrackingTimeoutRef.current);
      editTrackingTimeoutRef.current = setTimeout(() => trackEditSilently(props.originalVariants[index], updated), 2000);
    }
  }, [props.setVariants, props.originalVariants, trackEditSilently]);

  const handleSelectVariant = useCallback(async (index: number) => {
    props.setSelectedVariantIndex(index);
    const variant = props.variants[index];
    if (!props.activeDraftCampaign?.id) return;
    try {
      const updatedCampaign = await apiRequest<Campaign>("PATCH", `/api/campaigns/${props.activeDraftCampaign.id}`, {
        subject: variant.subject, body: variant.body, writingStyle: props.writingStyle
      });
      queryClient.invalidateQueries({ queryKey: ['/api/campaigns/active-draft'] });
      props.setActiveCampaign(updatedCampaign);
      props.setShowCampaignBuilder(true);
    } catch {
      toast({ title: "Error", description: "Failed to save campaign.", variant: "destructive" });
    }
  }, [props.setSelectedVariantIndex, props.variants, props.activeDraftCampaign?.id, props.writingStyle, props.setActiveCampaign, props.setShowCampaignBuilder, toast]);

  const handleBackToVariants = useCallback(async () => {
    props.setShowCampaignBuilder(false);
    props.setActiveCampaign(null);
    if (props.activeDraftCampaign?.id) {
      await queryClient.invalidateQueries({ queryKey: ['/api/campaigns', props.activeDraftCampaign.id, 'contacts'] });
      await forceFetchContacts(props.activeDraftCampaign.id);
    }
  }, [props.setShowCampaignBuilder, props.setActiveCampaign, props.activeDraftCampaign?.id, forceFetchContacts]);

  return {
    forceFetchContacts,
    handleRefreshContacts,
    handleAddToQueue,
    handleRemoveFromQueue,
    handleDeleteAllContacts,
    handleGenerateVariants,
    handleRegenerateWithFeedback,
    handleToggleContact,
    handleVariantChange,
    handleSelectVariant,
    handleBackToVariants,
  };
}
