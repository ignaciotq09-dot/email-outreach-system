// UI Components for Campaign Builder

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, UserPlus, X, Send, Users, Sparkles, Calendar, Clock, Trash2, Search, Zap, Brain, Shuffle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { UseFormReturn } from "react-hook-form";
import type { ContactFormValues, CampaignContactWithContact } from "./types";

// Email preview card component
export function EmailPreviewCard({ showPreview, selectedContactId, campaignContacts, isPersonalizing, personalizedPreview, emailSubject, emailBody }: {
    showPreview: boolean; selectedContactId: number | null; campaignContacts: CampaignContactWithContact[]; isPersonalizing: boolean;
    personalizedPreview: { subject: string; body: string } | null; emailSubject: string; emailBody: string;
}) {
    if (!showPreview) return null;
    return (
        <Card data-testid="card-email-preview">
            <CardHeader>
                <CardTitle className="text-base flex items-center justify-between">
                    <span>Email Preview</span>
                    {selectedContactId && <Badge variant="secondary">{campaignContacts.find(cc => cc.contact.id === selectedContactId)?.contact.name}</Badge>}
                </CardTitle>
                {selectedContactId && <p className="text-xs text-muted-foreground">Click a contact below to see their personalized version</p>}
            </CardHeader>
            <CardContent className="space-y-2">
                {isPersonalizing ? <div className="text-sm text-muted-foreground">Generating personalized preview...</div> : (
                    <>
                        <div><div className="text-xs text-muted-foreground mb-1">Subject:</div><div className="text-sm font-medium" data-testid="text-email-subject">{personalizedPreview?.subject || emailSubject}</div></div>
                        <Separator />
                        <div><div className="text-xs text-muted-foreground mb-1">Body:</div><div className="text-sm whitespace-pre-wrap" data-testid="text-email-body">{personalizedPreview?.body || emailBody}</div></div>
                    </>
                )}
            </CardContent>
        </Card>
    );
}

