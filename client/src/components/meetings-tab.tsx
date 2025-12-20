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
import { Calendar, Clock, MapPin, Video, Phone, ExternalLink, Loader2, Copy, CheckCircle, XCircle, Link2, User, Mail, CalendarCheck } from "lucide-react";
import { format, isPast, isToday, isTomorrow } from "date-fns";

interface Meeting {
  id: number;
  contactId: number;
  contactName: string;
  contactEmail: string;
  contactCompany: string;
  appointmentType: string | null;
  suggestedDate: string | null;
  suggestedTime: string | null;
  duration: number | null;
  location: string | null;
  notes: string | null;
  status: string;
  googleCalendarEventId: string | null;
  googleCalendarLink: string | null;
  detectedAt: string;
  rawEmailText: string | null;
}

interface Booking {
  id: number;
  guestName: string;
  guestEmail: string;
  guestPhone?: string;
  guestNotes?: string;
  startTime: string;
  endTime: string;
  timezone: string;
  status: string;
  meetingLink?: string;
  createdAt: string;
}

interface BookingPage {
  id: number;
  slug: string;
  title: string;
  description?: string;
  duration: number;
  timezone: string;
  isActive: boolean;
  bookingUrl: string;
}

interface BookingStats {
  total: number;
  confirmed: number;
  cancelled: number;
  upcoming: number;
}

function formatMeetingDate(dateStr: string): string {
  const date = new Date(dateStr);
  if (isToday(date)) return "Today";
  if (isTomorrow(date)) return "Tomorrow";
  return format(date, "EEE, MMM d");
}

