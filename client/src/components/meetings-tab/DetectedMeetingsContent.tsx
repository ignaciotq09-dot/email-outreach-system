// Detected Meetings Content - UI for AI-detected meeting requests

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, Video, Phone, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import type { Meeting } from "./types";

interface DetectedMeetingsContentProps {
    acceptedMeetings: Meeting[];
    pendingMeetings: Meeting[];
}

function getAppointmentIcon(type: string | null) {
    switch (type?.toLowerCase()) {
        case 'video_call': case 'video': return <Video className="w-4 h-4" />;
        case 'call': case 'phone': return <Phone className="w-4 h-4" />;
        default: return <Calendar className="w-4 h-4" />;
    }
}

function getAppointmentTypeLabel(type: string | null) {
    switch (type?.toLowerCase()) {
        case 'video_call': case 'video': return 'Video Call';
        case 'call': case 'phone': return 'Phone Call';
        default: return 'Meeting';
    }
}

export function DetectedMeetingsContent({ acceptedMeetings, pendingMeetings }: DetectedMeetingsContentProps) {
    if (!acceptedMeetings.length && !pendingMeetings.length) {
        return (
            <Card><CardContent className="py-12 text-center"><Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground" /><h3 className="text-lg font-semibold mb-2">No Detected Meetings</h3><p className="text-muted-foreground">When contacts request meetings via email replies, they'll appear here after AI detection.</p></CardContent></Card>
        );
    }

    return (
        <>
            {acceptedMeetings.length > 0 && (
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Accepted Meetings ({acceptedMeetings.length})</h3>
                    <div className="space-y-3">
                        {acceptedMeetings.map((meeting) => (
                            <Card key={meeting.id} data-testid={`meeting-card-${meeting.id}`}>
                                <CardHeader>
                                    <div className="flex items-start justify-between flex-wrap gap-2">
                                        <div className="space-y-1 flex-1">
                                            <div className="flex items-center gap-2">{getAppointmentIcon(meeting.appointmentType)}<CardTitle className="text-base">{getAppointmentTypeLabel(meeting.appointmentType)} with {meeting.contactName}</CardTitle></div>
                                            <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap"><span>{meeting.contactEmail}</span>{meeting.contactCompany && <><span>•</span><span>{meeting.contactCompany}</span></>}</div>
                                        </div>
                                        <Badge variant="default" className="bg-status-green hover-elevate">Accepted</Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {meeting.suggestedDate && <div className="flex items-center gap-2 text-sm"><Calendar className="w-4 h-4 text-muted-foreground" /><span>{format(new Date(meeting.suggestedDate), 'EEEE, MMMM d, yyyy')}</span></div>}
                                        {meeting.suggestedTime && <div className="flex items-center gap-2 text-sm"><Clock className="w-4 h-4 text-muted-foreground" /><span>{meeting.suggestedTime}{meeting.duration && ` (${meeting.duration} min)`}</span></div>}
                                        {meeting.location && <div className="flex items-center gap-2 text-sm md:col-span-2"><MapPin className="w-4 h-4 text-muted-foreground" /><span>{meeting.location}</span></div>}
                                    </div>
                                    {meeting.notes && <div className="text-sm"><div className="font-medium mb-1">Notes:</div><div className="text-muted-foreground">{meeting.notes}</div></div>}
                                    {meeting.rawEmailText && <div className="text-sm"><div className="font-medium mb-1">Original Request:</div><div className="text-muted-foreground italic border-l-2 border-border pl-3">{meeting.rawEmailText}</div></div>}
                                    {meeting.googleCalendarLink && (
                                        <div className="pt-2 border-t border-border">
                                            <Button variant="outline" size="sm" asChild data-testid={`button-view-calendar-${meeting.id}`}><a href={meeting.googleCalendarLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2"><ExternalLink className="w-4 h-4" />View in Google Calendar</a></Button>
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
                    <p className="text-sm text-muted-foreground">These meeting requests are awaiting your response. Visit the Inbox tab to accept or decline.</p>
                    <div className="space-y-3">
                        {pendingMeetings.map((meeting) => (
                            <Card key={meeting.id} data-testid={`pending-meeting-card-${meeting.id}`}>
                                <CardHeader>
                                    <div className="flex items-start justify-between flex-wrap gap-2">
                                        <div className="space-y-1 flex-1">
                                            <div className="flex items-center gap-2">{getAppointmentIcon(meeting.appointmentType)}<CardTitle className="text-base">{getAppointmentTypeLabel(meeting.appointmentType)} with {meeting.contactName}</CardTitle></div>
                                            <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap"><span>{meeting.contactEmail}</span>{meeting.contactCompany && <><span>•</span><span>{meeting.contactCompany}</span></>}</div>
                                        </div>
                                        <Badge variant="secondary">Pending</Badge>
                                    </div>
                                </CardHeader>
                                <CardContent>{meeting.rawEmailText && <div className="text-sm"><div className="text-muted-foreground italic border-l-2 border-border pl-3">{meeting.rawEmailText}</div></div>}</CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            )}
        </>
    );
}
