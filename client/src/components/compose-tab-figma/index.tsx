// Compose Tab Figma - Main Entry Point
// Refactored into microarchitecture

import { useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import ContactProfileView from "../contact-profile-view";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ComposeFormSection } from "./ComposeFormSection";
import { VariantsSection } from "./VariantsSection";
import type { EmailVariant, NewContactForm, WritingStyle, Contact } from "./types";

const PAGE_SIZE = 50;

export default function ComposeTabFigma() {
    const { toast } = useToast();
    const [baseMessage, setBaseMessage] = useState("");
    const [writingStyle, setWritingStyle] = useState<WritingStyle>('professional-adult');
    const [variants, setVariants] = useState<EmailVariant[]>([]);
    const [selectedVariantIndex, setSelectedVariantIndex] = useState<number | null>(null);
    const [selectedContactIds, setSelectedContactIds] = useState<Set<number>>(new Set());
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [feedback, setFeedback] = useState("");
    const [isRegenerating, setIsRegenerating] = useState(false);
    const [selectedProfileContact, setSelectedProfileContact] = useState<Contact | null>(null);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [newContact, setNewContact] = useState<NewContactForm>({ name: "", email: "", company: "", position: "", phone: "", notes: "", pronoun: "Mr." });

    const { data: contactsData, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading: isLoadingContacts, refetch: refetchContacts } = useInfiniteQuery<Contact[]>({
        queryKey: ['/api/contacts/all', 'infinite'],
        queryFn: async ({ pageParam = 0 }) => {
            const response = await fetch(`/api/contacts/all?limit=${PAGE_SIZE}&offset=${pageParam}`, { credentials: 'include' });
            if (!response.ok) throw new Error('Failed to fetch contacts');
            return response.json();
        },
        getNextPageParam: (lastPage, allPages) => lastPage.length < PAGE_SIZE ? undefined : allPages.length * PAGE_SIZE,
        initialPageParam: 0,
    });

    const availableContacts = contactsData?.pages.flat() || [];

    const handleLoadMoreContacts = () => { if (hasNextPage && !isFetchingNextPage) fetchNextPage(); };

    const handleAddToQueue = async () => {
        if (!newContact.name || !newContact.email || !newContact.company) { toast({ title: "Missing Information", description: "Please fill in name, email, and company fields.", variant: "destructive" }); return; }
        try {
            const contact = await apiRequest<Contact>("POST", "/api/contacts/add", newContact);
            await queryClient.removeQueries({ queryKey: ['/api/contacts/all', 'infinite'], exact: true });
            await refetchContacts();
            setSelectedContactIds(prev => new Set(prev).add(contact.id));
            toast({ title: "Contact Added", description: `${contact.name} has been added and selected.` });
            setNewContact({ name: "", email: "", company: "", position: "", phone: "", notes: "", pronoun: "Mr." });
        } catch (error: any) {
            const errorMessage = error instanceof Error ? error.message : error?.error || error?.message || "Failed to add contact.";
            toast({ title: "Error", description: errorMessage, variant: "destructive" });
        }
    };

    const handleGenerateVariants = async () => {
        if (!baseMessage) { toast({ title: "Missing Message", description: "Please enter a base message.", variant: "destructive" }); return; }
        setIsGenerating(true);
        try {
            const result = await apiRequest<{ variants: EmailVariant[] }>("POST", "/api/emails/generate", { baseMessage, writingStyle });
            setVariants(result.variants);
            setSelectedVariantIndex(null);
            toast({ title: "Variants Generated", description: `3 email variants generated successfully!` });
        } catch (error) {
            toast({ title: "Error", description: "Failed to generate email variants.", variant: "destructive" });
        } finally { setIsGenerating(false); }
    };

    const handleRegenerateWithFeedback = async () => {
        if (!feedback.trim()) { toast({ title: "Missing Feedback", description: "Please provide feedback for improvements.", variant: "destructive" }); return; }
        setIsRegenerating(true);
        try {
            const result = await apiRequest<{ variants: EmailVariant[] }>("POST", "/api/emails/regenerate", { baseMessage, writingStyle, currentVariants: variants, feedback });
            setVariants(result.variants);
            setSelectedVariantIndex(null);
            setFeedback("");
            toast({ title: "Variants Regenerated", description: `3 new email variants generated with your feedback!` });
        } catch (error) {
            toast({ title: "Error", description: "Failed to regenerate email variants.", variant: "destructive" });
        } finally { setIsRegenerating(false); }
    };

    const handleToggleContact = (id: number) => { setSelectedContactIds(prev => { const newSet = new Set(prev); if (newSet.has(id)) newSet.delete(id); else newSet.add(id); return newSet; }); };

    const handleSendToSelected = async () => {
        if (selectedVariantIndex === null) { toast({ title: "No Variant Selected", description: "Please select an email variant first.", variant: "destructive" }); return; }
        if (selectedContactIds.size === 0) { toast({ title: "No Contacts Selected", description: "Please select at least one contact.", variant: "destructive" }); return; }
        setIsSending(true);
        try {
            const result = await apiRequest<{ results: Array<{ contactId: number; success: boolean; error?: string }> }>("POST", "/api/emails/send-to-selected", { selectedVariant: variants[selectedVariantIndex], contactIds: Array.from(selectedContactIds) });
            const successCount = result.results.filter(r => r.success).length;
            const failCount = result.results.filter(r => !r.success).length;
            if (successCount > 0) { queryClient.invalidateQueries({ queryKey: ['/api/emails/sent'] }); queryClient.invalidateQueries({ queryKey: ['/api/contacts/all'] }); }
            if (failCount === 0) { toast({ title: "Emails Sent Successfully", description: `${successCount} email${successCount !== 1 ? 's' : ''} sent successfully!` }); setSelectedContactIds(new Set()); setVariants([]); setSelectedVariantIndex(null); setBaseMessage(""); }
            else toast({ title: "Partial Success", description: `${successCount} sent, ${failCount} failed. Check Sent Emails tab for details.`, variant: "destructive" });
        } catch (error) {
            toast({ title: "Error", description: "Failed to send emails. Please try again.", variant: "destructive" });
        } finally { setIsSending(false); }
    };

    const handleVariantChange = (index: number, updated: EmailVariant) => { setVariants(prev => { const newVariants = [...prev]; newVariants[index] = updated; return newVariants; }); };

    return (
        <div className="min-h-full">
            <main className="mx-auto max-w-7xl px-6 py-12">
                {variants.length === 0 && (
                    <ComposeFormSection baseMessage={baseMessage} setBaseMessage={setBaseMessage} writingStyle={writingStyle} setWritingStyle={setWritingStyle} isGenerating={isGenerating} onGenerateVariants={handleGenerateVariants} />
                )}
                {variants.length > 0 && (
                    <VariantsSection variants={variants} selectedVariantIndex={selectedVariantIndex} feedback={feedback} setFeedback={setFeedback} isRegenerating={isRegenerating} onSelectVariant={setSelectedVariantIndex} onVariantChange={handleVariantChange} onRegenerateWithFeedback={handleRegenerateWithFeedback} selectedContactIds={selectedContactIds} newContact={newContact} setNewContact={setNewContact} onAddToQueue={handleAddToQueue} availableContacts={availableContacts} isLoadingContacts={isLoadingContacts} hasNextPage={hasNextPage || false} isFetchingNextPage={isFetchingNextPage} onLoadMoreContacts={handleLoadMoreContacts} onToggleContact={handleToggleContact} isSending={isSending} onSendToSelected={handleSendToSelected} />
                )}
            </main>
            <ContactProfileView contact={selectedProfileContact} open={isProfileOpen} onOpenChange={(open) => { setIsProfileOpen(open); if (!open) queryClient.invalidateQueries({ queryKey: ['/api/contacts/all'] }); }} />
        </div>
    );
}