export default function MeetingsTab() {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [activeView, setActiveView] = useState<'bookings' | 'detected'>('bookings');

  const { data: bookingPage, isLoading: pageLoading, isError: pageError } = useQuery<BookingPage>({
    queryKey: ['/api/booking/my-page'],
    retry: 1,
  });

  const { data: upcomingBookings, isLoading: upcomingLoading, isError: upcomingError } = useQuery<Booking[]>({
    queryKey: ['/api/booking/upcoming'],
    retry: 1,
  });

  const { data: allBookings, isLoading: allLoading, isError: allError } = useQuery<Booking[]>({
    queryKey: ['/api/booking/my-bookings'],
    retry: 1,
  });

  const { data: stats } = useQuery<BookingStats>({
    queryKey: ['/api/booking/stats'],
    retry: 1,
  });

  const { data: meetings, isLoading: meetingsLoading, isError: meetingsError } = useQuery<Meeting[]>({
    queryKey: ['/api/meetings'],
    retry: 1,
  });

  const bookingSystemAvailable = !pageError && bookingPage;

  const cancelMutation = useMutation({
    mutationFn: async (bookingId: number) => {
      return apiRequest('POST', `/api/booking/${bookingId}/cancel`, { reason: 'Cancelled by host' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/booking/my-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/booking/upcoming'] });
      queryClient.invalidateQueries({ queryKey: ['/api/booking/stats'] });
      toast({
        title: "Meeting Cancelled",
        description: "The meeting has been cancelled.",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to cancel meeting",
      });
    },
  });

  const handleCopyLink = async () => {
    if (!bookingPage?.bookingUrl) return;
    try {
      await navigator.clipboard.writeText(bookingPage.bookingUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Link Copied",
        description: "Your booking link has been copied to clipboard.",
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to copy link",
      });
    }
  };

  const getAppointmentIcon = (type: string | null) => {
    switch (type?.toLowerCase()) {
      case 'video_call':
      case 'video':
        return <Video className="w-4 h-4" />;
      case 'call':
      case 'phone':
        return <Phone className="w-4 h-4" />;
      default:
        return <Calendar className="w-4 h-4" />;
    }
  };

  const getAppointmentTypeLabel = (type: string | null) => {
    switch (type?.toLowerCase()) {
      case 'video_call':
      case 'video':
        return 'Video Call';
      case 'call':
      case 'phone':
        return 'Phone Call';
      default:
        return 'Meeting';
    }
  };

  const acceptedMeetings = meetings?.filter(m => m.status === 'accepted') || [];
  const pendingMeetings = meetings?.filter(m => m.status === 'pending') || [];

  const isInitialLoading = pageLoading && meetingsLoading;

  if (isInitialLoading) {
    return (
      <div className="flex items-center justify-center h-full" data-testid="meetings-loading">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto p-6 space-y-6" data-testid="meetings-tab">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Meetings</h2>
          <p className="text-muted-foreground">Manage your scheduled meetings and booking link</p>
        </div>
      </div>

      {pageLoading ? (
        <Card>
          <CardContent className="py-6">
            <div className="flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      ) : bookingSystemAvailable ? (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Link2 className="h-5 w-5" />
                Your Booking Link
              </CardTitle>
              <CardDescription>
                Share this link to let people schedule meetings with you
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Input
                value={bookingPage?.bookingUrl || ''}
                readOnly
                className="font-mono text-sm"
                data-testid="input-booking-url"
              />
              <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopyLink}
                  disabled={!bookingPage?.bookingUrl}
                  data-testid="button-copy-link"
                >
                  {copied ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Copy link</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => window.open(bookingPage?.bookingUrl, '_blank')}
                  disabled={!bookingPage?.bookingUrl}
                  data-testid="button-open-link"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Open booking page</TooltipContent>
            </Tooltip>
          </div>
          <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{bookingPage?.duration || 30} min meetings</span>
            </div>
            <Badge variant={bookingPage?.isActive !== false ? "default" : "secondary"}>
              {bookingPage?.isActive !== false ? "Active" : "Inactive"}
            </Badge>
          </div>
        </CardContent>
      </Card>
      ) : null}

      {bookingSystemAvailable && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
                <CalendarCheck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-semibold" data-testid="stat-upcoming">{stats?.upcoming || 0}</p>
                <p className="text-sm text-muted-foreground">Upcoming</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-semibold" data-testid="stat-confirmed">{stats?.confirmed || 0}</p>
                <p className="text-sm text-muted-foreground">Confirmed (30d)</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900">
                <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-semibold" data-testid="stat-cancelled">{stats?.cancelled || 0}</p>
                <p className="text-sm text-muted-foreground">Cancelled (30d)</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900">
                <Calendar className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-semibold" data-testid="stat-total">{stats?.total || 0}</p>
                <p className="text-sm text-muted-foreground">Total (30d)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      )}

      <Tabs value={activeView} onValueChange={(v) => setActiveView(v as 'bookings' | 'detected')} className="space-y-4">
        <TabsList>
          <TabsTrigger value="bookings" data-testid="subtab-bookings">Scheduled Bookings</TabsTrigger>
          <TabsTrigger value="detected" data-testid="subtab-detected">Detected from Replies</TabsTrigger>
        </TabsList>

        <TabsContent value="bookings" className="space-y-4">
          <Tabs defaultValue="upcoming" className="space-y-4">
            <TabsList>
              <TabsTrigger value="upcoming" data-testid="subtab-upcoming">Upcoming</TabsTrigger>
              <TabsTrigger value="all" data-testid="subtab-all">All Bookings</TabsTrigger>
            </TabsList>

            <TabsContent value="upcoming" className="space-y-4">
              {upcomingLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : !upcomingBookings?.length ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Upcoming Meetings</h3>
                    <p className="text-muted-foreground">
                      Share your booking link to let people schedule time with you.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {upcomingBookings.map((booking) => (
                    <Card key={booking.id} data-testid={`booking-card-${booking.id}`}>
                      <CardContent className="py-4">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-4">
                            <div className="p-3 rounded-lg bg-primary/10">
                              <Video className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-medium">{booking.guestName}</h4>
                                <Badge variant="outline" className="text-xs">
                                  {formatMeetingDate(booking.startTime)}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1 flex-wrap">
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  <span>
                                    {format(new Date(booking.startTime), 'h:mm a')} - {format(new Date(booking.endTime), 'h:mm a')}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Mail className="h-3 w-3" />
                                  <span>{booking.guestEmail}</span>
                                </div>
                                {booking.guestPhone && (
                                  <div className="flex items-center gap-1">
                                    <Phone className="h-3 w-3" />
                                    <span>{booking.guestPhone}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {booking.meetingLink && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(booking.meetingLink, '_blank')}
                                data-testid={`button-join-${booking.id}`}
                              >
                                <Video className="h-4 w-4 mr-2" />
                                Join
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => cancelMutation.mutate(booking.id)}
                              disabled={cancelMutation.isPending}
                              data-testid={`button-cancel-${booking.id}`}
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="all" className="space-y-4">
              {allLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : !allBookings?.length ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Bookings Yet</h3>
                    <p className="text-muted-foreground">
                      Your booking history will appear here.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {allBookings.map((booking) => (
                    <Card key={booking.id} className={isPast(new Date(booking.endTime)) ? "opacity-60" : ""} data-testid={`all-booking-${booking.id}`}>
                      <CardContent className="py-4">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-lg ${booking.status === 'cancelled' ? 'bg-red-100 dark:bg-red-900' : 'bg-primary/10'}`}>
                              {booking.status === 'cancelled' ? (
                                <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                              ) : (
                                <User className="h-5 w-5 text-primary" />
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-medium">{booking.guestName}</h4>
                                <Badge variant={booking.status === 'cancelled' ? 'destructive' : 'outline'}>
                                  {booking.status}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1 flex-wrap">
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  <span>{format(new Date(booking.startTime), 'MMM d, yyyy')}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  <span>{format(new Date(booking.startTime), 'h:mm a')}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Mail className="h-3 w-3" />
                                  <span>{booking.guestEmail}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="detected" className="space-y-4">
          {acceptedMeetings.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Accepted Meetings ({acceptedMeetings.length})</h3>
              <div className="space-y-3">
                {acceptedMeetings.map((meeting) => (
                  <Card key={meeting.id} data-testid={`meeting-card-${meeting.id}`}>
                    <CardHeader>
                      <div className="flex items-start justify-between flex-wrap gap-2">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            {getAppointmentIcon(meeting.appointmentType)}
                            <CardTitle className="text-base">
                              {getAppointmentTypeLabel(meeting.appointmentType)} with {meeting.contactName}
                            </CardTitle>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                            <span>{meeting.contactEmail}</span>
                            {meeting.contactCompany && (
                              <>
                                <span>•</span>
                                <span>{meeting.contactCompany}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <Badge variant="default" className="bg-status-green hover-elevate">
                          Accepted
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {meeting.suggestedDate && (
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <span>
                              {format(new Date(meeting.suggestedDate), 'EEEE, MMMM d, yyyy')}
                            </span>
                          </div>
                        )}
                        
                        {meeting.suggestedTime && (
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            <span>
                              {meeting.suggestedTime}
                              {meeting.duration && ` (${meeting.duration} min)`}
                            </span>
                          </div>
                        )}
                        
                        {meeting.location && (
                          <div className="flex items-center gap-2 text-sm md:col-span-2">
                            <MapPin className="w-4 h-4 text-muted-foreground" />
                            <span>{meeting.location}</span>
                          </div>
                        )}
                      </div>

                      {meeting.notes && (
                        <div className="text-sm">
                          <div className="font-medium mb-1">Notes:</div>
                          <div className="text-muted-foreground">{meeting.notes}</div>
                        </div>
                      )}

                      {meeting.rawEmailText && (
                        <div className="text-sm">
                          <div className="font-medium mb-1">Original Request:</div>
                          <div className="text-muted-foreground italic border-l-2 border-border pl-3">
                            {meeting.rawEmailText}
                          </div>
                        </div>
                      )}

                      {meeting.googleCalendarLink && (
                        <div className="pt-2 border-t border-border">
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                            data-testid={`button-view-calendar-${meeting.id}`}
                          >
                            <a
                              href={meeting.googleCalendarLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2"
                            >
                              <ExternalLink className="w-4 h-4" />
                              View in Google Calendar
                            </a>
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {pendingMeetings.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Pending Requests ({pendingMeetings.length})</h3>
              <p className="text-sm text-muted-foreground">
                These meeting requests are awaiting your response. Visit the Inbox tab to accept or decline.
              </p>
              <div className="space-y-3">
                {pendingMeetings.map((meeting) => (
                  <Card key={meeting.id} data-testid={`pending-meeting-card-${meeting.id}`}>
                    <CardHeader>
                      <div className="flex items-start justify-between flex-wrap gap-2">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            {getAppointmentIcon(meeting.appointmentType)}
                            <CardTitle className="text-base">
                              {getAppointmentTypeLabel(meeting.appointmentType)} with {meeting.contactName}
                            </CardTitle>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                            <span>{meeting.contactEmail}</span>
                            {meeting.contactCompany && (
                              <>
                                <span>•</span>
                                <span>{meeting.contactCompany}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <Badge variant="secondary">
                          Pending
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {meeting.rawEmailText && (
                        <div className="text-sm">
                          <div className="text-muted-foreground italic border-l-2 border-border pl-3">
                            {meeting.rawEmailText}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {!acceptedMeetings.length && !pendingMeetings.length && (
            <Card>
              <CardContent className="py-12 text-center">
                <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No Detected Meetings</h3>
                <p className="text-muted-foreground">
                  When contacts request meetings via email replies, they'll appear here after AI detection.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
