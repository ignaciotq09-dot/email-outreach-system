import { useState, useEffect } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, Plus, Send, Sparkles, Mail, Brain } from "lucide-react";
import ContactQueueChip from "./contact-queue-chip";
import ContactProfileView from "./contact-profile-view";
import EmailVariantCard from "./email-variant-card";
import ContactSelectorItem from "./contact-selector-item";
import SpamWarning from "./spam-warning";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Contact } from "@shared/schema";

interface EmailVariant {
  subject: string;
  body: string;
  approach: string;
}

export default function ComposeTabFigma() {
  const { toast } = useToast();
  const [baseMessage, setBaseMessage] = useState("");
  const [writingStyle, setWritingStyle] = useState<'professional-adult' | 'professional-humble'>('professional-adult');
  const [variants, setVariants] = useState<EmailVariant[]>([]);
  const [selectedVariantIndex, setSelectedVariantIndex] = useState<number | null>(null);
  const [selectedContactIds, setSelectedContactIds] = useState<Set<number>>(new Set());
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [selectedProfileContact, setSelectedProfileContact] = useState<Contact | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const PAGE_SIZE = 50;

  // Form state for new contact
  const [newContact, setNewContact] = useState({
    name: "",
    email: "",
    company: "",
    position: "",
    phone: "",
    notes: "",
    pronoun: "Mr.",
  });

  // Load contacts with pagination
  const {
    data: contactsData,
    fetchNextPage,
    hasNextPage,
    isFetching: isFetchingContacts,
    isFetchingNextPage,
    isLoading: isLoadingContacts,
    refetch: refetchContacts,
  } = useInfiniteQuery<Contact[]>({
    queryKey: ['/api/contacts/all', 'infinite'],
    queryFn: async ({ pageParam = 0 }) => {
      const response = await fetch(
        `/api/contacts/all?limit=${PAGE_SIZE}&offset=${pageParam}`,
        { credentials: 'include' }
      );
      if (!response.ok) throw new Error('Failed to fetch contacts');
      return response.json();
    },
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < PAGE_SIZE) return undefined;
      return allPages.length * PAGE_SIZE;
    },
    initialPageParam: 0,
  });

  // Combine all loaded pages into available contacts
  const availableContacts = contactsData?.pages.flat() || [];

  const handleLoadMoreContacts = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  const handleAddToQueue = async () => {
    if (!newContact.name || !newContact.email || !newContact.company) {
      toast({
        title: "Missing Information",
        description: "Please fill in name, email, and company fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      const contact = await apiRequest<Contact>("POST", "/api/contacts/add", newContact);
      
      // Reset pagination to page 0 to include new contact at top
      // Remove all cached pages first
      await queryClient.removeQueries({
        queryKey: ['/api/contacts/all', 'infinite'],
        exact: true,
      });
      
      // Refetch from page 0
      await refetchContacts();
      
      // Auto-select the newly added contact
      setSelectedContactIds(prev => new Set(prev).add(contact.id));
      
      toast({
        title: "Contact Added",
        description: `${contact.name} has been added and selected.`,
      });
      
      setNewContact({ name: "", email: "", company: "", position: "", phone: "", notes: "", pronoun: "Mr." });
    } catch (error: any) {
      console.error("Error adding contact:", error);
      // Backend handles duplicate detection and returns appropriate error message
      const errorMessage = error instanceof Error 
        ? error.message 
        : error?.error || error?.message || "Failed to add contact.";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleRemoveFromQueue = (id: number) => {
    // Just deselect the contact, don't remove from available contacts
    setSelectedContactIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
  };

  const handleGenerateVariants = async () => {
    if (!baseMessage) {
      toast({
        title: "Missing Message",
        description: "Please enter a base message.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      const result = await apiRequest<{ variants: EmailVariant[] }>(
        "POST",
        "/api/emails/generate",
        { baseMessage, writingStyle }
      );
      
      setVariants(result.variants);
      setSelectedVariantIndex(null);
      
      toast({
        title: "Variants Generated",
        description: `3 email variants generated successfully!`,
      });
    } catch (error) {
      console.error("Error generating variants:", error);
      toast({
        title: "Error",
        description: "Failed to generate email variants.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerateWithFeedback = async () => {
    if (!feedback.trim()) {
      toast({
        title: "Missing Feedback",
        description: "Please provide feedback for improvements.",
        variant: "destructive",
      });
      return;
    }

    setIsRegenerating(true);
    
    try {
      const result = await apiRequest<{ variants: EmailVariant[] }>(
        "POST",
        "/api/emails/regenerate",
        {
          baseMessage,
          writingStyle,
          currentVariants: variants,
          feedback
        }
      );
      
      setVariants(result.variants);
      setSelectedVariantIndex(null);
      setFeedback("");
      
      toast({
        title: "Variants Regenerated",
        description: `3 new email variants generated with your feedback!`,
      });
    } catch (error) {
      console.error("Error regenerating variants:", error);
      toast({
        title: "Error",
        description: "Failed to regenerate email variants.",
        variant: "destructive",
      });
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleToggleContact = (id: number) => {
    setSelectedContactIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleSendToSelected = async () => {
    if (selectedVariantIndex === null) {
      toast({
        title: "No Variant Selected",
        description: "Please select an email variant first.",
        variant: "destructive",
      });
      return;
    }

    if (selectedContactIds.size === 0) {
      toast({
        title: "No Contacts Selected",
        description: "Please select at least one contact.",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);
    
    try {
      const selectedVariant = variants[selectedVariantIndex];
      
      const result = await apiRequest<{ 
        results: Array<{ contactId: number; success: boolean; error?: string }>;
      }>(
        "POST",
        "/api/emails/send-to-selected",
        {
          selectedVariant,
          contactIds: Array.from(selectedContactIds)
        }
      );
      
      const successCount = result.results.filter(r => r.success).length;
      const failCount = result.results.filter(r => !r.success).length;
      
      // Invalidate cache to refresh sent emails tab
      if (successCount > 0) {
        queryClient.invalidateQueries({ queryKey: ['/api/emails/sent'] });
        queryClient.invalidateQueries({ queryKey: ['/api/contacts/all'] });
      }
      
      if (failCount === 0) {
        toast({
          title: "Emails Sent Successfully",
          description: `${successCount} email${successCount !== 1 ? 's' : ''} sent successfully!`,
        });
        
        setSelectedContactIds(new Set());
        setVariants([]);
        setSelectedVariantIndex(null);
        setBaseMessage("");
      } else {
        toast({
          title: "Partial Success",
          description: `${successCount} sent, ${failCount} failed. Check Sent Emails tab for details.`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error sending emails:", error);
      toast({
        title: "Error",
        description: "Failed to send emails. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleVariantChange = (index: number, updated: EmailVariant) => {
    setVariants(prev => {
      const newVariants = [...prev];
      newVariants[index] = updated;
      return newVariants;
    });
  };

  const handleSelectVariant = (index: number) => {
    setSelectedVariantIndex(index);
  };

  return (
    <div className="min-h-full">
      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-6 py-12">
        {/* If no variants, show the compose form */}
        {variants.length === 0 && (
          <>
            <div className="mb-10 text-center">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-purple-100 px-4 py-2">
                <div className="h-2 w-2 rounded-full bg-purple-600"></div>
                <span className="text-sm text-purple-900">AI-powered email generation</span>
              </div>
              <h1 className="mb-3 text-gray-900 dark:text-gray-100">Compose Your Message</h1>
              <p className="text-gray-600 dark:text-gray-400">Write your base message and let AI create 3 personalized variants</p>
            </div>

            {/* Layout */}
            <div className="grid grid-cols-12 gap-6">
              {/* Main Compose Area */}
              <div className="col-span-8">
                <div className="rounded-2xl border border-purple-100 dark:border-purple-900 bg-white dark:bg-gray-900 p-8 shadow-sm">
                  <Label htmlFor="base-message" className="mb-4 flex items-center gap-3 text-gray-900 dark:text-gray-100">
                    <div className="rounded-lg bg-purple-600 p-2">
                      <Mail className="h-5 w-5 text-white" />
                    </div>
                    <span>Your Base Message</span>
                  </Label>
                  <Textarea
                    id="base-message"
                    placeholder="Start typing your message... AI will transform it into 3 unique variants."
                    className="min-h-[360px] resize-none rounded-xl border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-500"
                    value={baseMessage}
                    onChange={(e) => setBaseMessage(e.target.value)}
                    data-testid="textarea-base-message"
                  />
                </div>
              </div>

              {/* Sidebar */}
              <div className="col-span-4">
                {/* Writing Style Card */}
                <div className="rounded-2xl border border-purple-100 dark:border-purple-900 bg-white dark:bg-gray-900 p-6 shadow-sm">
                  <div className="mb-5 flex items-center gap-3">
                    <div className="rounded-lg bg-violet-600 p-2">
                      <Brain className="h-5 w-5 text-white" />
                    </div>
                    <Label className="text-gray-900 dark:text-gray-100">Writing Style</Label>
                  </div>
                  
                  <RadioGroup value={writingStyle} onValueChange={(value) => setWritingStyle(value as 'professional-adult' | 'professional-humble')} className="space-y-3" data-testid="radio-writing-style">
                    <div className="cursor-pointer rounded-xl border-2 border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950 p-4 transition-colors hover:border-purple-400 dark:hover:border-purple-600">
                      <div className="flex items-start gap-3">
                        <RadioGroupItem value="professional-adult" id="professional-adult" className="mt-1" data-testid="radio-professional-adult" />
                        <div className="flex-1">
                          <Label htmlFor="professional-adult" className="cursor-pointer text-gray-900 dark:text-gray-100">
                            Professional & Direct
                          </Label>
                          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Confident, assumes expertise</p>
                        </div>
                      </div>
                    </div>

                    <div className="cursor-pointer rounded-xl border-2 border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950 p-4 transition-colors hover:border-purple-400 dark:hover:border-purple-600">
                      <div className="flex items-start gap-3">
                        <RadioGroupItem value="professional-humble" id="professional-humble" className="mt-1" data-testid="radio-professional-humble" />
                        <div className="flex-1">
                          <Label htmlFor="professional-humble" className="cursor-pointer text-gray-900 dark:text-gray-100">
                            Professional & Humble
                          </Label>
                          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Curious, asks questions</p>
                        </div>
                      </div>
                    </div>
                  </RadioGroup>
                </div>
              </div>
            </div>

            {/* Generate Button */}
            <div className="mt-10 text-center">
              <Button
                onClick={handleGenerateVariants}
                disabled={isGenerating || !baseMessage}
                className="rounded-xl bg-gradient-to-r from-purple-600 to-violet-600 px-10 py-6 shadow-lg shadow-purple-300 dark:shadow-purple-900 hover:shadow-xl hover:shadow-purple-400 dark:hover:shadow-purple-800"
                data-testid="button-generate-variants"
              >
                <span className="flex items-center gap-2 text-white">
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-5 w-5" />
                      <span>Generate 3 Email Variants</span>
                    </>
                  )}
                </span>
              </Button>
              
              <div className="mt-6 flex items-center justify-center gap-8 text-sm">
                <div className="flex items-center gap-2">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                    <div className="h-2 w-2 rounded-full bg-green-600"></div>
                  </div>
                  <span className="text-gray-700 dark:text-gray-300">Takes ~30 seconds</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900">
                    <div className="h-2 w-2 rounded-full bg-purple-600"></div>
                  </div>
                  <span className="text-gray-700 dark:text-gray-300">Unique to your voice</span>
                </div>
              </div>
            </div>
          </>
        )}

        {/* STEP 2: Email Variants */}
        {variants.length > 0 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold mb-3">
                Step 2: Choose Your Favorite Email Variant
              </h2>
              <div className="space-y-4">
                {variants.map((variant, index) => (
                  <EmailVariantCard
                    key={index}
                    variant={variant}
                    index={index}
                    isSelected={selectedVariantIndex === index}
                    onSelect={() => handleSelectVariant(index)}
                    onChange={(updated) => handleVariantChange(index, updated)}
                  />
                ))}
              </div>

              {/* Feedback Section */}
              <div className="mt-6 p-4 border border-border rounded-md bg-muted/30">
                <Label className="text-sm font-medium">Not happy with these? Give feedback and regenerate</Label>
                <Textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="E.g., 'Make it more casual', 'Add more details about benefits', 'Shorter subject lines'..."
                  className="mt-2 resize-none h-24"
                  data-testid="textarea-feedback"
                />
                <Button
                  onClick={handleRegenerateWithFeedback}
                  disabled={isRegenerating || !feedback.trim()}
                  className="mt-3"
                  size="sm"
                  variant="outline"
                  data-testid="button-regenerate"
                >
                  {isRegenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Regenerating...
                    </>
                  ) : (
                    "Regenerate with Feedback"
                  )}
                </Button>
              </div>
            </div>

            {/* STEP 3: Select Recipients (Only shows after variant is selected) */}
            {selectedVariantIndex !== null && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold mb-3">
                    Step 3: Choose Recipients
                  </h2>
                  <p className="text-sm text-muted-foreground mb-4">
                    Add new contacts or select from your existing contacts below
                  </p>
                </div>

                {/* Spam Warning - Show deliverability check */}
                {variants[selectedVariantIndex] && (
                  <SpamWarning
                    subject={variants[selectedVariantIndex].subject}
                    body={variants[selectedVariantIndex].body}
                    enabled={true}
                  />
                )}

                {/* Add New Contact Form */}
                <div className="p-6 border border-border rounded-lg bg-muted/20">
                  <h3 className="text-base font-semibold mb-4">Add New Contact</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name" className="text-sm">Name *</Label>
                      <Input
                        id="name"
                        value={newContact.name}
                        onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                        placeholder="John Smith"
                        className="mt-1"
                        data-testid="input-contact-name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email" className="text-sm">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={newContact.email}
                        onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                        placeholder="john@company.com"
                        className="mt-1"
                        data-testid="input-contact-email"
                      />
                    </div>
                    <div>
                      <Label htmlFor="company" className="text-sm">Company *</Label>
                      <Input
                        id="company"
                        value={newContact.company}
                        onChange={(e) => setNewContact({ ...newContact, company: e.target.value })}
                        placeholder="ABC Corp"
                        className="mt-1"
                        data-testid="input-contact-company"
                      />
                    </div>
                    <div>
                      <Label htmlFor="position" className="text-sm">Position</Label>
                      <Input
                        id="position"
                        value={newContact.position}
                        onChange={(e) => setNewContact({ ...newContact, position: e.target.value })}
                        placeholder="CEO, Marketing Director, etc."
                        className="mt-1"
                        data-testid="input-contact-position"
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Title</Label>
                      <RadioGroup 
                        value={newContact.pronoun} 
                        onValueChange={(value) => setNewContact({ ...newContact, pronoun: value })}
                        className="flex gap-4 mt-2"
                        data-testid="radio-pronoun"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="Mr." id="pronoun-mr" data-testid="radio-pronoun-mr" />
                          <Label htmlFor="pronoun-mr" className="font-normal cursor-pointer">Mr.</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="Ms." id="pronoun-ms" data-testid="radio-pronoun-ms" />
                          <Label htmlFor="pronoun-ms" className="font-normal cursor-pointer">Ms.</Label>
                        </div>
                      </RadioGroup>
                    </div>
                    <div>
                      <Label htmlFor="phone" className="text-sm">Phone</Label>
                      <Input
                        id="phone"
                        value={newContact.phone}
                        onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                        placeholder="555-0123"
                        className="mt-1"
                        data-testid="input-contact-phone"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label htmlFor="notes" className="text-sm">Notes</Label>
                      <Textarea
                        id="notes"
                        value={newContact.notes}
                        onChange={(e) => setNewContact({ ...newContact, notes: e.target.value })}
                        placeholder="Add any relevant information..."
                        className="mt-1 resize-none h-20"
                        data-testid="textarea-contact-notes"
                      />
                    </div>
                  </div>
                  
                  <Button 
                    onClick={handleAddToQueue}
                    className="w-full mt-4"
                    data-testid="button-add-to-queue"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add to Recipients
                  </Button>
                </div>

                {/* Select from Existing Contacts */}
                {isLoadingContacts ? (
                  <div className="text-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mt-2">Loading contacts...</p>
                  </div>
                ) : availableContacts.length > 0 ? (
                  <div>
                    <h3 className="text-base font-semibold mb-3">
                      Select from Existing Contacts ({selectedContactIds.size} selected)
                    </h3>
                    
                    {/* Contact List */}
                    <div
                      className="border border-border rounded-lg overflow-y-auto p-2 space-y-1"
                      style={{ maxHeight: '400px' }}
                      data-testid="contact-list"
                    >
                      {availableContacts.map((contact, index) => (
                        <ContactSelectorItem
                          key={contact.id}
                          contact={contact}
                          isSelected={selectedContactIds.has(contact.id)}
                          onToggle={() => handleToggleContact(contact.id)}
                        />
                      ))}
                    </div>
                    
                    {/* Load More Button */}
                    {hasNextPage && (
                      <div className="flex justify-center mt-4">
                        <Button
                          onClick={handleLoadMoreContacts}
                          disabled={isFetchingNextPage}
                          variant="outline"
                          size="sm"
                          data-testid="button-load-more-contacts"
                        >
                          {isFetchingNextPage ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Loading...
                            </>
                          ) : (
                            `Load More (${availableContacts.length} shown)`
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                ) : null}

                {/* Send Button */}
                {selectedContactIds.size > 0 && (
                  <Button
                    onClick={handleSendToSelected}
                    disabled={isSending}
                    className="w-full"
                    size="lg"
                    data-testid="button-send-to-selected"
                  >
                    {isSending ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Sending to {selectedContactIds.size} contacts...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5 mr-2" />
                        Send to {selectedContactIds.size} Selected Contact{selectedContactIds.size !== 1 ? 's' : ''}
                      </>
                    )}
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Contact Profile View Dialog */}
      <ContactProfileView
        contact={selectedProfileContact}
        open={isProfileOpen}
        onOpenChange={(open) => {
          setIsProfileOpen(open);
          if (!open) {
            queryClient.invalidateQueries({ queryKey: ['/api/contacts/all'] });
          }
        }}
      />
    </div>
  );
}
