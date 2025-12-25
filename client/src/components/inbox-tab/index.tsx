// Inbox Tab - Main entry point
// Refactored into microarchitecture

import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { RefreshCw, Calendar, Mail, CheckCheck, Sparkles, Inbox } from "lucide-react";
import { useState } from "react";

// Local imports
import { useInboxWebSocket } from "./hooks";
import { ReplyCard } from "./ReplyCard";
import { HeaderRow } from "./HeaderComponents";
import type { Reply, InboxResponse, MonitoringSettings, GmailOAuthStatus, AutoReplySettings, FilterTab } from "./types";

export default function InboxTab() {
    const { toast } = useToast();
    const { user } = useAuth();
    const [activeFilter, setActiveFilter] = useState<FilterTab>('action');
    const [editingPhone, setEditingPhone] = useState(false);
    const [phoneNumber, setPhoneNumber] = useState("");
    const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);

    const { isConnected: wsConnected } = useInboxWebSocket(user?.id);

    // Queries
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

    // Mutations
    const scanMutation = useMutation({
        mutationFn: async () => apiRequest('POST', '/api/monitoring/scan'),
        onSuccess: (data: any) => {
            queryClient.invalidateQueries({ queryKey: ['/api/inbox/replies'] });
            toast({ title: "Scan Complete", description: `Found ${data.newReplies || 0} new replies` });
        },
        onError: (error: any) => {
            toast({ title: "Scan Failed", description: error.message || "Failed to scan inbox", variant: "destructive" });
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
                description: enabled ? "I'll automatically respond to meeting requests" : "Manual review required for all replies"
            });
        },
        onError: (error: any) => {
            toast({ title: "Failed to update", description: error.message || "Please configure a booking link in Settings first", variant: "destructive" });
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
                return { ...old, replies: old.replies.map(reply => reply.id === id ? { ...reply, status } : reply) };
            });
            return { previousData };
        },
        onError: (err, variables, context) => {
            if (context?.previousData) queryClient.setQueryData(['/api/inbox/replies'], context.previousData);
            toast({ title: "Update Failed", description: "Could not update reply status", variant: "destructive" });
        },
        onSettled: () => queryClient.invalidateQueries({ queryKey: ['/api/inbox/replies'] }),
    });

    const acceptAppointmentMutation = useMutation({
        mutationFn: async ({ appointmentId, replyId }: { appointmentId: number; replyId: number }) => {
            const result = await apiRequest('POST', `/api/appointments/${appointmentId}/accept`);
            await apiRequest('PATCH', `/api/inbox/replies/${replyId}/status`, { status: 'handled' });
            return result;
        },
        onMutate: async ({ replyId }) => {
            await queryClient.cancelQueries({ queryKey: ['/api/inbox/replies'] });
            const previousData = queryClient.getQueryData<InboxResponse>(['/api/inbox/replies']);
            queryClient.setQueryData<InboxResponse>(['/api/inbox/replies'], (old) => {
                if (!old) return old;
                return {
                    ...old,
                    replies: old.replies.map(reply => reply.id === replyId ? {
                        ...reply,
                        status: 'handled' as const,
                        appointment: reply.appointment ? { ...reply.appointment, status: 'accepted' } : null
                    } : reply)
                };
            });
            return { previousData };
        },
        onSuccess: (data: any) => {
            toast({ title: "Meeting Accepted", description: data.calendarEventCreated ? "Added to your calendar" : "Appointment confirmed" });
        },
        onError: (error: any, variables, context) => {
            if (context?.previousData) queryClient.setQueryData(['/api/inbox/replies'], context.previousData);
            toast({ title: "Failed to Accept", description: error.message || "Could not accept the meeting", variant: "destructive" });
        },
        onSettled: () => queryClient.invalidateQueries({ queryKey: ['/api/inbox/replies'] }),
    });

    const declineAppointmentMutation = useMutation({
        mutationFn: async ({ appointmentId, replyId }: { appointmentId: number; replyId: number }) => {
            await apiRequest('POST', `/api/appointments/${appointmentId}/decline`);
            await apiRequest('PATCH', `/api/inbox/replies/${replyId}/status`, { status: 'handled' });
        },
        onMutate: async ({ replyId }) => {
            await queryClient.cancelQueries({ queryKey: ['/api/inbox/replies'] });
            const previousData = queryClient.getQueryData<InboxResponse>(['/api/inbox/replies']);
            queryClient.setQueryData<InboxResponse>(['/api/inbox/replies'], (old) => {
                if (!old) return old;
                return {
                    ...old,
                    replies: old.replies.map(reply => reply.id === replyId ? {
                        ...reply,
                        status: 'handled' as const,
                        appointment: reply.appointment ? { ...reply.appointment, status: 'declined' } : null
                    } : reply)
                };
            });
            return { previousData };
        },
        onSuccess: () => toast({ title: "Meeting Declined" }),
        onError: (error: any, variables, context) => {
            if (context?.previousData) queryClient.setQueryData(['/api/inbox/replies'], context.previousData);
            toast({ title: "Failed to Decline", description: error.message || "Could not decline the meeting", variant: "destructive" });
        },
        onSettled: () => queryClient.invalidateQueries({ queryKey: ['/api/inbox/replies'] }),
    });

    // Handlers
    const handleMarkHandled = (replyId: number) => updateReplyStatusMutation.mutate({ id: replyId, status: 'handled' });
    const handleMarkNew = (replyId: number) => updateReplyStatusMutation.mutate({ id: replyId, status: 'new' });

    // Computed values
    const pendingAppointments = replies.filter(r => r.appointment?.status === 'pending');
    const newReplies = replies.filter(r => (r.status === 'new' || !r.status) && r.appointment?.status !== 'pending');
    const handledReplies = replies.filter(r => r.status === 'handled' || r.appointment?.status === 'accepted' || r.appointment?.status === 'declined');
    const needsAction = pendingAppointments.length + newReplies.length;

    const getFilteredReplies = () => {
        switch (activeFilter) {
            case 'action': return [...pendingAppointments, ...newReplies];
            case 'appointments': return replies.filter(r => r.appointment);
            case 'handled': return handledReplies;
            default: return replies;
        }
    };
    const filteredReplies = getFilteredReplies();

    return (
        <div className="h-full flex flex-col bg-background">
            <div className="flex-1 overflow-y-auto">
                <div className="max-w-4xl mx-auto p-6 space-y-4">

                    {/* Header Row */}
                    <HeaderRow
                        needsAction={needsAction}
                        autoReplySettings={autoReplySettings}
                        toggleAutoReplyMutation={toggleAutoReplyMutation}
                        wsConnected={wsConnected}
                        lastSyncedAt={lastSyncedAt}
                        repliesFetching={repliesFetching}
                        scanMutation={scanMutation}
                        settings={settings}
                        gmailOAuthStatus={gmailOAuthStatus}
                        editingPhone={editingPhone}
                        setEditingPhone={setEditingPhone}
                        phoneNumber={phoneNumber}
                        setPhoneNumber={setPhoneNumber}
                        updateSettingsMutation={updateSettingsMutation}
                        toast={toast}
                    />

                    {/* Quick Stats Bar */}
                    {stats && <StatsBar stats={stats} />}

                    {/* Filter Tabs */}
                    <Tabs value={activeFilter} onValueChange={(v) => setActiveFilter(v as FilterTab)}>
                        <TabsList className="grid w-full grid-cols-4">
                            <TabsTrigger value="action" className="gap-1.5" data-testid="tab-filter-action">
                                <Sparkles className="w-3.5 h-3.5" />Needs Action
                                {needsAction > 0 && <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">{needsAction}</Badge>}
                            </TabsTrigger>
                            <TabsTrigger value="appointments" className="gap-1.5" data-testid="tab-filter-appointments">
                                <Calendar className="w-3.5 h-3.5" />Meetings
                            </TabsTrigger>
                            <TabsTrigger value="handled" className="gap-1.5" data-testid="tab-filter-handled">
                                <CheckCheck className="w-3.5 h-3.5" />Handled
                            </TabsTrigger>
                            <TabsTrigger value="all" className="gap-1.5" data-testid="tab-filter-all">
                                <Inbox className="w-3.5 h-3.5" />All
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>

                    {/* Replies List */}
                    <RepliesList
                        repliesLoading={repliesLoading}
                        filteredReplies={filteredReplies}
                        activeFilter={activeFilter}
                        pendingAppointments={pendingAppointments}
                        newReplies={newReplies}
                        acceptAppointmentMutation={acceptAppointmentMutation}
                        declineAppointmentMutation={declineAppointmentMutation}
                        handleMarkHandled={handleMarkHandled}
                        handleMarkNew={handleMarkNew}
                        updateReplyStatusMutation={updateReplyStatusMutation}
                    />
                </div>
            </div>
        </div>
    );
}



