import { useState } from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import SentEmailRow from "./sent-email-row";
import SentSmsRow from "./sent-sms-row";
import { Loader2, Clock, Mail, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface SentEmailWithContact {
  id: number;
  contactId: number;
  subject: string | null;
  body: string | null;
  gmailMessageId: string | null;
  gmailThreadId: string | null;
  sentAt: string | null;
  replyReceived: boolean;
  contact: {
    id: number;
    name: string;
    email: string;
    company: string | null;
    position: string | null;
  } | null;
  replies?: any[];
  followUps?: any[];
}

interface SentSmsWithContact {
  id: number;
  contactId: number;
  toPhone: string;
  message: string;
  personalizedMessage: string | null;
  status: string;
  sentAt: string | null;
  deliveredAt: string | null;
  errorMessage: string | null;
  contact: {
    id: number;
    name: string;
    email: string;
    company: string | null;
  } | null;
}

export default function SentEmailsTab() {
  const { toast } = useToast();
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [expandedSmsId, setExpandedSmsId] = useState<number | null>(null);
  const [isCheckingFollowUps, setIsCheckingFollowUps] = useState(false);
  const [refreshNonce, setRefreshNonce] = useState(0);
  const [activeTab, setActiveTab] = useState<'emails' | 'sms'>('emails');

  const PAGE_SIZE = 20;

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery<SentEmailWithContact[]>({
    queryKey: ['/api/emails/sent', 'infinite', refreshNonce],
    queryFn: async ({ pageParam = 0 }) => {
      const response = await fetch(`/api/emails/sent?limit=${PAGE_SIZE}&offset=${pageParam}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch sent emails');
      return response.json();
    },
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < PAGE_SIZE) return undefined;
      return allPages.length * PAGE_SIZE;
    },
    initialPageParam: 0,
  });

  // Combine all loaded pages
  const allEmails = data?.pages.flat() || [];

  // Fetch sent SMS messages with pagination
  const {
    data: smsData,
    fetchNextPage: fetchNextSmsPage,
    hasNextPage: hasNextSmsPage,
    isFetchingNextPage: isFetchingNextSmsPage,
    isLoading: isSmsLoading,
  } = useInfiniteQuery<SentSmsWithContact[]>({
    queryKey: ['/api/sms/sent', 'infinite', refreshNonce],
    queryFn: async ({ pageParam = 0 }) => {
      const response = await fetch(`/api/sms/sent?limit=${PAGE_SIZE}&offset=${pageParam}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch sent SMS');
      return response.json();
    },
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < PAGE_SIZE) return undefined;
      return allPages.length * PAGE_SIZE;
    },
    initialPageParam: 0,
    enabled: activeTab === 'sms',
  });

  const allSms = smsData?.pages.flat() || [];

  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  const resetPagination = () => {
    // First, purge the old cached query data
    queryClient.removeQueries({
      queryKey: ['/api/emails/sent', 'infinite'],
      exact: false
    });
    // Then increment nonce to create fresh query starting from page 0
    setRefreshNonce(prev => prev + 1);
  };

  const handleCheckAutomaticFollowUps = async () => {
    setIsCheckingFollowUps(true);

    try {
      const result = await apiRequest<{ sentCount: number, totalChecked: number, results: any[] }>(
        "POST",
        "/api/emails/check-automatic-followups",
        {}
      );

      if (result.sentCount > 0) {
        toast({
          title: "Follow-ups Sent",
          description: `Sent ${result.sentCount} automatic follow-ups (checked ${result.totalChecked} emails).`,
        });

        // Reset pagination and refresh sent emails
        resetPagination();
      } else {
        toast({
          title: "No Follow-ups Needed",
          description: `Checked ${result.totalChecked} emails - no follow-ups needed at this time.`,
        });
      }
    } catch (error) {
      console.error("Error checking automatic follow-ups:", error);
      toast({
        title: "Error",
        description: "Failed to check automatic follow-ups.",
        variant: "destructive",
      });
    } finally {
      setIsCheckingFollowUps(false);
    }
  };

  const displayEmails = allEmails;

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold">Sent</h2>
            <p className="text-sm text-muted-foreground">
              Track your email and SMS outreach
            </p>
          </div>
          {activeTab === 'emails' && (
            <Button
              onClick={handleCheckAutomaticFollowUps}
              disabled={isCheckingFollowUps}
              variant="outline"
              className="border-status-yellow text-status-yellow hover:bg-status-yellow/10"
              data-testid="button-check-followups"
            >
              {isCheckingFollowUps ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Clock className="w-4 h-4 mr-2" />
              )}
              Send Auto Follow-ups
            </Button>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'emails' | 'sms')} className="mb-4">
          <TabsList>
            <TabsTrigger value="emails" data-testid="tab-sent-emails">
              <Mail className="w-4 h-4 mr-2" />
              Emails ({allEmails.length})
            </TabsTrigger>
            <TabsTrigger value="sms" data-testid="tab-sent-sms">
              <MessageSquare className="w-4 h-4 mr-2" />
              SMS ({allSms.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="emails" className="mt-4">
            <p className="text-xs text-muted-foreground mb-3">
              Follow-up sequence: 3 days → 13 days → 3 weeks
            </p>
            <div className="space-y-2">
              {displayEmails.map((email: any) => (
                <SentEmailRow
                  key={email.id}
                  email={email}
                  isExpanded={expandedId === email.id}
                  onToggleExpand={() => setExpandedId(expandedId === email.id ? null : email.id)}
                />
              ))}

              {displayEmails.length === 0 && !isLoading && (
                <div className="text-center py-12">
                  <p className="text-sm text-muted-foreground italic">
                    No emails sent yet. Start by composing and sending emails from the Compose tab.
                  </p>
                </div>
              )}

              {hasNextPage && (
                <div className="flex justify-center pt-4">
                  <Button
                    onClick={handleLoadMore}
                    disabled={isFetchingNextPage}
                    variant="outline"
                    data-testid="button-load-more-sent"
                  >
                    {isFetchingNextPage ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      `Load More (${displayEmails.length} shown)`
                    )}
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="sms" className="mt-4">
            {isSmsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-2">
                {allSms.map((sms: SentSmsWithContact) => (
                  <SentSmsRow
                    key={sms.id}
                    sms={sms}
                    isExpanded={expandedSmsId === sms.id}
                    onToggleExpand={() => setExpandedSmsId(expandedSmsId === sms.id ? null : sms.id)}
                  />
                ))}

                {allSms.length === 0 && !isSmsLoading && (
                  <div className="text-center py-12">
                    <p className="text-sm text-muted-foreground italic">
                      No SMS messages sent yet. Enable SMS in Settings and use "SMS" or "Both" channel when composing.
                    </p>
                  </div>
                )}

                {hasNextSmsPage && (
                  <div className="flex justify-center pt-4">
                    <Button
                      onClick={() => fetchNextSmsPage()}
                      disabled={isFetchingNextSmsPage}
                      variant="outline"
                      data-testid="button-load-more-sms"
                    >
                      {isFetchingNextSmsPage ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        `Load More (${allSms.length} shown)`
                      )}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
