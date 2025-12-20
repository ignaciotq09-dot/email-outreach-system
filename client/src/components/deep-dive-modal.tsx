import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, User, Briefcase, GraduationCap, Building2, Lightbulb, Activity, ExternalLink, RefreshCw } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { DeepDiveResult } from "@shared/schemas/deep-dive-schema";

interface DeepDiveModalProps {
  contactId: number;
  contactName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeepDiveModal({ contactId, contactName, open, onOpenChange }: DeepDiveModalProps) {
  const [activeTab, setActiveTab] = useState("profile");

  const { data: cachedData, isLoading: isCacheLoading } = useQuery<{ success: boolean; data: DeepDiveResult | null; cached: boolean }>({
    queryKey: ['/api/contacts', contactId, 'deep-dive'],
    enabled: open,
  });

  const runDeepDiveMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/contacts/${contactId}/deep-dive`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/contacts', contactId, 'deep-dive'] });
    },
  });

  const deepDiveData = cachedData?.data;
  const isRunning = runDeepDiveMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Deep Dive: {contactName}
          </DialogTitle>
        </DialogHeader>

        {isCacheLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : !deepDiveData ? (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <p className="text-muted-foreground text-center">
              No enrichment data yet. Click below to run a comprehensive deep dive on this contact.
            </p>
            <Button onClick={() => runDeepDiveMutation.mutate()} disabled={isRunning} data-testid="button-run-deep-dive">
              {isRunning ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Running Deep Dive...</> : "Run Deep Dive"}
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="outline">Confidence: {Math.round(deepDiveData.confidenceScores.overall * 100)}%</Badge>
                <span className="text-xs text-muted-foreground">Last updated: {new Date(deepDiveData.enrichedAt).toLocaleDateString()}</span>
              </div>
              <Button variant="outline" size="sm" onClick={() => runDeepDiveMutation.mutate()} disabled={isRunning} data-testid="button-refresh-deep-dive">
                <RefreshCw className={`h-4 w-4 mr-1 ${isRunning ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="profile" data-testid="tab-profile"><User className="h-4 w-4 mr-1" /> Profile</TabsTrigger>
                <TabsTrigger value="work" data-testid="tab-work"><Briefcase className="h-4 w-4 mr-1" /> Work</TabsTrigger>
                <TabsTrigger value="company" data-testid="tab-company"><Building2 className="h-4 w-4 mr-1" /> Company</TabsTrigger>
                <TabsTrigger value="activity" data-testid="tab-activity"><Activity className="h-4 w-4 mr-1" /> Activity</TabsTrigger>
                <TabsTrigger value="insights" data-testid="tab-insights"><Lightbulb className="h-4 w-4 mr-1" /> Insights</TabsTrigger>
              </TabsList>

              <ScrollArea className="h-[400px] mt-4">
                <TabsContent value="profile" className="mt-0">
                  <ProfileTab data={deepDiveData} />
                </TabsContent>
                <TabsContent value="work" className="mt-0">
                  <WorkTab data={deepDiveData} />
                </TabsContent>
                <TabsContent value="company" className="mt-0">
                  <CompanyTab data={deepDiveData} />
                </TabsContent>
                <TabsContent value="activity" className="mt-0">
                  <ActivityTab data={deepDiveData} />
                </TabsContent>
                <TabsContent value="insights" className="mt-0">
                  <InsightsTab data={deepDiveData} />
                </TabsContent>
              </ScrollArea>
            </Tabs>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ProfileTab({ data }: { data: DeepDiveResult }) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Basic Info</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center gap-4">
            {data.profile.photoUrl && (
              <img src={data.profile.photoUrl} alt={data.contact.name} className="h-16 w-16 rounded-full" />
            )}
            <div>
              <h3 className="font-semibold">{data.contact.name}</h3>
              <p className="text-sm text-muted-foreground">{data.profile.headline || data.contact.position}</p>
              {data.profile.location && <p className="text-xs text-muted-foreground">{data.profile.location}</p>}
            </div>
          </div>
          {data.profile.summary && (
            <p className="text-sm mt-4">{data.profile.summary}</p>
          )}
        </CardContent>
      </Card>

      {data.education.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2"><GraduationCap className="h-4 w-4" /> Education</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {data.education.map((edu, i) => (
                <li key={i} className="text-sm">
                  <span className="font-medium">{edu.school}</span>
                  {edu.degree && <span className="text-muted-foreground"> - {edu.degree}</span>}
                  {edu.field && <span className="text-muted-foreground"> in {edu.field}</span>}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {data.skills.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Skills</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1">
              {data.skills.slice(0, 15).map((skill, i) => (
                <Badge key={i} variant="secondary" className="text-xs">{skill}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {data.socialProfiles.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Social Profiles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {data.socialProfiles.map((profile, i) => (
                <a key={i} href={profile.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sm text-blue-600 hover:underline">
                  {profile.platform} <ExternalLink className="h-3 w-3" />
                </a>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function WorkTab({ data }: { data: DeepDiveResult }) {
  return (
    <div className="space-y-4">
      {data.workHistory.length > 0 ? (
        data.workHistory.map((job, i) => (
          <Card key={i}>
            <CardContent className="pt-4">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-semibold">{job.title}</h4>
                  <p className="text-sm text-muted-foreground">{job.company}</p>
                  {job.location && <p className="text-xs text-muted-foreground">{job.location}</p>}
                </div>
                <div className="text-right">
                  {job.isCurrent && <Badge>Current</Badge>}
                  {job.startDate && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {job.startDate} - {job.endDate || 'Present'}
                    </p>
                  )}
                </div>
              </div>
              {job.description && <p className="text-sm mt-2">{job.description}</p>}
            </CardContent>
          </Card>
        ))
      ) : (
        <p className="text-muted-foreground text-center py-8">No work history found</p>
      )}
    </div>
  );
}

function CompanyTab({ data }: { data: DeepDiveResult }) {
  const { companyIntel } = data;
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{companyIntel.name || data.contact.company || 'Company Info'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {companyIntel.industry && <p className="text-sm"><span className="text-muted-foreground">Industry:</span> {companyIntel.industry}</p>}
          {companyIntel.size && <p className="text-sm"><span className="text-muted-foreground">Size:</span> {companyIntel.size}</p>}
          {companyIntel.funding && <p className="text-sm"><span className="text-muted-foreground">Funding:</span> {companyIntel.funding}</p>}
        </CardContent>
      </Card>

      {companyIntel.techStack && companyIntel.techStack.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Tech Stack</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1">
              {companyIntel.techStack.map((tech, i) => (
                <Badge key={i} variant="outline" className="text-xs">{tech}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {companyIntel.recentNews && companyIntel.recentNews.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Recent News</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {companyIntel.recentNews.map((news, i) => (
                <li key={i} className="text-sm">{news}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ActivityTab({ data }: { data: DeepDiveResult }) {
  return (
    <div className="space-y-4">
      {data.recentActivity.length > 0 ? (
        data.recentActivity.map((activity, i) => (
          <Card key={i}>
            <CardContent className="pt-4">
              <div className="flex items-start justify-between">
                <Badge variant="outline" className="text-xs">{activity.platform}</Badge>
                {activity.date && <span className="text-xs text-muted-foreground">{activity.date}</span>}
              </div>
              <p className="text-sm mt-2">{activity.content}</p>
              {activity.engagement && <p className="text-xs text-muted-foreground mt-1">{activity.engagement}</p>}
            </CardContent>
          </Card>
        ))
      ) : (
        <p className="text-muted-foreground text-center py-8">No recent activity found</p>
      )}

      {data.triggerEvents.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Trigger Events</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {data.triggerEvents.map((event, i) => (
                <li key={i} className="border-l-2 border-primary pl-3">
                  <p className="text-sm font-medium">{event.description}</p>
                  <p className="text-xs text-muted-foreground">{event.relevance}</p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function InsightsTab({ data }: { data: DeepDiveResult }) {
  return (
    <div className="space-y-4">
      {data.insights.length > 0 ? (
        data.insights.map((insight, i) => (
          <Card key={i}>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between mb-2">
                <Badge variant={insight.actionable ? "default" : "secondary"}>{insight.category.replace('_', ' ')}</Badge>
                <span className="text-xs text-muted-foreground">{Math.round(insight.confidence * 100)}% confidence</span>
              </div>
              <p className="text-sm">{insight.insight}</p>
            </CardContent>
          </Card>
        ))
      ) : (
        <p className="text-muted-foreground text-center py-8">No insights generated yet</p>
      )}
    </div>
  );
}