// Stats bar component
function StatsBar({ stats }: { stats: any }) {
    return (
        <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5"><Mail className="w-4 h-4 text-muted-foreground" /><span className="font-medium">{stats.total}</span><span className="text-muted-foreground">replies</span></div>
            <div className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-muted-foreground" /><span className="font-medium">{stats.pendingMeetings}</span><span className="text-muted-foreground">pending meetings</span></div>
            <div className="flex items-center gap-1.5"><CheckCheck className="w-4 h-4 text-muted-foreground" /><span className="font-medium">{stats.handled}</span><span className="text-muted-foreground">handled</span></div>
        </div>
    );
}

// Replies list component  
function RepliesList({ repliesLoading, filteredReplies, activeFilter, pendingAppointments, newReplies, acceptAppointmentMutation, declineAppointmentMutation, handleMarkHandled, handleMarkNew, updateReplyStatusMutation }: any) {
    if (repliesLoading) {
        return <div className="flex items-center justify-center py-12 text-muted-foreground"><RefreshCw className="w-5 h-5 animate-spin mr-2" />Loading...</div>;
    }

    if (filteredReplies.length === 0) {
        return (
            <Card><CardContent className="py-12 text-center">
                <div className="w-12 h-12 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                    {activeFilter === 'action' ? <CheckCheck className="w-6 h-6 text-green-600" /> : <Inbox className="w-6 h-6 text-muted-foreground" />}
                </div>
                <p className="font-medium text-foreground">{activeFilter === 'action' ? "All caught up!" : "No replies yet"}</p>
                <p className="text-sm text-muted-foreground mt-1">{activeFilter === 'action' ? "No pending actions at the moment" : "Replies will appear here when contacts respond"}</p>
            </CardContent></Card>
        );
    }

    return (
        <div className="space-y-2">
            {activeFilter === 'action' && pendingAppointments.length > 0 && (
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-amber-600 dark:text-amber-400"><Calendar className="w-4 h-4" />Meetings to Confirm ({pendingAppointments.length})</div>
                    {pendingAppointments.map((reply: Reply) => (
                        <ReplyCard key={reply.id} reply={reply} onAccept={acceptAppointmentMutation.mutate} onDecline={declineAppointmentMutation.mutate} onMarkHandled={handleMarkHandled} onMarkNew={handleMarkNew} isPending={updateReplyStatusMutation.isPending} variant="appointment" />
                    ))}
                </div>
            )}
            {activeFilter === 'action' && newReplies.length > 0 && (
                <div className="space-y-2">
                    {pendingAppointments.length > 0 && <div className="flex items-center gap-2 text-sm font-medium text-foreground mt-4"><Mail className="w-4 h-4" />New Replies ({newReplies.length})</div>}
                    {newReplies.map((reply: Reply) => (
                        <ReplyCard key={reply.id} reply={reply} onAccept={acceptAppointmentMutation.mutate} onDecline={declineAppointmentMutation.mutate} onMarkHandled={handleMarkHandled} onMarkNew={handleMarkNew} isPending={updateReplyStatusMutation.isPending} variant="new" />
                    ))}
                </div>
            )}
            {activeFilter !== 'action' && filteredReplies.map((reply: Reply) => (
                <ReplyCard key={reply.id} reply={reply} onAccept={acceptAppointmentMutation.mutate} onDecline={declineAppointmentMutation.mutate} onMarkHandled={handleMarkHandled} onMarkNew={handleMarkNew} isPending={updateReplyStatusMutation.isPending} variant={reply.status === 'handled' ? 'handled' : reply.appointment?.status === 'pending' ? 'appointment' : 'new'} />
            ))}
        </div>
    );
}
