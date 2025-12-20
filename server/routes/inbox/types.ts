export interface InboxStats { total: number; needsAction: number; pendingMeetings: number; newReplies: number; meetings: number; handled: number; }
export interface ReplyWithAppointment { id: number; sentEmailId: number | null; replyReceivedAt: Date | null; replyContent: string | null; gmailMessageId: string | null; status: string; contact: any; sentEmail: any; appointment: any; }
