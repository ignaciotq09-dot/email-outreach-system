// Reply card component for displaying inbox replies

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
    Calendar,
    CheckCircle2,
    XCircle,
    Clock,
    Building2,
    User2,
    ExternalLink,
    CheckCheck,
    ArrowRight,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { Reply } from "./types";

export interface ReplyCardProps {
    reply: Reply;
    onAccept: (params: { appointmentId: number; replyId: number }) => void;
    onDecline: (params: { appointmentId: number; replyId: number }) => void;
    onMarkHandled: (replyId: number) => void;
    onMarkNew: (replyId: number) => void;
    isPending: boolean;
    variant: 'appointment' | 'new' | 'handled';
}

export function ReplyCard({ reply, onAccept, onDecline, onMarkHandled, onMarkNew, isPending, variant }: ReplyCardProps) {
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

                        {/* Appointment Badge */}
                        {reply.appointment && (
                            <AppointmentBadge appointment={reply.appointment} />
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
                    <ExpandedContent reply={reply} />
                )}
            </CardContent>
        </Card>
    );
}

// Appointment badge sub-component
function AppointmentBadge({ appointment }: { appointment: Reply['appointment'] }) {
    if (!appointment) return null;

    return (
        <div className="flex items-center gap-2 mt-2">
            {appointment.status === 'pending' ? (
                <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 gap-1">
                    <Calendar className="w-3 h-3" />
                    Meeting Request
                    {appointment.aiConfidence && (
                        <span className="opacity-70">({appointment.aiConfidence}% confidence)</span>
                    )}
                </Badge>
            ) : appointment.status === 'accepted' ? (
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
    );
}

// Expanded content sub-component
function ExpandedContent({ reply }: { reply: Reply }) {
    return (
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
    );
}
