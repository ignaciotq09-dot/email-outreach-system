import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users } from "lucide-react";
import type { ContactEngagement } from "./types";

interface ContactEngagementCardProps { data?: ContactEngagement[]; isLoading: boolean }

export function ContactEngagementCard({ data, isLoading }: ContactEngagementCardProps) {
  return (
    <Card data-testid="card-contact-engagement">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" />Most Engaged Contacts</CardTitle>
        <CardDescription>Contacts ranked by engagement score</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
        ) : data && data.length > 0 ? (
          <div className="space-y-3">
            {data.map((contact, index) => (
              <div key={contact.id} className="p-3 rounded-md border" data-testid={`contact-engagement-${contact.id}`}>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-sm">{index + 1}</div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate" data-testid={`text-contact-name-${contact.id}`}>{contact.name}</h4>
                      <p className="text-xs text-muted-foreground truncate">{contact.email}{contact.company && ` • ${contact.company}`}</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-lg font-bold" data-testid={`text-engagement-score-${contact.id}`}>{contact.engagementScore}</div>
                    <div className="text-xs text-muted-foreground">score</div>
                  </div>
                </div>
                <div className="mt-2 flex gap-4 text-xs text-muted-foreground"><span>{contact.totalOpened} opens</span><span>{contact.totalReplies} replies</span></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">No contact engagement data yet</div>
        )}
      </CardContent>
    </Card>
  );
}
