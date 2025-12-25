// Bookings Tab Content - UI for scheduled bookings

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Clock, Video, Phone, Loader2, XCircle, User, Mail } from "lucide-react";
import { format, isPast } from "date-fns";
import { formatMeetingDate, type Booking } from "./types";

interface BookingsTabContentProps {
    upcomingBookings: Booking[] | undefined;
    allBookings: Booking[] | undefined;
    upcomingLoading: boolean;
    allLoading: boolean;
    onCancel: (bookingId: number) => void;
    cancelIsPending: boolean;
}

export function BookingsTabContent({ upcomingBookings, allBookings, upcomingLoading, allLoading, onCancel, cancelIsPending }: BookingsTabContentProps) {
    return (
        <Tabs defaultValue="upcoming" className="space-y-4">
            <TabsList>
                <TabsTrigger value="upcoming" data-testid="subtab-upcoming">Upcoming</TabsTrigger>
                <TabsTrigger value="all" data-testid="subtab-all">All Bookings</TabsTrigger>
            </TabsList>

            <TabsContent value="upcoming" className="space-y-4">
                {upcomingLoading ? (
                    <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
                ) : !upcomingBookings?.length ? (
                    <Card><CardContent className="py-12 text-center"><Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" /><h3 className="text-lg font-medium mb-2">No Upcoming Meetings</h3><p className="text-muted-foreground">Share your booking link to let people schedule time with you.</p></CardContent></Card>
                ) : (
                    <div className="space-y-3">
                        {upcomingBookings.map((booking) => (
                            <Card key={booking.id} data-testid={`booking-card-${booking.id}`}>
                                <CardContent className="py-4">
                                    <div className="flex items-center justify-between flex-wrap gap-2">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 rounded-lg bg-primary/10"><Video className="h-5 w-5 text-primary" /></div>
                                            <div>
                                                <div className="flex items-center gap-2 flex-wrap"><h4 className="font-medium">{booking.guestName}</h4><Badge variant="outline" className="text-xs">{formatMeetingDate(booking.startTime)}</Badge></div>
                                                <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1 flex-wrap">
                                                    <div className="flex items-center gap-1"><Clock className="h-3 w-3" /><span>{format(new Date(booking.startTime), 'h:mm a')} - {format(new Date(booking.endTime), 'h:mm a')}</span></div>
                                                    <div className="flex items-center gap-1"><Mail className="h-3 w-3" /><span>{booking.guestEmail}</span></div>
                                                    {booking.guestPhone && <div className="flex items-center gap-1"><Phone className="h-3 w-3" /><span>{booking.guestPhone}</span></div>}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {booking.meetingLink && <Button variant="outline" size="sm" onClick={() => window.open(booking.meetingLink, '_blank')} data-testid={`button-join-${booking.id}`}><Video className="h-4 w-4 mr-2" />Join</Button>}
                                            <Button variant="ghost" size="sm" onClick={() => onCancel(booking.id)} disabled={cancelIsPending} data-testid={`button-cancel-${booking.id}`}><XCircle className="h-4 w-4 mr-2" />Cancel</Button>
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
                    <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
                ) : !allBookings?.length ? (
                    <Card><CardContent className="py-12 text-center"><Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" /><h3 className="text-lg font-medium mb-2">No Bookings Yet</h3><p className="text-muted-foreground">Your booking history will appear here.</p></CardContent></Card>
                ) : (
                    <div className="space-y-3">
                        {allBookings.map((booking) => (
                            <Card key={booking.id} className={isPast(new Date(booking.endTime)) ? "opacity-60" : ""} data-testid={`all-booking-${booking.id}`}>
                                <CardContent className="py-4">
                                    <div className="flex items-center justify-between flex-wrap gap-2">
                                        <div className="flex items-center gap-4">
                                            <div className={`p-3 rounded-lg ${booking.status === 'cancelled' ? 'bg-red-100 dark:bg-red-900' : 'bg-primary/10'}`}>
                                                {booking.status === 'cancelled' ? <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" /> : <User className="h-5 w-5 text-primary" />}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 flex-wrap"><h4 className="font-medium">{booking.guestName}</h4><Badge variant={booking.status === 'cancelled' ? 'destructive' : 'outline'}>{booking.status}</Badge></div>
                                                <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1 flex-wrap">
                                                    <div className="flex items-center gap-1"><Calendar className="h-3 w-3" /><span>{format(new Date(booking.startTime), 'MMM d, yyyy')}</span></div>
                                                    <div className="flex items-center gap-1"><Clock className="h-3 w-3" /><span>{format(new Date(booking.startTime), 'h:mm a')}</span></div>
                                                    <div className="flex items-center gap-1"><Mail className="h-3 w-3" /><span>{booking.guestEmail}</span></div>
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
    );
}
