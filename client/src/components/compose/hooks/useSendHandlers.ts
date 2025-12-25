import { useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Campaign } from "@shared/schema";
import type { EmailVariant, ChannelValidation, CampaignContactWithContact } from "../types";

interface UseSendHandlersProps {
  activeDraftCampaign: Campaign | undefined;
  variants: EmailVariant[];
  selectedVariantIndex: number | null;
  selectedContactIds: Set<number>;
  channelValidation: ChannelValidation;
  smsMessage: string;
  writingStyle: string;
  setSelectedContactIds: (s: Set<number> | ((p: Set<number>) => Set<number>)) => void;
  setIsSending: (b: boolean) => void;
  resetComposeState: () => void;
  forceFetchContacts: (campaignId: number) => Promise<CampaignContactWithContact[]>;
}

export function useSendHandlers(props: UseSendHandlersProps) {
  const { toast } = useToast();

  const handleSendToSelected = useCallback(async () => {
    const { includesEmail, includesSms } = props.channelValidation;

    if (includesEmail && props.selectedVariantIndex === null) {
      toast({ title: "No Variant Selected", description: "Please select an email variant.", variant: "destructive" });
      return;
    }
    if (includesSms && !props.smsMessage.trim()) {
      toast({ title: "SMS Message Required", description: "Please enter an SMS message.", variant: "destructive" });
      return;
    }
    if (props.selectedContactIds.size === 0) {
      toast({ title: "No Contacts Selected", description: "Please select at least one contact.", variant: "destructive" });
      return;
    }

    props.setIsSending(true);
    try {
      const selectedVariant = props.selectedVariantIndex !== null ? props.variants[props.selectedVariantIndex] : null;
      const contactIds = Array.from(props.selectedContactIds);
      const promises: Promise<{ results: Array<{ contactId: number; success: boolean; error?: string }> }>[] = [];

      if (includesEmail && selectedVariant) {
        promises.push(apiRequest("POST", "/api/emails/send-to-selected", { selectedVariant, contactIds }));
      }
      if (includesSms) {
        promises.push(apiRequest("POST", "/api/sms/send-bulk", { message: props.smsMessage, contactIds, writingStyle: props.writingStyle }));
      }

      const results = await Promise.all(promises);
      let successCount = 0, failCount = 0;

      if (results.length > 1) {
        const resultMaps = results.map(r => new Map(r.results.map(res => [res.contactId, res.success])));
        contactIds.forEach(id => {
          if (resultMaps.some(map => map.get(id) ?? false)) successCount++;
          else failCount++;
        });
      } else if (results.length === 1) {
        successCount = results[0].results.filter(r => r.success).length;
        failCount = results[0].results.filter(r => !r.success).length;
      }

      if (successCount > 0 && props.activeDraftCampaign?.id) {
        const resultMaps = results.map(r => new Map(r.results.map(res => [res.contactId, res.success])));
        const successfulContactIds = results.length > 1
          ? contactIds.filter(id => resultMaps.some(map => map.get(id) ?? false))
          : results[0].results.filter(r => r.success).map(r => r.contactId);

        await Promise.all(successfulContactIds.map(contactId =>
          apiRequest("DELETE", `/api/campaigns/${props.activeDraftCampaign!.id}/contacts/by-contact/${contactId}`).catch(() => { })
        ));

        props.setSelectedContactIds(prev => {
          const n = new Set(prev);
          successfulContactIds.forEach(id => n.delete(id));
          return n;
        });

        queryClient.invalidateQueries({ queryKey: ['/api/emails/sent'] });
        await props.forceFetchContacts(props.activeDraftCampaign.id);
      }

      if (failCount === 0) {
        toast({ title: "Messages Sent", description: `${successCount} sent successfully!` });
        props.resetComposeState();
      } else {
        toast({ title: "Partial Success", description: `${successCount} sent, ${failCount} failed.`, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to send messages.", variant: "destructive" });
    } finally {
      props.setIsSending(false);
    }
  }, [props, toast]);

  return { handleSendToSelected };
}
