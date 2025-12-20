import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { ArrowLeft, Play, Clock, Mail, MessageSquare, Linkedin, Users, Calendar, Settings, CheckCircle2, AlertCircle, Loader2, Edit2, Eye, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Zap } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";

const DEFAULT_EMAIL_SUBJECT = "Reaching out about {{company}}";
const DEFAULT_EMAIL_BODY = `Hi {{firstName}},

I came across {{company}} and was impressed by your work in the {{industry}} space.

I'd love to connect and explore how we might be able to help you achieve your goals.

Would you be open to a quick 15-minute call this week?

Best,
{{senderName}}`;
const DEFAULT_SMS = "Hi {{firstName}}, I noticed {{company}} and would love to connect. Can we chat briefly? Reply STOP to opt out.";
const DEFAULT_LINKEDIN = "Hi {{firstName}}, I'm impressed by your work at {{company}}. Would love to connect and learn more about what you're building!";

interface Workflow {
  id: number;
  name: string;
  description: string | null;
  status: string;
  scheduleEnabled: boolean;
  scheduleType: string | null;
  scheduleInterval: number | null;
  scheduleDays: number[] | null;
  scheduleTime: string | null;
  scheduleTimezone: string | null;
  channels: { email?: boolean; sms?: boolean; linkedin?: boolean } | null;
  aiDirectives: { emailSubject?: string; emailTemplate?: string; smsTemplate?: string; linkedinTemplate?: string; targetAudience?: string } | null;
  nextRunAt: string | null;
  nodes: any[];
  edges: any[];
}

