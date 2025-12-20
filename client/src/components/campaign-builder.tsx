import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest, ApiError } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, UserPlus, X, Send, Users, Sparkles, Calendar, Clock, Trash2, Search, Zap, Brain, Shuffle } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { formatDistanceToNow } from "date-fns";
import type { CampaignContactWithContact } from "@shared/schema";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const contactFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email required"),
  company: z.string().min(1, "Company is required"),
  pronoun: z.string().optional(),
});

type ContactFormValues = z.infer<typeof contactFormSchema>;

interface CampaignBuilderProps {
  campaignId: number;
  emailSubject: string;
  emailBody: string;
  onBack: () => void;
  onNavigateToLeadFinder?: () => void;
}

export function CampaignBuilder({
  campaignId,
  emailSubject,
  emailBody,
  onBack,
  onNavigateToLeadFinder,
}: CampaignBuilderProps) {
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

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: "",
      email: "",
      company: "",
      pronoun: "Mr.",
    },
  });

  // Fetch campaign contacts - use array query key for proper invalidation from Lead Finder
  const { data: campaignContacts = [], isLoading } = useQuery<CampaignContactWithContact[]>({
    queryKey: ['/api/campaigns', campaignId, 'contacts'],
    refetchOnWindowFocus: true, // Auto-refresh when returning from Lead Finder tab
  });

  // Add contact to campaign mutation
  const addContactMutation = useMutation({
    mutationFn: async (data: ContactFormValues) => {
      return await apiRequest("POST", `/api/campaigns/${campaignId}/contacts`, data);
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/campaigns', campaignId, 'contacts'] });
      form.reset();
      toast({
        title: "Contact added",
        description: data.removedOldest 
          ? "Contact added (oldest contact was removed to maintain 25-contact limit)"
          : "Contact has been added to this campaign",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error adding contact",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Remove contact from campaign mutation
  const removeContactMutation = useMutation({
    mutationFn: async (campaignContactId: number) => {
      return await apiRequest("DELETE", `/api/campaigns/${campaignId}/contacts/${campaignContactId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/campaigns', campaignId, 'contacts'] });
      toast({
        title: "Contact removed",
        description: "Contact has been removed from this campaign",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error removing contact",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Clear all contacts from campaign mutation
  const clearAllContactsMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("DELETE", `/api/campaigns/${campaignId}/contacts/all`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/campaigns', campaignId, 'contacts'] });
      toast({
        title: "All contacts cleared",
        description: "All contacts have been removed from this campaign",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error clearing contacts",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Bulk import contacts mutation
  const bulkImportMutation = useMutation({
    mutationFn: async (text: string) => {
      return await apiRequest("POST", "/api/contacts/parse-bulk", { bulkText: text, campaignId });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/campaigns', campaignId, 'contacts'] });
      queryClient.invalidateQueries({ queryKey: ["/api/contacts/lead-finder"] });
      setBulkText("");
      
      const contactsAdded = data.created || 0;
      const errors = data.errors?.length || 0;
      
      toast({
        title: "Contacts imported!",
        description: `Added ${contactsAdded} contact${contactsAdded !== 1 ? "s" : ""} to campaign${errors > 0 ? ` (${errors} failed)` : ""}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Import failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Send campaign mutation
  const sendCampaignMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest<{ success: boolean; sent: number; failed: number; partialSuccess?: boolean; errors?: any[] }>("POST", `/api/campaigns/${campaignId}/send`);
    },
    onSuccess: (data) => {
      if (data.partialSuccess) {
        toast({
          title: "Campaign partially sent",
          description: `Sent ${data.sent} email${data.sent !== 1 ? "s" : ""}, ${data.failed} failed`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Campaign sent!",
          description: `Successfully sent ${data.sent} personalized email${data.sent !== 1 ? "s" : ""}`,
        });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/sent"] });
      onBack();
    },
    onError: (error: Error | ApiError) => {
      let description = error.message;
      let failedCount = 0;
      
      // Extract detailed info from ApiError if available
      if (error instanceof ApiError && error.data) {
        failedCount = error.data.failed || 0;
        if (error.data.errors?.length > 0) {
          description = error.data.errors[0]?.error || error.message;
        }
      }
      
      toast({
        title: failedCount > 0 ? `Failed to send ${failedCount} email${failedCount !== 1 ? 's' : ''}` : "Failed to send emails",
        description: description,
        variant: "destructive",
      });
    },
  });

  // Schedule campaign mutation - includes spintax flag
  const scheduleCampaignMutation = useMutation({
    mutationFn: async (params: { sendTime: string; enableSpintax: boolean }) => {
      return await apiRequest("POST", `/api/campaigns/${campaignId}/schedule`, { 
        sendTime: params.sendTime,
        enableSpintax: params.enableSpintax,
      });
    },
    onSuccess: () => {
      setShowScheduleDialog(false);
      setScheduleTime("");
      toast({
        title: "Campaign scheduled!",
        description: `Campaign will be sent at the scheduled time${enableSpintax ? " with unique email variations" : ""} with smart batching`,
      });
      onBack();
    },
    onError: (error: Error) => {
      toast({
        title: "Error scheduling campaign",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Smart schedule with AI-optimized times and spintax
  const smartScheduleMutation = useMutation({
    mutationFn: async (params: { enableSpintax: boolean }) => {
      const contactIds = campaignContacts.map(cc => cc.contact.id);
      return await apiRequest("POST", "/api/spintax/schedule-batch", {
        contactIds,
        campaignId,
        subject: emailSubject,
        body: emailBody,
        enableSpintax: params.enableSpintax,
      });
    },
    onSuccess: (data: any) => {
      setShowScheduleDialog(false);
      toast({
        title: "Smart campaign scheduled!",
        description: `${data.scheduled} emails scheduled with AI-optimized send times${enableSpintax ? " and unique variations" : ""}`,
      });
      onBack();
    },
    onError: (error: Error) => {
      toast({
        title: "Error scheduling campaign",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Calculate optimal times for preview
  const calculateOptimalTimes = async () => {
    if (campaignContacts.length === 0) return;
    
    setIsCalculatingOptimalTimes(true);
    try {
      const contactIds = campaignContacts.map(cc => cc.contact.id);
      const result = await apiRequest<any>("POST", "/api/spintax/optimal-send-times-batch", { contactIds });
      
      const firstTime = Object.values(result.optimalTimes)[0] as any;
      if (firstTime) {
        setOptimalTimeInfo({
          scheduledFor: new Date(firstTime.scheduledFor).toLocaleString(),
          reason: firstTime.reason,
        });
      }
    } catch (error) {
      console.error("Error calculating optimal times:", error);
    } finally {
      setIsCalculatingOptimalTimes(false);
    }
  };

  const onSubmit = (data: ContactFormValues) => {
    addContactMutation.mutate(data);
  };

  // Fetch personalized preview for selected contact
  const handleSelectContact = async (contactId: number) => {
    if (selectedContactId === contactId) {
      // If clicking same contact, deselect
      setSelectedContactId(null);
      setPersonalizedPreview(null);
      return;
    }

    setSelectedContactId(contactId);
    setIsPersonalizing(true);
    
    try {
      const contact = campaignContacts.find(cc => cc.contact.id === contactId)?.contact;
      if (!contact) return;

      const result = await apiRequest("POST", `/api/campaigns/${campaignId}/personalize`, {
        contactId,
        variant: { subject: emailSubject, body: emailBody, approach: "Selected" }
      });
      setPersonalizedPreview(result);
    } catch (error) {
      console.error("Error personalizing preview:", error);
      toast({
        title: "Error",
        description: "Failed to generate personalized preview",
        variant: "destructive",
      });
    } finally {
      setIsPersonalizing(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header with Back Button */}
      <div className="flex items-center gap-3 p-4 border-b">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          data-testid="button-back-to-variants"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <h2 className="text-lg font-semibold" data-testid="text-campaign-builder-title">
            Build Your Campaign
          </h2>
          <p className="text-sm text-muted-foreground">
            Add contacts to receive this email
          </p>
        </div>
        <Button
          onClick={() => setShowPreview(!showPreview)}
          variant="outline"
          size="sm"
          data-testid="button-toggle-preview"
        >
          {showPreview ? "Hide" : "Show"} Email
        </Button>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto p-6 space-y-6">
          {/* Email Preview (Collapsible) */}
          {showPreview && (
            <Card data-testid="card-email-preview">
              <CardHeader>
                <CardTitle className="text-base flex items-center justify-between">
                  <span>Email Preview</span>
                  {selectedContactId && (
                    <Badge variant="secondary">
                      {campaignContacts.find(cc => cc.contact.id === selectedContactId)?.contact.name}
                    </Badge>
                  )}
                </CardTitle>
                {selectedContactId && (
                  <p className="text-xs text-muted-foreground">
                    Click a contact below to see their personalized version
                  </p>
                )}
              </CardHeader>
              <CardContent className="space-y-2">
                {isPersonalizing ? (
                  <div className="text-sm text-muted-foreground">Generating personalized preview...</div>
                ) : (
                  <>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Subject:</div>
                      <div className="text-sm font-medium" data-testid="text-email-subject">
                        {personalizedPreview?.subject || emailSubject}
                      </div>
                    </div>
                    <Separator />
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Body:</div>
                      <div
                        className="text-sm whitespace-pre-wrap"
                        data-testid="text-email-body"
                      >
                        {personalizedPreview?.body || emailBody}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Add Contact Form */}
          <Card data-testid="card-add-contact">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="w-5 h-5" />
                Add New Contact
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name *</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="John Doe"
                              data-testid="input-contact-name"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email *</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="email"
                              placeholder="john@company.com"
                              data-testid="input-contact-email"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="company"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company *</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Acme Inc"
                              data-testid="input-contact-company"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="pronoun"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Title</FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              className="flex gap-4"
                            >
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="Mr." id="pronoun-mr" />
                                <Label htmlFor="pronoun-mr" className="font-normal cursor-pointer">
                                  Mr.
                                </Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="Ms." id="pronoun-ms" />
                                <Label htmlFor="pronoun-ms" className="font-normal cursor-pointer">
                                  Ms.
                                </Label>
                              </div>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={addContactMutation.isPending}
                    data-testid="button-add-contact"
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    {addContactMutation.isPending ? "Adding..." : "Add Contact"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Bulk Import Contacts */}
          <Card data-testid="card-bulk-import">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                AI Bulk Import
              </CardTitle>
              <CardDescription>
                Paste contact info (names, emails, companies, etc.) and AI will automatically extract and add them to your campaign
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="bulk-text" className="text-sm font-medium">
                  Contact Information
                </Label>
                <Textarea
                  id="bulk-text"
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  placeholder="Paste contact info here. Examples:&#10;&#10;John Doe, john@company.com, CEO at TechCorp, 555-1234&#10;Jane Smith | jane@example.org | Marketing Director | Acme Inc&#10;Bob Johnson - Software Engineer @ StartupXYZ | bob@startup.com&#10;&#10;AI will automatically extract each contact's name, email, company, position, and phone."
                  className="min-h-32 mt-2 font-mono text-sm"
                  data-testid="textarea-bulk-contacts"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Tip: Works with various formats - lists, tables, LinkedIn profiles, business cards, etc.
                </p>
              </div>
              <Button
                onClick={() => bulkImportMutation.mutate(bulkText)}
                disabled={!bulkText.trim() || bulkImportMutation.isPending}
                data-testid="button-bulk-import"
              >
                <Users className="w-4 h-4 mr-2" />
                {bulkImportMutation.isPending ? "Importing..." : "Import Contacts"}
              </Button>
            </CardContent>
          </Card>

          {/* Contact List */}
          <Card data-testid="card-contact-list">
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <CardTitle>Campaign Contacts ({campaignContacts.length}/25)</CardTitle>
                <div className="flex gap-2">
                  {campaignContacts.length > 0 && (
                    <Button
                      onClick={() => clearAllContactsMutation.mutate()}
                      variant="ghost"
                      size="sm"
                      disabled={clearAllContactsMutation.isPending}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      data-testid="button-clear-all-contacts"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      {clearAllContactsMutation.isPending ? "Clearing..." : "Clear All"}
                    </Button>
                  )}
                  {onNavigateToLeadFinder && (
                    <Button
                      onClick={onNavigateToLeadFinder}
                      variant="outline"
                      size="sm"
                      data-testid="button-find-contacts"
                    >
                      <Search className="w-4 h-4 mr-1" />
                      Find Contacts
                    </Button>
                  )}
                  {campaignContacts.length > 0 && (
                    <>
                      <Button
                        onClick={() => setShowScheduleDialog(true)}
                        variant="outline"
                        disabled={scheduleCampaignMutation.isPending}
                        data-testid="button-schedule-campaign"
                      >
                        <Clock className="w-4 h-4 mr-2" />
                        Schedule
                      </Button>
                      <Button
                        onClick={() => sendCampaignMutation.mutate()}
                        disabled={sendCampaignMutation.isPending}
                        data-testid="button-send-campaign"
                      >
                        <Send className="w-4 h-4 mr-2" />
                        {sendCampaignMutation.isPending
                          ? "Sending..."
                          : `Send Now to ${campaignContacts.length}`}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-sm text-muted-foreground">Loading contacts...</div>
              ) : campaignContacts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p data-testid="text-no-contacts">No contacts added yet</p>
                  <p className="text-sm mt-1">Add contacts above to start building your campaign</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {campaignContacts.map((cc) => (
                    <div
                      key={cc.id}
                      className={`flex items-start justify-between p-3 border rounded-md hover-elevate cursor-pointer ${
                        selectedContactId === cc.contact.id ? 'ring-2 ring-primary' : ''
                      }`}
                      data-testid={`contact-item-${cc.contact.id}`}
                      onClick={() => handleSelectContact(cc.contact.id)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium" data-testid={`text-contact-name-${cc.contact.id}`}>
                            {cc.contact.name}
                          </span>
                          <Badge variant="secondary" data-testid={`badge-contact-company-${cc.contact.id}`}>
                            {cc.contact.company}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground" data-testid={`text-contact-email-${cc.contact.id}`}>
                          {cc.contact.email}
                        </div>
                        {cc.contact.position && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {cc.contact.position}
                          </div>
                        )}
                        <div className="text-xs text-muted-foreground mt-1">
                          Added {cc.addedAt ? formatDistanceToNow(new Date(cc.addedAt)) : "just now"} ago
                        </div>
                        {selectedContactId === cc.contact.id && showPreview && (
                          <div className="text-xs text-primary mt-1">
                            ▲ Preview shown above
                          </div>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeContactMutation.mutate(cc.id);
                        }}
                        disabled={removeContactMutation.isPending}
                        data-testid={`button-remove-contact-${cc.contact.id}`}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Schedule Dialog */}
      <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
        <DialogContent className="max-w-lg" data-testid="dialog-schedule-campaign">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Schedule Campaign
            </DialogTitle>
            <DialogDescription>
              Choose when to send this campaign with AI-powered optimization options.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-5 py-4">
            <Card className="p-4 border-primary/20">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-md bg-primary/10">
                  <Shuffle className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="enable-spintax" className="font-medium">
                      AI Spin-text
                    </Label>
                    <Switch
                      id="enable-spintax"
                      checked={enableSpintax}
                      onCheckedChange={setEnableSpintax}
                      data-testid="switch-enable-spintax"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Generate unique email variations for each recipient to avoid spam filters
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-4 border-primary/20">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-md bg-primary/10">
                  <Brain className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="use-optimal-time" className="font-medium">
                      AI-Optimized Send Times
                    </Label>
                    <Switch
                      id="use-optimal-time"
                      checked={useOptimalTime}
                      onCheckedChange={(checked) => {
                        setUseOptimalTime(checked);
                        if (checked && !optimalTimeInfo) {
                          calculateOptimalTimes();
                        }
                      }}
                      data-testid="switch-use-optimal-time"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    AI determines the best time to send each email based on timezone, industry, and engagement patterns
                  </p>
                  {useOptimalTime && optimalTimeInfo && (
                    <div className="mt-2 p-2 bg-muted rounded-md">
                      <p className="text-xs font-medium">First email sends: {optimalTimeInfo.scheduledFor}</p>
                      <p className="text-xs text-muted-foreground">{optimalTimeInfo.reason}</p>
                    </div>
                  )}
                  {useOptimalTime && isCalculatingOptimalTimes && (
                    <p className="text-xs text-muted-foreground mt-2">Calculating optimal times...</p>
                  )}
                </div>
              </div>
            </Card>

            {!useOptimalTime && (
              <div className="space-y-2">
                <Label htmlFor="schedule-time">Manual Send Date & Time</Label>
                <Input
                  id="schedule-time"
                  type="datetime-local"
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                  data-testid="input-schedule-time"
                />
                <p className="text-xs text-muted-foreground">
                  Emails will be sent in batches (20-30 per hour) starting at this time
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowScheduleDialog(false)}
              data-testid="button-cancel-schedule"
            >
              Cancel
            </Button>
            {useOptimalTime ? (
              <Button
                onClick={() => smartScheduleMutation.mutate({ enableSpintax })}
                disabled={smartScheduleMutation.isPending || isCalculatingOptimalTimes}
                data-testid="button-smart-schedule"
              >
                <Zap className="w-4 h-4 mr-2" />
                {smartScheduleMutation.isPending ? "Scheduling..." : "Smart Schedule"}
              </Button>
            ) : (
              <Button
                onClick={() => scheduleCampaignMutation.mutate({ sendTime: scheduleTime, enableSpintax })}
                disabled={!scheduleTime || scheduleCampaignMutation.isPending}
                data-testid="button-confirm-schedule"
              >
                {scheduleCampaignMutation.isPending ? "Scheduling..." : "Schedule Campaign"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