// Add contact form card component
export function AddContactCard({ form, onSubmit, isPending }: { form: UseFormReturn<ContactFormValues>; onSubmit: (data: ContactFormValues) => void; isPending: boolean }) {
    return (
        <Card data-testid="card-add-contact">
            <CardHeader><CardTitle className="flex items-center gap-2"><UserPlus className="w-5 h-5" />Add New Contact</CardTitle></CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Name *</FormLabel><FormControl><Input {...field} placeholder="John Doe" data-testid="input-contact-name" /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="email" render={({ field }) => (<FormItem><FormLabel>Email *</FormLabel><FormControl><Input {...field} type="email" placeholder="john@company.com" data-testid="input-contact-email" /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="company" render={({ field }) => (<FormItem><FormLabel>Company *</FormLabel><FormControl><Input {...field} placeholder="Acme Inc" data-testid="input-contact-company" /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="pronoun" render={({ field }) => (<FormItem><FormLabel>Title</FormLabel><FormControl>
                                <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex gap-4">
                                    <div className="flex items-center space-x-2"><RadioGroupItem value="Mr." id="pronoun-mr" /><Label htmlFor="pronoun-mr" className="font-normal cursor-pointer">Mr.</Label></div>
                                    <div className="flex items-center space-x-2"><RadioGroupItem value="Ms." id="pronoun-ms" /><Label htmlFor="pronoun-ms" className="font-normal cursor-pointer">Ms.</Label></div>
                                </RadioGroup>
                            </FormControl><FormMessage /></FormItem>)} />
                        </div>
                        <Button type="submit" disabled={isPending} data-testid="button-add-contact"><UserPlus className="w-4 h-4 mr-2" />{isPending ? "Adding..." : "Add Contact"}</Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}

// Bulk import card component
export function BulkImportCard({ bulkText, setBulkText, onImport, isPending }: { bulkText: string; setBulkText: (v: string) => void; onImport: () => void; isPending: boolean }) {
    return (
        <Card data-testid="card-bulk-import">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Sparkles className="w-5 h-5" />AI Bulk Import</CardTitle>
                <CardDescription>Paste contact info and AI will automatically extract and add them to your campaign</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <Label htmlFor="bulk-text" className="text-sm font-medium">Contact Information</Label>
                    <Textarea id="bulk-text" value={bulkText} onChange={(e) => setBulkText(e.target.value)} placeholder="Paste contact info here..." className="min-h-32 mt-2 font-mono text-sm" data-testid="textarea-bulk-contacts" />
                    <p className="text-xs text-muted-foreground mt-2">Tip: Works with various formats - lists, tables, CRM exports, etc.</p>
                </div>
                <Button onClick={onImport} disabled={!bulkText.trim() || isPending} data-testid="button-bulk-import"><Users className="w-4 h-4 mr-2" />{isPending ? "Importing..." : "Import Contacts"}</Button>
            </CardContent>
        </Card>
    );
}

// Contact list card component
export function ContactListCard({ campaignContacts, isLoading, selectedContactId, showPreview, onSelectContact, onRemoveContact, onClearAll, onNavigateToLeadFinder, onSchedule, onSend, removeIsPending, clearIsPending, sendIsPending, scheduleIsPending }: {
    campaignContacts: CampaignContactWithContact[]; isLoading: boolean; selectedContactId: number | null; showPreview: boolean;
    onSelectContact: (id: number) => void; onRemoveContact: (id: number) => void; onClearAll: () => void; onNavigateToLeadFinder?: () => void; onSchedule: () => void; onSend: () => void;
    removeIsPending: boolean; clearIsPending: boolean; sendIsPending: boolean; scheduleIsPending: boolean;
}) {
    return (
        <Card data-testid="card-contact-list">
            <CardHeader><div className="flex items-center justify-between gap-2">
                <CardTitle>Campaign Contacts ({campaignContacts.length}/25)</CardTitle>
                <div className="flex gap-2">
                    {campaignContacts.length > 0 && <Button onClick={onClearAll} variant="ghost" size="sm" disabled={clearIsPending} className="text-destructive hover:text-destructive hover:bg-destructive/10" data-testid="button-clear-all-contacts"><Trash2 className="w-4 h-4 mr-1" />{clearIsPending ? "Clearing..." : "Clear All"}</Button>}
                    {onNavigateToLeadFinder && <Button onClick={onNavigateToLeadFinder} variant="outline" size="sm" data-testid="button-find-contacts"><Search className="w-4 h-4 mr-1" />Find Contacts</Button>}
                    {campaignContacts.length > 0 && (<>
                        <Button onClick={onSchedule} variant="outline" disabled={scheduleIsPending} data-testid="button-schedule-campaign"><Clock className="w-4 h-4 mr-2" />Schedule</Button>
                        <Button onClick={onSend} disabled={sendIsPending} data-testid="button-send-campaign"><Send className="w-4 h-4 mr-2" />{sendIsPending ? "Sending..." : `Send Now to ${campaignContacts.length}`}</Button>
                    </>)}
                </div>
            </div></CardHeader>
            <CardContent>
                {isLoading ? <div className="text-sm text-muted-foreground">Loading contacts...</div> : campaignContacts.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground"><p data-testid="text-no-contacts">No contacts added yet</p><p className="text-sm mt-1">Add contacts above to start building your campaign</p></div>
                ) : (
                    <div className="space-y-3">
                        {campaignContacts.map((cc) => (
                            <div key={cc.id} className={`flex items-start justify-between p-3 border rounded-md hover-elevate cursor-pointer ${selectedContactId === cc.contact.id ? 'ring-2 ring-primary' : ''}`} data-testid={`contact-item-${cc.contact.id}`} onClick={() => onSelectContact(cc.contact.id)}>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1"><span className="font-medium" data-testid={`text-contact-name-${cc.contact.id}`}>{cc.contact.name}</span><Badge variant="secondary" data-testid={`badge-contact-company-${cc.contact.id}`}>{cc.contact.company}</Badge></div>
                                    <div className="text-sm text-muted-foreground" data-testid={`text-contact-email-${cc.contact.id}`}>{cc.contact.email}</div>
                                    {cc.contact.position && <div className="text-xs text-muted-foreground mt-1">{cc.contact.position}</div>}
                                    <div className="text-xs text-muted-foreground mt-1">Added {cc.addedAt ? formatDistanceToNow(new Date(cc.addedAt)) : "just now"} ago</div>
                                    {selectedContactId === cc.contact.id && showPreview && <div className="text-xs text-primary mt-1">▲ Preview shown above</div>}
                                </div>
                                <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onRemoveContact(cc.id); }} disabled={removeIsPending} data-testid={`button-remove-contact-${cc.contact.id}`}><X className="w-4 h-4" /></Button>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

// Schedule dialog component
export function ScheduleDialog({ open, onOpenChange, enableSpintax, setEnableSpintax, useOptimalTime, setUseOptimalTime, scheduleTime, setScheduleTime, optimalTimeInfo, isCalculatingOptimalTimes, onCalculateOptimalTimes, onSmartSchedule, onManualSchedule, smartScheduleIsPending, scheduleIsPending }: {
    open: boolean; onOpenChange: (v: boolean) => void; enableSpintax: boolean; setEnableSpintax: (v: boolean) => void; useOptimalTime: boolean; setUseOptimalTime: (v: boolean) => void;
    scheduleTime: string; setScheduleTime: (v: string) => void; optimalTimeInfo: { scheduledFor: string; reason: string } | null; isCalculatingOptimalTimes: boolean;
    onCalculateOptimalTimes: () => void; onSmartSchedule: () => void; onManualSchedule: () => void; smartScheduleIsPending: boolean; scheduleIsPending: boolean;
}) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg" data-testid="dialog-schedule-campaign">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2"><Calendar className="w-5 h-5" />Schedule Campaign</DialogTitle>
                    <DialogDescription>Choose when to send this campaign with AI-powered optimization options.</DialogDescription>
                </DialogHeader>
                <div className="space-y-5 py-4">
                    <Card className="p-4 border-primary/20">
                        <div className="flex items-start gap-3">
                            <div className="p-2 rounded-md bg-primary/10"><Shuffle className="w-4 h-4 text-primary" /></div>
                            <div className="flex-1">
                                <div className="flex items-center justify-between"><Label htmlFor="enable-spintax" className="font-medium">AI Spin-text</Label><Switch id="enable-spintax" checked={enableSpintax} onCheckedChange={setEnableSpintax} data-testid="switch-enable-spintax" /></div>
                                <p className="text-xs text-muted-foreground mt-1">Generate unique email variations to avoid spam filters</p>
                            </div>
                        </div>
                    </Card>
                    <Card className="p-4 border-primary/20">
                        <div className="flex items-start gap-3">
                            <div className="p-2 rounded-md bg-primary/10"><Brain className="w-4 h-4 text-primary" /></div>
                            <div className="flex-1">
                                <div className="flex items-center justify-between"><Label htmlFor="use-optimal-time" className="font-medium">AI-Optimized Send Times</Label><Switch id="use-optimal-time" checked={useOptimalTime} onCheckedChange={(checked) => { setUseOptimalTime(checked); if (checked && !optimalTimeInfo) onCalculateOptimalTimes(); }} data-testid="switch-use-optimal-time" /></div>
                                <p className="text-xs text-muted-foreground mt-1">AI determines the best time to send each email</p>
                                {useOptimalTime && optimalTimeInfo && <div className="mt-2 p-2 bg-muted rounded-md"><p className="text-xs font-medium">First email sends: {optimalTimeInfo.scheduledFor}</p><p className="text-xs text-muted-foreground">{optimalTimeInfo.reason}</p></div>}
                                {useOptimalTime && isCalculatingOptimalTimes && <p className="text-xs text-muted-foreground mt-2">Calculating optimal times...</p>}
                            </div>
                        </div>
                    </Card>
                    {!useOptimalTime && (
                        <div className="space-y-2">
                            <Label htmlFor="schedule-time">Manual Send Date & Time</Label>
                            <Input id="schedule-time" type="datetime-local" value={scheduleTime} onChange={(e) => setScheduleTime(e.target.value)} min={new Date().toISOString().slice(0, 16)} data-testid="input-schedule-time" />
                            <p className="text-xs text-muted-foreground">Emails will be sent in batches starting at this time</p>
                        </div>
                    )}
                </div>
                <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={() => onOpenChange(false)} data-testid="button-cancel-schedule">Cancel</Button>
                    {useOptimalTime ? (
                        <Button onClick={onSmartSchedule} disabled={smartScheduleIsPending || isCalculatingOptimalTimes} data-testid="button-smart-schedule"><Zap className="w-4 h-4 mr-2" />{smartScheduleIsPending ? "Scheduling..." : "Smart Schedule"}</Button>
                    ) : (
                        <Button onClick={onManualSchedule} disabled={!scheduleTime || scheduleIsPending} data-testid="button-confirm-schedule">{scheduleIsPending ? "Scheduling..." : "Schedule Campaign"}</Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// Header component
export function BuilderHeader({ onBack, onTogglePreview, showPreview }: { onBack: () => void; onTogglePreview: () => void; showPreview: boolean }) {
    return (
        <div className="flex items-center gap-3 p-4 border-b">
            <Button variant="ghost" size="icon" onClick={onBack} data-testid="button-back-to-variants"><ArrowLeft className="w-4 h-4" /></Button>
            <div className="flex-1"><h2 className="text-lg font-semibold" data-testid="text-campaign-builder-title">Build Your Campaign</h2><p className="text-sm text-muted-foreground">Add contacts to receive this email</p></div>
            <Button onClick={onTogglePreview} variant="outline" size="sm" data-testid="button-toggle-preview">{showPreview ? "Hide" : "Show"} Email</Button>
        </div>
    );
}