export default function WorkflowCompose() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isActivating, setIsActivating] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [templatesLoaded, setTemplatesLoaded] = useState(false);
  
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [smsMessage, setSmsMessage] = useState("");
  const [linkedinMessage, setLinkedinMessage] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  
  const [channelEmail, setChannelEmail] = useState(true);
  const [channelSms, setChannelSms] = useState(false);
  const [channelLinkedin, setChannelLinkedin] = useState(false);

  const { data: workflow, isLoading } = useQuery<Workflow>({
    queryKey: ["/api/workflows", id],
    enabled: !!id,
  });

  useEffect(() => {
    if (workflow && !templatesLoaded) {
      const directives = workflow.aiDirectives || {};
      const channels = workflow.channels || { email: true, sms: false, linkedin: false };
      
      setEmailSubject(directives.emailSubject || DEFAULT_EMAIL_SUBJECT);
      setEmailBody(directives.emailTemplate || DEFAULT_EMAIL_BODY);
      setSmsMessage(directives.smsTemplate || DEFAULT_SMS);
      setLinkedinMessage(directives.linkedinTemplate || DEFAULT_LINKEDIN);
      setTargetAudience(directives.targetAudience || "");
      
      setChannelEmail(channels.email ?? true);
      setChannelSms(channels.sms ?? false);
      setChannelLinkedin(channels.linkedin ?? false);
      
      setTemplatesLoaded(true);
    }
  }, [workflow, templatesLoaded]);

  const saveMutation = useMutation({
    mutationFn: async (data: { aiDirectives: any; channels?: any }) => {
      return apiRequest(`/api/workflows/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workflows", id] });
      toast({
        title: "Templates Saved",
        description: "Your message templates have been saved.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Save Failed",
        description: error.message || "Failed to save templates",
        variant: "destructive",
      });
    },
  });

  const activateMutation = useMutation({
    mutationFn: async () => {
      await saveMutation.mutateAsync({
        aiDirectives: {
          emailSubject,
          emailTemplate: emailBody,
          smsTemplate: smsMessage,
          linkedinTemplate: linkedinMessage,
          targetAudience,
        },
        channels: {
          email: channelEmail,
          sms: channelSms,
          linkedin: channelLinkedin,
        },
      });
      
      return apiRequest(`/api/workflows/${id}/activate`, {
        method: "POST",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workflows", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/workflows"] });
      toast({
        title: "Workflow Activated",
        description: "Your workflow is now running and will execute at the scheduled time.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Activation Failed",
        description: error.message || "Failed to activate workflow",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!workflow) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <AlertCircle className="h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground">Workflow not found</p>
        <Button variant="outline" onClick={() => navigate("/workflows")}>
          Back to Workflows
        </Button>
      </div>
    );
  }

  const channels = { email: channelEmail, sms: channelSms, linkedin: channelLinkedin };
  const enabledChannels = Object.entries(channels).filter(([_, enabled]) => enabled).map(([channel]) => channel);

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case "email": return <Mail className="h-4 w-4" />;
      case "sms": return <MessageSquare className="h-4 w-4" />;
      case "linkedin": return <Linkedin className="h-4 w-4" />;
      default: return null;
    }
  };

  const formatSchedule = () => {
    if (!workflow.scheduleEnabled) return "Not scheduled";
    
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const interval = workflow.scheduleInterval || 1;
    const unit = workflow.scheduleType || "week";
    const dayNum = workflow.scheduleDays?.[0];
    const time = workflow.scheduleTime || "09:00";
    
    let scheduleStr = `Every ${interval > 1 ? interval + " " : ""}${unit}${interval > 1 ? "s" : ""}`;
    if (dayNum !== undefined) {
      scheduleStr += ` on ${days[dayNum]}`;
    }
    scheduleStr += ` at ${time}`;
    
    return scheduleStr;
  };

  const handleActivate = async () => {
    setIsActivating(true);
    try {
      await activateMutation.mutateAsync();
    } finally {
      setIsActivating(false);
    }
  };

  const handleSaveTemplates = async () => {
    await saveMutation.mutateAsync({
      aiDirectives: {
        emailSubject,
        emailTemplate: emailBody,
        smsTemplate: smsMessage,
        linkedinTemplate: linkedinMessage,
        targetAudience,
      },
      channels: {
        email: channelEmail,
        sms: channelSms,
        linkedin: channelLinkedin,
      },
    });
  };

  const isActive = workflow.status === "active" && workflow.scheduleEnabled;
  
  const previewEmail = (template: string) => {
    return template
      .replace(/\{\{firstName\}\}/g, "John")
      .replace(/\{\{lastName\}\}/g, "Smith")
      .replace(/\{\{company\}\}/g, "Acme Corp")
      .replace(/\{\{industry\}\}/g, "Technology")
      .replace(/\{\{title\}\}/g, "VP of Sales")
      .replace(/\{\{senderName\}\}/g, "Your Name");
  };

  return (
    <div className="h-full overflow-auto p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate("/app")}
            data-testid="button-back-workflows"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-semibold" data-testid="text-workflow-name">
              {workflow.name}
            </h1>
            {workflow.description && (
              <p className="text-muted-foreground mt-1">{workflow.description}</p>
            )}
          </div>
          <Badge 
            variant={isActive ? "default" : "secondary"}
            data-testid="badge-workflow-status"
          >
            {isActive ? "Active" : workflow.status}
          </Badge>
        </div>

        {/* Outreach Channels - Always visible */}
        <div className="p-4 rounded-xl border border-border bg-card/50 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Outreach Channels</span>
          </div>
          
          <div className="flex gap-2">
            <div 
              className={`flex-1 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                channelEmail 
                  ? "border-purple-400 bg-purple-50 dark:bg-purple-900/20" 
                  : "border-border bg-background hover:border-purple-300"
              }`}
              onClick={() => setChannelEmail(!channelEmail)}
              data-testid="compose-toggle-channel-email"
            >
              <div className="flex items-center justify-between mb-1">
                <Mail className={`w-4 h-4 ${channelEmail ? "text-purple-600" : "text-muted-foreground"}`} />
                <Switch 
                  checked={channelEmail} 
                  onCheckedChange={setChannelEmail}
                  className="scale-75"
                  data-testid="compose-switch-channel-email"
                />
              </div>
              <p className={`text-xs font-medium ${channelEmail ? "text-purple-700 dark:text-purple-300" : ""}`}>Email</p>
            </div>

            <div 
              className={`flex-1 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                channelSms 
                  ? "border-green-400 bg-green-50 dark:bg-green-900/20" 
                  : "border-border bg-background hover:border-green-300"
              }`}
              onClick={() => setChannelSms(!channelSms)}
              data-testid="compose-toggle-channel-sms"
            >
              <div className="flex items-center justify-between mb-1">
                <MessageSquare className={`w-4 h-4 ${channelSms ? "text-green-600" : "text-muted-foreground"}`} />
                <Switch 
                  checked={channelSms} 
                  onCheckedChange={setChannelSms}
                  className="scale-75"
                  data-testid="compose-switch-channel-sms"
                />
              </div>
              <p className={`text-xs font-medium ${channelSms ? "text-green-700 dark:text-green-300" : ""}`}>SMS</p>
            </div>

            <div 
              className={`flex-1 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                channelLinkedin 
                  ? "border-sky-400 bg-sky-50 dark:bg-sky-900/20" 
                  : "border-border bg-background hover:border-sky-300"
              }`}
              onClick={() => setChannelLinkedin(!channelLinkedin)}
              data-testid="compose-toggle-channel-linkedin"
            >
              <div className="flex items-center justify-between mb-1">
                <Linkedin className={`w-4 h-4 ${channelLinkedin ? "text-sky-600" : "text-muted-foreground"}`} />
                <Switch 
                  checked={channelLinkedin} 
                  onCheckedChange={setChannelLinkedin}
                  className="scale-75"
                  data-testid="compose-switch-channel-linkedin"
                />
              </div>
              <p className={`text-xs font-medium ${channelLinkedin ? "text-sky-700 dark:text-sky-300" : ""}`}>LinkedIn</p>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <Edit2 className="h-4 w-4" />
              Templates
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Preview
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Channels
                  </CardTitle>
                  <CardDescription>
                    Communication channels this workflow will use
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {enabledChannels.length > 0 ? (
                      enabledChannels.map((channel) => (
                        <Badge key={channel} variant="outline" className="flex items-center gap-1.5 py-1.5 px-3">
                          {getChannelIcon(channel)}
                          <span className="capitalize">{channel}</span>
                        </Badge>
                      ))
                    ) : (
                      <p className="text-muted-foreground text-sm">No channels configured</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Schedule
                  </CardTitle>
                  <CardDescription>
                    When this workflow will run automatically
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span data-testid="text-schedule">{formatSchedule()}</span>
                    </div>
                    {workflow.nextRunAt && (
                      <p className="text-sm text-muted-foreground">
                        Next run: {new Date(workflow.nextRunAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Target Audience
                </CardTitle>
                <CardDescription>
                  Describe who you want to reach with this outreach campaign
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="e.g., CTOs and VP of Engineering at Series B+ startups in the Bay Area working on AI/ML products..."
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  className="min-h-[80px]"
                  data-testid="input-target-audience"
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="templates" className="space-y-6 mt-6">
            {channelEmail && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    Email Template
                  </CardTitle>
                  <CardDescription>
                    Customize your outreach email. Use {'{{firstName}}'}, {'{{company}}'}, {'{{industry}}'} for personalization.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email-subject">Subject Line</Label>
                    <Input
                      id="email-subject"
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                      placeholder="Email subject..."
                      data-testid="input-email-subject"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email-body">Message Body</Label>
                    <Textarea
                      id="email-body"
                      value={emailBody}
                      onChange={(e) => setEmailBody(e.target.value)}
                      placeholder="Write your email..."
                      className="min-h-[200px] font-mono text-sm"
                      data-testid="input-email-body"
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {channelSms && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    SMS Template
                  </CardTitle>
                  <CardDescription>
                    Keep it short and punchy. 160 characters max recommended.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={smsMessage}
                    onChange={(e) => setSmsMessage(e.target.value)}
                    placeholder="Write your SMS..."
                    className="min-h-[100px]"
                    data-testid="input-sms-template"
                  />
                  <p className={`text-sm mt-2 ${smsMessage.length > 160 ? 'text-destructive' : 'text-muted-foreground'}`}>
                    {smsMessage.length}/160 characters
                  </p>
                </CardContent>
              </Card>
            )}

            {channelLinkedin && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Linkedin className="h-5 w-5" />
                    LinkedIn Message Template
                  </CardTitle>
                  <CardDescription>
                    Connection request or direct message template
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={linkedinMessage}
                    onChange={(e) => setLinkedinMessage(e.target.value)}
                    placeholder="Write your LinkedIn message..."
                    className="min-h-[100px]"
                    data-testid="input-linkedin-template"
                  />
                </CardContent>
              </Card>
            )}

            <div className="flex justify-end">
              <Button 
                onClick={handleSaveTemplates}
                disabled={saveMutation.isPending}
                data-testid="button-save-templates"
              >
                {saveMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                Save Templates
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="preview" className="space-y-6 mt-6">
            {channelEmail && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    Email Preview
                  </CardTitle>
                  <CardDescription>
                    How your email will look with sample data
                  </CardDescription>
                </CardHeader>
                <CardContent className="bg-muted/30 rounded-lg p-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium">Subject:</span>
                      <span>{previewEmail(emailSubject)}</span>
                    </div>
                    <Separator />
                    <div className="whitespace-pre-wrap text-sm">
                      {previewEmail(emailBody)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {channelSms && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    SMS Preview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-green-100 dark:bg-green-900/30 rounded-2xl rounded-bl-none p-4 max-w-sm">
                    <p className="text-sm">{previewEmail(smsMessage)}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {channelLinkedin && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Linkedin className="h-5 w-5" />
                    LinkedIn Preview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-blue-100 dark:bg-blue-900/30 rounded-lg p-4 max-w-md">
                    <p className="text-sm">{previewEmail(linkedinMessage)}</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        <Separator />

        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5" />
              Activate Workflow
            </CardTitle>
            <CardDescription>
              Once activated, this workflow will automatically research leads using Apollo.io 
              and send personalized outreach via the selected channels at the scheduled times.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isActive ? (
              <div className="flex items-center gap-3 p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-700 dark:text-green-400">Workflow is Active</p>
                  <p className="text-sm text-muted-foreground">
                    This workflow will run automatically according to the schedule.
                  </p>
                </div>
              </div>
            ) : (
              <Button 
                size="lg" 
                className="w-full"
                onClick={handleActivate}
                disabled={isActivating || !workflow.scheduleEnabled}
                data-testid="button-activate-workflow"
              >
                {isActivating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Activating...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Activate Autonomous Workflow
                  </>
                )}
              </Button>
            )}
            
            {!workflow.scheduleEnabled && !isActive && (
              <p className="text-sm text-muted-foreground text-center">
                Configure a schedule first before activating the workflow.
              </p>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-between items-center">
          <Button 
            variant="outline" 
            onClick={() => navigate(`/app`)}
            data-testid="button-edit-workflow"
          >
            Edit Workflow
          </Button>
          <Button 
            variant="outline" 
            onClick={() => navigate("/app")}
            data-testid="button-done"
          >
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}
