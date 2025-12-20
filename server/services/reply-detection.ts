// Re-export from modular structure for backward compatibility
export type { ReplyDetectionResult, ThreadCheckOptions } from "./reply-detection-utils/index";
export { isAutoReplyMessage, extractSenderEmail, emailsMatch, decodeBase64Url, extractMessageContent, stripQuotedContent, checkThreadForAuthenticReplies } from "./reply-detection-utils/index";
