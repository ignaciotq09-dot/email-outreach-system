// Variants Section - UI for email variants and recipient selection

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, Plus, Send } from "lucide-react";
import EmailVariantCard from "../email-variant-card";
import ContactSelectorItem from "../contact-selector-item";
import SpamWarning from "../spam-warning";
import type { EmailVariant, NewContactForm, Contact } from "./types";

interface VariantsSectionProps {
    variants: EmailVariant[];
    selectedVariantIndex: number | null;
    feedback: string;
    setFeedback: (v: string) => void;
    isRegenerating: boolean;
    onSelectVariant: (index: number) => void;
    onVariantChange: (index: number, updated: EmailVariant) => void;
    onRegenerateWithFeedback: () => void;
    selectedContactIds: Set<number>;
    newContact: NewContactForm;
    setNewContact: (v: NewContactForm) => void;
    onAddToQueue: () => void;
    availableContacts: Contact[];
    isLoadingContacts: boolean;
    hasNextPage: boolean;
    isFetchingNextPage: boolean;
    onLoadMoreContacts: () => void;
    onToggleContact: (id: number) => void;
    isSending: boolean;
    onSendToSelected: () => void;
}

export function VariantsSection({ variants, selectedVariantIndex, feedback, setFeedback, isRegenerating, onSelectVariant, onVariantChange, onRegenerateWithFeedback, selectedContactIds, newContact, setNewContact, onAddToQueue, availableContacts, isLoadingContacts, hasNextPage, isFetchingNextPage, onLoadMoreContacts, onToggleContact, isSending, onSendToSelected }: VariantsSectionProps) {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-semibold mb-3">Step 2: Choose Your Favorite Email Variant</h2>
                <div className="space-y-4">
                    {variants.map((variant, index) => (
                        <EmailVariantCard key={index} variant={variant} index={index} isSelected={selectedVariantIndex === index} onSelect={() => onSelectVariant(index)} onChange={(updated) => onVariantChange(index, updated)} />
                    ))}
                </div>

                {/* Feedback Section */}
                <div className="mt-6 p-4 border border-border rounded-md bg-muted/30">
                    <Label className="text-sm font-medium">Not happy with these? Give feedback and regenerate</Label>
                    <Textarea value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="E.g., 'Make it more casual', 'Add more details about benefits', 'Shorter subject lines'..." className="mt-2 resize-none h-24" data-testid="textarea-feedback" />
                    <Button onClick={onRegenerateWithFeedback} disabled={isRegenerating || !feedback.trim()} className="mt-3" size="sm" variant="outline" data-testid="button-regenerate">
                        {isRegenerating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Regenerating...</> : "Regenerate with Feedback"}
                    </Button>
                </div>
            </div>

            {/* STEP 3: Select Recipients (Only shows after variant is selected) */}
            {selectedVariantIndex !== null && (
                <div className="space-y-6">
                    <div><h2 className="text-lg font-semibold mb-3">Step 3: Choose Recipients</h2><p className="text-sm text-muted-foreground mb-4">Add new contacts or select from your existing contacts below</p></div>

                    {/* Spam Warning */}
                    {variants[selectedVariantIndex] && <SpamWarning subject={variants[selectedVariantIndex].subject} body={variants[selectedVariantIndex].body} enabled={true} />}

                    {/* Add New Contact Form */}
                    <div className="p-6 border border-border rounded-lg bg-muted/20">
                        <h3 className="text-base font-semibold mb-4">Add New Contact</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div><Label htmlFor="name" className="text-sm">Name *</Label><Input id="name" value={newContact.name} onChange={(e) => setNewContact({ ...newContact, name: e.target.value })} placeholder="John Smith" className="mt-1" data-testid="input-contact-name" /></div>
                            <div><Label htmlFor="email" className="text-sm">Email *</Label><Input id="email" type="email" value={newContact.email} onChange={(e) => setNewContact({ ...newContact, email: e.target.value })} placeholder="john@company.com" className="mt-1" data-testid="input-contact-email" /></div>
                            <div><Label htmlFor="company" className="text-sm">Company *</Label><Input id="company" value={newContact.company} onChange={(e) => setNewContact({ ...newContact, company: e.target.value })} placeholder="ABC Corp" className="mt-1" data-testid="input-contact-company" /></div>
                            <div><Label htmlFor="position" className="text-sm">Position</Label><Input id="position" value={newContact.position} onChange={(e) => setNewContact({ ...newContact, position: e.target.value })} placeholder="CEO, Marketing Director, etc." className="mt-1" data-testid="input-contact-position" /></div>
                            <div>
                                <Label className="text-sm">Title</Label>
                                <RadioGroup value={newContact.pronoun} onValueChange={(value) => setNewContact({ ...newContact, pronoun: value })} className="flex gap-4 mt-2" data-testid="radio-pronoun">
                                    <div className="flex items-center space-x-2"><RadioGroupItem value="Mr." id="pronoun-mr" data-testid="radio-pronoun-mr" /><Label htmlFor="pronoun-mr" className="font-normal cursor-pointer">Mr.</Label></div>
                                    <div className="flex items-center space-x-2"><RadioGroupItem value="Ms." id="pronoun-ms" data-testid="radio-pronoun-ms" /><Label htmlFor="pronoun-ms" className="font-normal cursor-pointer">Ms.</Label></div>
                                </RadioGroup>
                            </div>
                            <div><Label htmlFor="phone" className="text-sm">Phone</Label><Input id="phone" value={newContact.phone} onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })} placeholder="555-0123" className="mt-1" data-testid="input-contact-phone" /></div>
                            <div className="col-span-2"><Label htmlFor="notes" className="text-sm">Notes</Label><Textarea id="notes" value={newContact.notes} onChange={(e) => setNewContact({ ...newContact, notes: e.target.value })} placeholder="Add any relevant information..." className="mt-1 resize-none h-20" data-testid="textarea-contact-notes" /></div>
                        </div>
                        <Button onClick={onAddToQueue} className="w-full mt-4" data-testid="button-add-to-queue"><Plus className="w-4 h-4 mr-2" />Add to Recipients</Button>
                    </div>

                    {/* Select from Existing Contacts */}
                    {isLoadingContacts ? (
                        <div className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" /><p className="text-sm text-muted-foreground mt-2">Loading contacts...</p></div>
                    ) : availableContacts.length > 0 ? (
                        <div>
                            <h3 className="text-base font-semibold mb-3">Select from Existing Contacts ({selectedContactIds.size} selected)</h3>
                            <div className="border border-border rounded-lg overflow-y-auto p-2 space-y-1" style={{ maxHeight: '400px' }} data-testid="contact-list">
                                {availableContacts.map((contact) => (<ContactSelectorItem key={contact.id} contact={contact} isSelected={selectedContactIds.has(contact.id)} onToggle={() => onToggleContact(contact.id)} />))}
                            </div>
                            {hasNextPage && (
                                <div className="flex justify-center mt-4">
                                    <Button onClick={onLoadMoreContacts} disabled={isFetchingNextPage} variant="outline" size="sm" data-testid="button-load-more-contacts">
                                        {isFetchingNextPage ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Loading...</> : `Load More (${availableContacts.length} shown)`}
                                    </Button>
                                </div>
                            )}
                        </div>
                    ) : null}

                    {/* Send Button */}
                    {selectedContactIds.size > 0 && (
                        <Button onClick={onSendToSelected} disabled={isSending} className="w-full" size="lg" data-testid="button-send-to-selected">
                            {isSending ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Sending to {selectedContactIds.size} contacts...</> : <><Send className="w-5 h-5 mr-2" />Send to {selectedContactIds.size} Selected Contact{selectedContactIds.size !== 1 ? 's' : ''}</>}
                        </Button>
                    )}
                </div>
            )}
        </div>
    );
}
