// Campaign Builder - Main Entry Point
// Refactored into microarchitecture

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest, ApiError } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { contactFormSchema, type ContactFormValues, type CampaignBuilderProps, type CampaignContactWithContact } from "./types";
import { BuilderHeader, EmailPreviewCard, AddContactCard, BulkImportCard, ContactListCard, ScheduleDialog } from "./UIComponents";

export function CampaignBuilder({ campaignId, emailSubject, emailBody, onBack, onNavigateToLeadFinder }: CampaignBuilderProps) {
    const { toast } = useToast();
    const [showPreview, setShowPreview] = useState(false);
    const [bulkText, setBulkText] = useState("");
    const [showScheduleDialog, setShowScheduleDialog] = useState(false);
    const [scheduleTime, setScheduleTime] = useState("");
    const [selectedContactId, setSelectedContactId] = useState<number | null>(null);
    const [enableSpintax, setEnableSpintax] = useState(true);
    const [useOptimalTime, setUseOptimalTime] = useState(false);
    const [isCalculatingOptimalTimes, setIsCalculatingOptimalTimes] = useState(false);
    const [optimalTimeInfo, setOptimalTimeInfo] = useState<{ scheduledFor: string; reason: string } | null>(null);
    const [personalizedPreview, setPersonalizedPreview] = useState<{ subject: string; body: string } | null>(null);
    const [isPersonalizing, setIsPersonalizing] = useState(false);

    const form = useForm<ContactFormValues>({ resolver: zodResolver(contactFormSchema), defaultValues: { name: "", email: "", company: "", pronoun: "Mr." } });

    const { data: campaignContacts = [], isLoading } = useQuery<CampaignContactWithContact[]>({ queryKey: ['/api/campaigns', campaignId, 'contacts'], refetchOnWindowFocus: true });

    // Add contact mutation
    const addContactMutation = useMutation({
        mutationFn: async (data: ContactFormValues) => apiRequest("POST", `/api/campaigns/${campaignId}/contacts`, data),
        onSuccess: (data: any) => { queryClient.invalidateQueries({ queryKey: ['/api/campaigns', campaignId, 'contacts'] }); form.reset(); toast({ title: "Contact added", description: data.removedOldest ? "Contact added (oldest removed)" : "Contact has been added" }); },
        onError: (error: Error) => { toast({ title: "Error adding contact", description: error.message, variant: "destructive" }); },
    });

    // Remove contact mutation
    const removeContactMutation = useMutation({
        mutationFn: async (id: number) => apiRequest("DELETE", `/api/campaigns/${campaignId}/contacts/${id}`),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['/api/campaigns', campaignId, 'contacts'] }); toast({ title: "Contact removed" }); },
        onError: (error: Error) => { toast({ title: "Error removing contact", description: error.message, variant: "destructive" }); },
    });

    // Clear all contacts mutation
    const clearAllContactsMutation = useMutation({
        mutationFn: async () => apiRequest("DELETE", `/api/campaigns/${campaignId}/contacts/all`),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['/api/campaigns', campaignId, 'contacts'] }); toast({ title: "All contacts cleared" }); },
        onError: (error: Error) => { toast({ title: "Error clearing contacts", description: error.message, variant: "destructive" }); },
    });

    // Bulk import mutation
    const bulkImportMutation = useMutation({
        mutationFn: async (text: string) => apiRequest("POST", "/api/contacts/parse-bulk", { bulkText: text, campaignId }),
        onSuccess: (data) => { queryClient.invalidateQueries({ queryKey: ['/api/campaigns', campaignId, 'contacts'] }); setBulkText(""); toast({ title: "Contacts imported!", description: `Added ${data.created || 0} contacts` }); },
        onError: (error: Error) => { toast({ title: "Import failed", description: error.message, variant: "destructive" }); },
    });

    // Send campaign mutation
    const sendCampaignMutation = useMutation({
        mutationFn: async () => apiRequest<{ success: boolean; sent: number; failed: number; partialSuccess?: boolean }>("POST", `/api/campaigns/${campaignId}/send`),
        onSuccess: (data) => { toast({ title: data.partialSuccess ? "Campaign partially sent" : "Campaign sent!", description: `Sent ${data.sent} emails` }); queryClient.invalidateQueries({ queryKey: ["/api/sent"] }); onBack(); },
        onError: (error: Error | ApiError) => {
            let description = error.message;
            if (error instanceof ApiError && error.data?.errors?.[0]?.error) description = error.data.errors[0].error;
            toast({ title: "Failed to send", description, variant: "destructive" });
        },
    });

    // Schedule campaign mutation
    const scheduleCampaignMutation = useMutation({
        mutationFn: async (params: { sendTime: string; enableSpintax: boolean }) => apiRequest("POST", `/api/campaigns/${campaignId}/schedule`, params),
        onSuccess: () => { setShowScheduleDialog(false); setScheduleTime(""); toast({ title: "Campaign scheduled!" }); onBack(); },
        onError: (error: Error) => { toast({ title: "Error scheduling", description: error.message, variant: "destructive" }); },
    });

    // Smart schedule mutation
    const smartScheduleMutation = useMutation({
        mutationFn: async (params: { enableSpintax: boolean }) => {
            const contactIds = campaignContacts.map(cc => cc.contact.id);
            return apiRequest("POST", "/api/spintax/schedule-batch", { contactIds, campaignId, subject: emailSubject, body: emailBody, enableSpintax: params.enableSpintax });
        },
        onSuccess: (data: any) => { setShowScheduleDialog(false); toast({ title: "Smart campaign scheduled!", description: `${data.scheduled} emails scheduled` }); onBack(); },
        onError: (error: Error) => { toast({ title: "Error scheduling", description: error.message, variant: "destructive" }); },
    });

    // Calculate optimal times
    const calculateOptimalTimes = async () => {
        if (campaignContacts.length === 0) return;
        setIsCalculatingOptimalTimes(true);
        try {
            const contactIds = campaignContacts.map(cc => cc.contact.id);
            const result = await apiRequest<any>("POST", "/api/spintax/optimal-send-times-batch", { contactIds });
            const firstTime = Object.values(result.optimalTimes)[0] as any;
            if (firstTime) setOptimalTimeInfo({ scheduledFor: new Date(firstTime.scheduledFor).toLocaleString(), reason: firstTime.reason });
        } catch (error) { console.error("Error calculating optimal times:", error); }
        finally { setIsCalculatingOptimalTimes(false); }
    };

    // Handle contact selection for preview
    const handleSelectContact = async (contactId: number) => {
        if (selectedContactId === contactId) { setSelectedContactId(null); setPersonalizedPreview(null); return; }
        setSelectedContactId(contactId);
        setIsPersonalizing(true);
        try {
            const result = await apiRequest("POST", `/api/campaigns/${campaignId}/personalize`, { contactId, variant: { subject: emailSubject, body: emailBody, approach: "Selected" } });
            setPersonalizedPreview(result);
        } catch (error) { toast({ title: "Error", description: "Failed to generate preview", variant: "destructive" }); }
        finally { setIsPersonalizing(false); }
    };

    const onSubmit = (data: ContactFormValues) => addContactMutation.mutate(data);

    return (
        <div className="h-full flex flex-col">
            <BuilderHeader onBack={onBack} onTogglePreview={() => setShowPreview(!showPreview)} showPreview={showPreview} />
            <div className="flex-1 overflow-auto">
                <div className="max-w-4xl mx-auto p-6 space-y-6">
                    <EmailPreviewCard showPreview={showPreview} selectedContactId={selectedContactId} campaignContacts={campaignContacts} isPersonalizing={isPersonalizing} personalizedPreview={personalizedPreview} emailSubject={emailSubject} emailBody={emailBody} />
                    <AddContactCard form={form} onSubmit={onSubmit} isPending={addContactMutation.isPending} />
                    <BulkImportCard bulkText={bulkText} setBulkText={setBulkText} onImport={() => bulkImportMutation.mutate(bulkText)} isPending={bulkImportMutation.isPending} />
                    <ContactListCard campaignContacts={campaignContacts} isLoading={isLoading} selectedContactId={selectedContactId} showPreview={showPreview} onSelectContact={handleSelectContact} onRemoveContact={(id) => removeContactMutation.mutate(id)} onClearAll={() => clearAllContactsMutation.mutate()} onNavigateToLeadFinder={onNavigateToLeadFinder} onSchedule={() => setShowScheduleDialog(true)} onSend={() => sendCampaignMutation.mutate()} removeIsPending={removeContactMutation.isPending} clearIsPending={clearAllContactsMutation.isPending} sendIsPending={sendCampaignMutation.isPending} scheduleIsPending={scheduleCampaignMutation.isPending} />
                </div>
            </div>
            <ScheduleDialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog} enableSpintax={enableSpintax} setEnableSpintax={setEnableSpintax} useOptimalTime={useOptimalTime} setUseOptimalTime={setUseOptimalTime} scheduleTime={scheduleTime} setScheduleTime={setScheduleTime} optimalTimeInfo={optimalTimeInfo} isCalculatingOptimalTimes={isCalculatingOptimalTimes} onCalculateOptimalTimes={calculateOptimalTimes} onSmartSchedule={() => smartScheduleMutation.mutate({ enableSpintax })} onManualSchedule={() => scheduleCampaignMutation.mutate({ sendTime: scheduleTime, enableSpintax })} smartScheduleIsPending={smartScheduleMutation.isPending} scheduleIsPending={scheduleCampaignMutation.isPending} />
        </div>
    );
}
