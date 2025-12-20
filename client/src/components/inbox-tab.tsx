import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { 
  RefreshCw, 
  Calendar, 
  CheckCircle2, 
  XCircle,
  Clock,
  Phone,
  Building2,
  User2,
  ExternalLink,
  AlertTriangle,
  Settings2,
  Mail,
  CheckCheck,
  Sparkles,
  Inbox,
  ArrowRight,
  Wifi,
  WifiOff,
  HelpCircle,
  Zap,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatDistanceToNow } from "date-fns";
import { useState, useEffect, useRef, useCallback } from "react";

function SyncedAgo({ time }: { time: Date }) {
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => forceUpdate(n => n + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const seconds = Math.floor((Date.now() - time.getTime()) / 1000);
  
  if (seconds < 5) return <span>just now</span>;
  if (seconds < 60) return <span>{seconds}s ago</span>;
  if (seconds < 3600) return <span>{Math.floor(seconds / 60)}m ago</span>;
  return <span>{Math.floor(seconds / 3600)}h ago</span>;
}

function useInboxWebSocket(userId: number | undefined) {
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptRef = useRef(0);
  const maxReconnectAttempts = 10;

  const connect = useCallback(() => {
    if (!userId) return;
    
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/inbox?userId=${userId}`;
    
    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('[InboxWS] Connected');
        setIsConnected(true);
        reconnectAttemptRef.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          if (message.type === 'NEW_REPLY' || message.type === 'REPLY_UPDATED' || message.type === 'STATS_UPDATED') {
            console.log(`[InboxWS] Received ${message.type}, refreshing data`);
            queryClient.invalidateQueries({ queryKey: ['/api/inbox/replies'] });
            queryClient.invalidateQueries({ queryKey: ['/api/inbox/stats'] });
          }
        } catch (error) {
          console.error('[InboxWS] Error parsing message:', error);
        }
      };

      ws.onclose = (event) => {
        console.log('[InboxWS] Disconnected:', event.code, event.reason);
        setIsConnected(false);
        wsRef.current = null;
        
        if (reconnectAttemptRef.current < maxReconnectAttempts) {
          const backoffMs = Math.min(1000 * Math.pow(2, reconnectAttemptRef.current), 30000);
          console.log(`[InboxWS] Reconnecting in ${backoffMs}ms (attempt ${reconnectAttemptRef.current + 1})`);
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptRef.current++;
            connect();
          }, backoffMs);
        }
      };

      ws.onerror = (error) => {
        console.error('[InboxWS] Error:', error);
      };
    } catch (error) {
      console.error('[InboxWS] Failed to create WebSocket:', error);
    }
  }, [userId]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
  }, []);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !isConnected && userId) {
        console.log('[InboxWS] Tab visible, reconnecting...');
        reconnectAttemptRef.current = 0;
        connect();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isConnected, userId, connect]);

  return { isConnected, reconnect: connect };
}

interface Reply {
  id: number;
  sentEmailId: number;
  replyReceivedAt: string;
  replyContent: string;
  gmailMessageId: string;
  status: 'new' | 'handled';
  contact: {
    id: number;
    name: string;
    email: string;
    company: string;
  };
  sentEmail: {
    id: number;
    subject: string;
    body: string;
    sentAt: string;
  };
  appointment: {
    id: number;
    status: string;
    appointmentText: string;
    googleCalendarEventId: string | null;
    aiConfidence: number | null;
    platform: string | null;
    appointmentType: string | null;
    suggestedDate: string | null;
    suggestedTime: string | null;
  } | null;
}

interface InboxStats {
  total: number;
  needsAction: number;
  pendingMeetings: number;
  newReplies: number;
  meetings: number;
  handled: number;
}

interface InboxResponse {
  replies: Reply[];
  stats: InboxStats;
  pagination: {
    total: number;
    offset: number;
    limit: number;
    hasMore: boolean;
  };
}

interface MonitoringSettings {
  enabled: boolean;
  smsPhoneNumber: string;
  scanIntervalMinutes: number;
  lastScanAt: string | null;
}

interface GmailOAuthStatus {
  connected: boolean;
  hasCustomOAuth: boolean;
  email?: string;
  hasRefreshToken?: boolean;
}

interface AutoReplySettings {
  enabled: boolean;
  bookingLink: string | null;
  customMessage: string | null;
}

type FilterTab = 'all' | 'action' | 'appointments' | 'handled';

export default function InboxTab() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [activeFilter, setActiveFilter] = useState<FilterTab>('action');
  const [handledExpanded, setHandledExpanded] = useState(false);
  const [editingPhone, setEditingPhone] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);

  const { isConnected: wsConnected } = useInboxWebSocket(user?.id);

  const { data: gmailOAuthStatus } = useQuery<GmailOAuthStatus>({
    queryKey: ['/api/connect/gmail/status'],
  });

  const { data: settings } = useQuery<MonitoringSettings>({
    queryKey: ['/api/monitoring/settings'],
  });

  const { data: autoReplySettings } = useQuery<AutoReplySettings>({
    queryKey: ['/api/auto-reply/settings'],
  });

  const { data: inboxData, isLoading: repliesLoading, isFetching: repliesFetching } = useQuery<InboxResponse>({
    queryKey: ['/api/inbox/replies'],
    queryFn: async () => {
      // Fetch ALL replies to ensure 100% accurate stats (no limit)
      const response = await fetch('/api/inbox/replies', { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch replies');
      const data = await response.json();
      setLastSyncedAt(new Date());
      return data;
    },
    refetchOnWindowFocus: true,
  });

  const replies = inboxData?.replies ?? [];
  const stats = inboxData?.stats;

  const scanMutation = useMutation({
    mutationFn: async () => apiRequest('POST', '/api/monitoring/scan'),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/inbox/replies'] });
      queryClient.invalidateQueries({ queryKey: ['/api/inbox/stats'] });
      toast({
        title: "Scan Complete",
        description: `Found ${data.newReplies || 0} new replies`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Scan Failed",
        description: error.message || "Failed to scan inbox",
        variant: "destructive",
      });
    },
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings: Partial<MonitoringSettings>) => 
      apiRequest('POST', '/api/monitoring/settings', newSettings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/monitoring/settings'] });
      setEditingPhone(false);
      toast({ title: "Settings saved" });
    },
  });

  const toggleAutoReplyMutation = useMutation({
    mutationFn: async (enabled: boolean) => 
      apiRequest('POST', '/api/auto-reply/settings', { 
        enabled,
        bookingLink: autoReplySettings?.bookingLink,
        customMessage: autoReplySettings?.customMessage
      }),
    onSuccess: (_, enabled) => {
      queryClient.invalidateQueries({ queryKey: ['/api/auto-reply/settings'] });
      toast({ 
        title: enabled ? "Auto-Reply Enabled" : "Auto-Reply Disabled",
        description: enabled 
          ? "I'll automatically respond to meeting requests" 
          : "Manual review required for all replies"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update",
        description: error.message || "Please configure a booking link in Settings first",
        variant: "destructive",
      });
    },
  });

  const updateReplyStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: 'new' | 'handled' }) =>
      apiRequest('PATCH', `/api/inbox/replies/${id}/status`, { status }),
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: ['/api/inbox/replies'] });
      const previousData = queryClient.getQueryData<InboxResponse>(['/api/inbox/replies']);
      
      queryClient.setQueryData<InboxResponse>(['/api/inbox/replies'], (old) => {
        if (!old) return old;
        return {
          ...old,
          replies: old.replies.map(reply => reply.id === id ? { ...reply, status } : reply)
        };
      });
      
      return { previousData };
    },
    onError: (err, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['/api/inbox/replies'], context.previousData);
      }
      toast({
        title: "Update Failed",
        description: "Could not update reply status",
        variant: "destructive",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/inbox/replies'] });
    },
  });

  const acceptAppointmentMutation = useMutation({
    mutationFn: async ({ appointmentId, replyId }: { appointmentId: number; replyId: number }) => {
      const result = await apiRequest('POST', `/api/appointments/${appointmentId}/accept`);
      await apiRequest('PATCH', `/api/inbox/replies/${replyId}/status`, { status: 'handled' });
      return result;
    },
    onMutate: async ({ appointmentId, replyId }) => {
      await queryClient.cancelQueries({ queryKey: ['/api/inbox/replies'] });
      const previousData = queryClient.getQueryData<InboxResponse>(['/api/inbox/replies']);
      
      queryClient.setQueryData<InboxResponse>(['/api/inbox/replies'], (old) => {
        if (!old) return old;
        return {
          ...old,
          replies: old.replies.map(reply => {
            if (reply.id === replyId) {
              return {
                ...reply,
                status: 'handled' as const,
                appointment: reply.appointment ? { ...reply.appointment, status: 'accepted' } : null
              };
            }
            return reply;
          })
        };
      });
      
      return { previousData };
    },
    onSuccess: (data: any) => {
      toast({
        title: "Meeting Accepted",
        description: data.calendarEventCreated ? "Added to your calendar" : "Appointment confirmed",
      });
    },
    onError: (error: any, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['/api/inbox/replies'], context.previousData);
      }
      toast({
        title: "Failed to Accept",
        description: error.message || "Could not accept the meeting",
        variant: "destructive",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/inbox/replies'] });
    },
  });

  const declineAppointmentMutation = useMutation({
    mutationFn: async ({ appointmentId, replyId }: { appointmentId: number; replyId: number }) => {
      await apiRequest('POST', `/api/appointments/${appointmentId}/decline`);
      await apiRequest('PATCH', `/api/inbox/replies/${replyId}/status`, { status: 'handled' });
    },
    onMutate: async ({ appointmentId, replyId }) => {
      await queryClient.cancelQueries({ queryKey: ['/api/inbox/replies'] });
      const previousData = queryClient.getQueryData<InboxResponse>(['/api/inbox/replies']);
      
      queryClient.setQueryData<InboxResponse>(['/api/inbox/replies'], (old) => {
        if (!old) return old;
        return {
          ...old,
          replies: old.replies.map(reply => {
            if (reply.id === replyId) {
              return {
                ...reply,
                status: 'handled' as const,
                appointment: reply.appointment ? { ...reply.appointment, status: 'declined' } : null
              };
            }
            return reply;
          })
        };
      });
      
      return { previousData };
    },
    onSuccess: () => {
      toast({ title: "Meeting Declined" });
    },
    onError: (error: any, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['/api/inbox/replies'], context.previousData);
      }
      toast({
        title: "Failed to Decline",
        description: error.message || "Could not decline the meeting",
        variant: "destructive",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/inbox/replies'] });
    },
  });

  const handleMarkHandled = (replyId: number) => {
    updateReplyStatusMutation.mutate({ id: replyId, status: 'handled' });
  };

  const handleMarkNew = (replyId: number) => {
    updateReplyStatusMutation.mutate({ id: replyId, status: 'new' });
  };

  // Filter replies based on active tab
  const pendingAppointments = replies.filter(r => r.appointment?.status === 'pending');
  const newReplies = replies.filter(r => (r.status === 'new' || !r.status) && r.appointment?.status !== 'pending');
  const handledReplies = replies.filter(r => r.status === 'handled' || r.appointment?.status === 'accepted' || r.appointment?.status === 'declined');

  const getFilteredReplies = () => {
    switch (activeFilter) {
      case 'action':
        return [...pendingAppointments, ...newReplies];
      case 'appointments':
        return replies.filter(r => r.appointment);
      case 'handled':
        return handledReplies;
      default:
        return replies;
    }
  };

  const filteredReplies = getFilteredReplies();
  const needsAction = pendingAppointments.length + newReplies.length;

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-6 space-y-4">
          
          {/* Header Row - Compact */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Inbox className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground">Reply Command Center</h2>
                <p className="text-xs text-muted-foreground">
                  {needsAction > 0 ? (
                    <span className="text-amber-600 dark:text-amber-400 font-medium">
                      {needsAction} item{needsAction !== 1 ? 's' : ''} need your attention
                    </span>
                  ) : (
                    "All caught up!"
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Auto-Reply Toggle with Tooltip */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50 border border-border">
                <div className="flex items-center gap-1.5">
                  <Zap className={`w-4 h-4 ${autoReplySettings?.enabled ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`} />
                  <Label htmlFor="auto-reply-toggle" className="text-sm font-medium cursor-pointer">
                    Auto-Reply
                  </Label>
                  <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>
                      <button type="button" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="button-auto-reply-help">
                        <HelpCircle className="w-3.5 h-3.5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-xs p-3">
                      <p className="text-sm">
                        When enabled, I automatically send your booking link to prospects who express interest in meeting. 
                        Uses 3-layer verification (two AI passes + pattern matching) requiring 95%+ confidence - any uncertainty gets flagged for your review.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Switch
                  id="auto-reply-toggle"
                  checked={autoReplySettings?.enabled ?? false}
                  onCheckedChange={(enabled) => {
                    if (!autoReplySettings?.bookingLink && enabled) {
                      toast({
                        title: "Booking Link Required",
                        description: "Please configure your booking link in Settings first",
                        variant: "destructive",
                      });
                      return;
                    }
                    toggleAutoReplyMutation.mutate(enabled);
                  }}
                  disabled={toggleAutoReplyMutation.isPending}
                  data-testid="switch-auto-reply"
                />
              </div>

              {/* Real-time Status */}
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                {wsConnected ? (
                  <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                    <Wifi className="w-3 h-3" />
                    Live
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                    <WifiOff className="w-3 h-3" />
                    Offline
                  </span>
                )}
                {lastSyncedAt && (
                  <span className="border-l border-border pl-1.5">
                    <SyncedAgo time={lastSyncedAt} />
                  </span>
                )}
              </div>

              {/* Refresh Button */}
              <Button
                onClick={() => {
                  queryClient.invalidateQueries({ queryKey: ['/api/inbox/replies'] });
                }}
                disabled={repliesFetching}
                variant="outline"
                size="icon"
                data-testid="button-refresh-inbox"
              >
                <RefreshCw className={`w-4 h-4 ${repliesFetching ? 'animate-spin' : ''}`} />
              </Button>

              {/* Deep Scan Button */}
              <Button
                onClick={() => scanMutation.mutate()}
                disabled={scanMutation.isPending}
                size="sm"
                data-testid="button-scan-now"
              >
                <RefreshCw className={`w-4 h-4 mr-1.5 ${scanMutation.isPending ? 'animate-spin' : ''}`} />
                Deep Scan
              </Button>

              {/* Settings Popover */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="icon" data-testid="button-inbox-settings">
                    <Settings2 className="w-4 h-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80" align="end">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Monitoring Settings</h4>
                      {gmailOAuthStatus?.hasCustomOAuth ? (
                        <Badge variant="outline" className="text-green-600 border-green-600/50">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Gmail Connected
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-amber-600 border-amber-600/50">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          Connect Gmail
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="auto-scan" className="text-sm">Auto-scan</Label>
                        <p className="text-xs text-muted-foreground">
                          Check every {settings?.scanIntervalMinutes || 30} min
                        </p>
                      </div>
                      <Switch
                        id="auto-scan"
                        checked={settings?.enabled ?? false}
                        onCheckedChange={(enabled) => updateSettingsMutation.mutate({ enabled })}
                        data-testid="switch-enable-monitoring"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm">SMS Alerts</Label>
                      {editingPhone ? (
                        <div className="flex gap-2">
                          <Input
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            placeholder="+1 555-123-4567"
                            className="h-8 text-sm"
                            data-testid="input-phone-number"
                          />
                          <Button
                            size="sm"
                            onClick={() => updateSettingsMutation.mutate({ smsPhoneNumber: phoneNumber })}
                            data-testid="button-save-phone"
                          >
                            Save
                          </Button>
                        </div>
                      ) : (
                        <div 
                          className="flex items-center justify-between text-sm cursor-pointer hover-elevate p-2 rounded-md"
                          onClick={() => {
                            setPhoneNumber(settings?.smsPhoneNumber || "");
                            setEditingPhone(true);
                          }}
                          data-testid="button-edit-phone"
                        >
                          <span className="flex items-center gap-2 text-muted-foreground">
                            <Phone className="w-3.5 h-3.5" />
                            {settings?.smsPhoneNumber || "Not set"}
                          </span>
                          <span className="text-xs text-primary">Edit</span>
                        </div>
                      )}
                    </div>

                    {settings?.lastScanAt && (
                      <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <Clock className="w-3 h-3" />
                        Last scan: {formatDistanceToNow(new Date(settings.lastScanAt), { addSuffix: true })}
                      </div>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Quick Stats Bar */}
          {stats && (
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1.5">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">{stats.total}</span>
                <span className="text-muted-foreground">replies</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">{stats.pendingMeetings}</span>
                <span className="text-muted-foreground">pending meetings</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCheck className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">{stats.handled}</span>
                <span className="text-muted-foreground">handled</span>
              </div>
            </div>
          )}

          {/* Filter Tabs */}
          <Tabs value={activeFilter} onValueChange={(v) => setActiveFilter(v as FilterTab)}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="action" className="gap-1.5" data-testid="tab-filter-action">
                <Sparkles className="w-3.5 h-3.5" />
                Needs Action
                {needsAction > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                    {needsAction}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="appointments" className="gap-1.5" data-testid="tab-filter-appointments">
                <Calendar className="w-3.5 h-3.5" />
                Meetings
              </TabsTrigger>
              <TabsTrigger value="handled" className="gap-1.5" data-testid="tab-filter-handled">
                <CheckCheck className="w-3.5 h-3.5" />
                Handled
              </TabsTrigger>
              <TabsTrigger value="all" className="gap-1.5" data-testid="tab-filter-all">
                <Inbox className="w-3.5 h-3.5" />
                All
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Replies List */}
          {repliesLoading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <RefreshCw className="w-5 h-5 animate-spin mr-2" />
              Loading...
            </div>
          ) : filteredReplies.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <div className="w-12 h-12 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                  {activeFilter === 'action' ? (
                    <CheckCheck className="w-6 h-6 text-green-600" />
                  ) : (
                    <Inbox className="w-6 h-6 text-muted-foreground" />
                  )}
                </div>
                <p className="font-medium text-foreground">
                  {activeFilter === 'action' ? "All caught up!" : "No replies yet"}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {activeFilter === 'action' 
                    ? "No pending actions at the moment" 
                    : "Replies will appear here when contacts respond"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {/* Pending Appointments Section (Priority!) */}
              {activeFilter === 'action' && pendingAppointments.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-amber-600 dark:text-amber-400">
                    <Calendar className="w-4 h-4" />
                    Meetings to Confirm ({pendingAppointments.length})
                  </div>
                  {pendingAppointments.map((reply) => (
                    <ReplyCard 
                      key={reply.id} 
                      reply={reply} 
                      onAccept={acceptAppointmentMutation.mutate}
                      onDecline={declineAppointmentMutation.mutate}
                      onMarkHandled={handleMarkHandled}
                      onMarkNew={handleMarkNew}
                      isPending={updateReplyStatusMutation.isPending}
                      variant="appointment"
                    />
                  ))}
                </div>
              )}

              {/* New Replies Section */}
              {activeFilter === 'action' && newReplies.length > 0 && (
                <div className="space-y-2">
                  {pendingAppointments.length > 0 && (
                    <div className="flex items-center gap-2 text-sm font-medium text-foreground mt-4">
                      <Mail className="w-4 h-4" />
                      New Replies ({newReplies.length})
                    </div>
                  )}
                  {newReplies.map((reply) => (
                    <ReplyCard 
                      key={reply.id} 
                      reply={reply}
                      onAccept={acceptAppointmentMutation.mutate}
                      onDecline={declineAppointmentMutation.mutate}
                      onMarkHandled={handleMarkHandled}
                      onMarkNew={handleMarkNew}
                      isPending={updateReplyStatusMutation.isPending}
                      variant="new"
                    />
                  ))}
                </div>
              )}

              {/* Other filter views */}
              {activeFilter !== 'action' && filteredReplies.map((reply) => (
                <ReplyCard 
                  key={reply.id} 
                  reply={reply}
                  onAccept={acceptAppointmentMutation.mutate}
                  onDecline={declineAppointmentMutation.mutate}
                  onMarkHandled={handleMarkHandled}
                  onMarkNew={handleMarkNew}
                  isPending={updateReplyStatusMutation.isPending}
                  variant={reply.status === 'handled' ? 'handled' : reply.appointment?.status === 'pending' ? 'appointment' : 'new'}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface ReplyCardProps {
  reply: Reply;
  onAccept: (params: { appointmentId: number; replyId: number }) => void;
  onDecline: (params: { appointmentId: number; replyId: number }) => void;
  onMarkHandled: (replyId: number) => void;
  onMarkNew: (replyId: number) => void;
  isPending: boolean;
  variant: 'appointment' | 'new' | 'handled';
}

function ReplyCard({ reply, onAccept, onDecline, onMarkHandled, onMarkNew, isPending, variant }: ReplyCardProps) {
  const [expanded, setExpanded] = useState(false);

  const borderColor = variant === 'appointment' 
    ? 'border-l-amber-500' 
    : variant === 'new' 
    ? 'border-l-blue-500' 
    : 'border-l-muted';

  const timeAgo = formatDistanceToNow(new Date(reply.replyReceivedAt), { addSuffix: true });
  const isRecent = Date.now() - new Date(reply.replyReceivedAt).getTime() < 24 * 60 * 60 * 1000;

  return (
    <Card 
      className={`border-l-4 ${borderColor} hover-elevate cursor-pointer`}
      data-testid={`card-reply-${reply.id}`}
      onClick={() => setExpanded(!expanded)}
    >
      <CardContent className="p-4">
        {/* Main Row - Always Visible */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {/* Contact & Campaign Context */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-foreground" data-testid={`text-contact-name-${reply.id}`}>
                {reply.contact?.name || 'Unknown'}
              </span>
              {reply.contact?.company && (
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Building2 className="w-3 h-3" />
                  {reply.contact.company}
                </span>
              )}
              <span className={`text-xs ${isRecent ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground'}`}>
                {timeAgo}
              </span>
            </div>

            {/* Campaign Subject */}
            <p className="text-sm text-muted-foreground mt-0.5 truncate">
              Re: {reply.sentEmail?.subject || 'No subject'}
            </p>

            {/* Reply Preview */}
            <p className="text-sm text-foreground mt-1 line-clamp-2">
              {reply.replyContent || '(No content)'}
            </p>

            {/* Appointment Badge (if exists) */}
            {reply.appointment && (
              <div className="flex items-center gap-2 mt-2">
                {reply.appointment.status === 'pending' ? (
                  <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 gap-1">
                    <Calendar className="w-3 h-3" />
                    Meeting Request
                    {reply.appointment.aiConfidence && (
                      <span className="opacity-70">({reply.appointment.aiConfidence}% confidence)</span>
                    )}
                  </Badge>
                ) : reply.appointment.status === 'accepted' ? (
                  <Badge variant="outline" className="text-green-600 border-green-600/50 gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Meeting Scheduled
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-muted-foreground gap-1">
                    <XCircle className="w-3 h-3" />
                    Declined
                  </Badge>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
            {reply.appointment?.status === 'pending' && (
              <>
                <Button
                  size="sm"
                  onClick={() => onAccept({ appointmentId: reply.appointment!.id, replyId: reply.id })}
                  data-testid={`button-accept-appointment-${reply.appointment!.id}`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                  Accept
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onDecline({ appointmentId: reply.appointment!.id, replyId: reply.id })}
                  data-testid={`button-decline-appointment-${reply.appointment!.id}`}
                >
                  <XCircle className="w-3.5 h-3.5" />
                </Button>
              </>
            )}
            
            {!reply.appointment?.status || reply.appointment.status !== 'pending' ? (
              reply.status === 'handled' ? (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onMarkNew(reply.id)}
                  disabled={isPending}
                  data-testid={`button-mark-new-${reply.id}`}
                >
                  <ArrowRight className="w-3.5 h-3.5 mr-1" />
                  Reopen
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onMarkHandled(reply.id)}
                  disabled={isPending}
                  data-testid={`button-mark-handled-${reply.id}`}
                >
                  <CheckCheck className="w-3.5 h-3.5 mr-1" />
                  Done
                </Button>
              )
            ) : null}

            {/* Calendar Link */}
            {reply.appointment?.status === 'accepted' && reply.appointment.googleCalendarEventId && (
              <Button
                size="sm"
                variant="ghost"
                asChild
                data-testid={`button-view-calendar-${reply.appointment.id}`}
              >
                <a
                  href={`https://calendar.google.com/calendar/event?eid=${reply.appointment.googleCalendarEventId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Calendar className="w-3.5 h-3.5 mr-1" />
                  View
                  <ExternalLink className="w-3 h-3 ml-1" />
                </a>
              </Button>
            )}
          </div>
        </div>

        {/* Expanded Content */}
        {expanded && (
          <div className="mt-4 pt-4 border-t space-y-3">
            {/* Full Reply Content */}
            <div>
              <Label className="text-xs text-muted-foreground">Full Reply</Label>
              <p className="text-sm mt-1 whitespace-pre-wrap">
                {reply.replyContent || '(No content)'}
              </p>
            </div>

            {/* Original Email Context */}
            {reply.sentEmail?.body && (
              <div>
                <Label className="text-xs text-muted-foreground">Your Original Email</Label>
                <p className="text-sm mt-1 text-muted-foreground whitespace-pre-wrap line-clamp-4">
                  {reply.sentEmail.body}
                </p>
              </div>
            )}

            {/* Appointment Details */}
            {reply.appointment && (
              <div className="bg-muted/50 rounded-md p-3 space-y-2">
                <Label className="text-xs text-muted-foreground">Meeting Details</Label>
                <p className="text-sm">{reply.appointment.appointmentText}</p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  {reply.appointment.platform && (
                    <span className="flex items-center gap-1">
                      <span className="font-medium">Platform:</span> {reply.appointment.platform}
                    </span>
                  )}
                  {reply.appointment.suggestedDate && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(reply.appointment.suggestedDate).toLocaleDateString()}
                    </span>
                  )}
                  {reply.appointment.suggestedTime && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {reply.appointment.suggestedTime}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Contact Info */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <User2 className="w-3 h-3" />
                {reply.contact?.email}
              </span>
              {reply.sentEmail?.sentAt && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Sent {formatDistanceToNow(new Date(reply.sentEmail.sentAt), { addSuffix: true })}
                </span>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
