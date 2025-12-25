// Meetings Tab - Main Entry Point
// Refactored into microarchitecture

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Calendar, Clock, Loader2, Copy, CheckCircle, XCircle, Link2, CalendarCheck, ExternalLink } from "lucide-react";

import { BookingsTabContent } from "./BookingsContent";
import { DetectedMeetingsContent } from "./DetectedMeetingsContent";
import type { Meeting, Booking, BookingPage, BookingStats } from "./types";

export default function MeetingsTab() {
    const { toast } = useToast();
    const [copied, setCopied] = useState(false);
    const [activeView, setActiveView] = useState<'bookings' | 'detected'>('bookings');

    const { data: bookingPage, isLoading: pageLoading, isError: pageError } = useQuery<BookingPage>({ queryKey: ['/api/booking/my-page'], retry: 1 });
    const { data: upcomingBookings, isLoading: upcomingLoading } = useQuery<Booking[]>({ queryKey: ['/api/booking/upcoming'], retry: 1 });
    const { data: allBookings, isLoading: allLoading } = useQuery<Booking[]>({ queryKey: ['/api/booking/my-bookings'], retry: 1 });
    const { data: stats } = useQuery<BookingStats>({ queryKey: ['/api/booking/stats'], retry: 1 });
    const { data: meetings, isLoading: meetingsLoading } = useQuery<Meeting[]>({ queryKey: ['/api/meetings'], retry: 1 });

    const bookingSystemAvailable = !pageError && bookingPage;

    const cancelMutation = useMutation({
        mutationFn: async (bookingId: number) => apiRequest('POST', `/api/booking/${bookingId}/cancel`, { reason: 'Cancelled by host' }),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['/api/booking/my-bookings'] }); queryClient.invalidateQueries({ queryKey: ['/api/booking/upcoming'] }); queryClient.invalidateQueries({ queryKey: ['/api/booking/stats'] }); toast({ title: "Meeting Cancelled", description: "The meeting has been cancelled." }); },
        onError: (error: any) => { toast({ variant: "destructive", title: "Error", description: error.message || "Failed to cancel meeting" }); },
    });

    const handleCopyLink = async () => {
        if (!bookingPage?.bookingUrl) return;
        try { await navigator.clipboard.writeText(bookingPage.bookingUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); toast({ title: "Link Copied", description: "Your booking link has been copied to clipboard." }); }
        catch (err) { toast({ variant: "destructive", title: "Error", description: "Failed to copy link" }); }
    };

    const acceptedMeetings = meetings?.filter(m => m.status === 'accepted') || [];
    const pendingMeetings = meetings?.filter(m => m.status === 'pending') || [];
    const isInitialLoading = pageLoading && meetingsLoading;

    if (isInitialLoading) return <div className="flex items-center justify-center h-full" data-testid="meetings-loading"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

    return (
        <div className="h-full overflow-auto p-6 space-y-6" data-testid="meetings-tab">
            <div className="flex items-center justify-between"><div><h2 className="text-2xl font-semibold text-foreground">Meetings</h2><p className="text-muted-foreground">Manage your scheduled meetings and booking link</p></div></div>

            {pageLoading ? (
                <Card><CardContent className="py-6"><div className="flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div></CardContent></Card>
            ) : bookingSystemAvailable ? (
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2"><div><CardTitle className="flex items-center gap-2"><Link2 className="h-5 w-5" />Your Booking Link</CardTitle><CardDescription>Share this link to let people schedule meetings with you</CardDescription></div></CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <Input value={bookingPage?.bookingUrl || ''} readOnly className="font-mono text-sm" data-testid="input-booking-url" />
                            <Tooltip><TooltipTrigger asChild><Button variant="outline" size="icon" onClick={handleCopyLink} disabled={!bookingPage?.bookingUrl} data-testid="button-copy-link">{copied ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}</Button></TooltipTrigger><TooltipContent>Copy link</TooltipContent></Tooltip>
                            <Tooltip><TooltipTrigger asChild><Button variant="outline" size="icon" onClick={() => window.open(bookingPage?.bookingUrl, '_blank')} disabled={!bookingPage?.bookingUrl} data-testid="button-open-link"><ExternalLink className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent>Open booking page</TooltipContent></Tooltip>
                        </div>
                        <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground"><div className="flex items-center gap-1"><Clock className="h-4 w-4" /><span>{bookingPage?.duration || 30} min meetings</span></div><Badge variant={bookingPage?.isActive !== false ? "default" : "secondary"}>{bookingPage?.isActive !== false ? "Active" : "Inactive"}</Badge></div>
                    </CardContent>
                </Card>
            ) : null}

            {bookingSystemAvailable && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900"><CalendarCheck className="h-5 w-5 text-blue-600 dark:text-blue-400" /></div><div><p className="text-2xl font-semibold" data-testid="stat-upcoming">{stats?.upcoming || 0}</p><p className="text-sm text-muted-foreground">Upcoming</p></div></div></CardContent></Card>
                    <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-green-100 dark:bg-green-900"><CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" /></div><div><p className="text-2xl font-semibold" data-testid="stat-confirmed">{stats?.confirmed || 0}</p><p className="text-sm text-muted-foreground">Confirmed (30d)</p></div></div></CardContent></Card>
                    <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-red-100 dark:bg-red-900"><XCircle className="h-5 w-5 text-red-600 dark:text-red-400" /></div><div><p className="text-2xl font-semibold" data-testid="stat-cancelled">{stats?.cancelled || 0}</p><p className="text-sm text-muted-foreground">Cancelled (30d)</p></div></div></CardContent></Card>
                    <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900"><Calendar className="h-5 w-5 text-purple-600 dark:text-purple-400" /></div><div><p className="text-2xl font-semibold" data-testid="stat-total">{stats?.total || 0}</p><p className="text-sm text-muted-foreground">Total (30d)</p></div></div></CardContent></Card>
                </div>
            )}

            <Tabs value={activeView} onValueChange={(v) => setActiveView(v as 'bookings' | 'detected')} className="space-y-4">
                <TabsList><TabsTrigger value="bookings" data-testid="subtab-bookings">Scheduled Bookings</TabsTrigger><TabsTrigger value="detected" data-testid="subtab-detected">Detected from Replies</TabsTrigger></TabsList>
                <TabsContent value="bookings" className="space-y-4"><BookingsTabContent upcomingBookings={upcomingBookings} allBookings={allBookings} upcomingLoading={upcomingLoading} allLoading={allLoading} onCancel={(id) => cancelMutation.mutate(id)} cancelIsPending={cancelMutation.isPending} /></TabsContent>
                <TabsContent value="detected" className="space-y-4"><DetectedMeetingsContent acceptedMeetings={acceptedMeetings} pendingMeetings={pendingMeetings} /></TabsContent>
            </Tabs>
        </div>
    );
}
