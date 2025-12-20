import { useQuery } from "@tanstack/react-query";
import type { GmailStatus, ProviderStatus, Preferences, SmsConfig, SmsSettings, AutoReplySettings, NotificationSettings, PhantombusterStatus, ExtensionStatus, LinkedinStatus, AutoReplyLog } from "../types";

export function useSettingsQueries() {
  const gmailStatusQuery = useQuery<GmailStatus>({ queryKey: ['/api/connect/gmail/status'] });
  const outlookStatusQuery = useQuery<ProviderStatus>({ queryKey: ['/api/connect/outlook/status'] });
  const yahooStatusQuery = useQuery<ProviderStatus>({ queryKey: ['/api/connect/yahoo/status'] });
  const preferencesQuery = useQuery<Preferences>({ queryKey: ['/api/preferences'] });
  const smsConfigQuery = useQuery<SmsConfig>({ queryKey: ['/api/sms/configured'] });
  const smsSettingsQuery = useQuery<SmsSettings>({ queryKey: ['/api/sms/settings'] });
  const autoReplySettingsQuery = useQuery<AutoReplySettings>({ queryKey: ['/api/auto-reply/settings'] });
  const autoReplyLogsQuery = useQuery<{ logs: AutoReplyLog[] }>({ queryKey: ['/api/auto-reply/logs'] });
  const notificationSettingsQuery = useQuery<NotificationSettings>({ queryKey: ['/api/booking/notification-settings'] });
  const phantombusterStatusQuery = useQuery<PhantombusterStatus>({ queryKey: ['/api/linkedin/phantombuster/status'] });
  const extensionStatusQuery = useQuery<ExtensionStatus>({ queryKey: ['/api/linkedin/extension/status'] });
  const linkedinStatusQuery = useQuery<LinkedinStatus>({ queryKey: ['/api/linkedin/status'] });

  return {
    gmailStatus: gmailStatusQuery.data,
    outlookStatus: outlookStatusQuery.data,
    yahooStatus: yahooStatusQuery.data,
    preferences: preferencesQuery.data,
    smsConfig: smsConfigQuery.data,
    smsSettings: smsSettingsQuery.data,
    autoReplySettings: autoReplySettingsQuery.data,
    autoReplyLogs: autoReplyLogsQuery.data,
    notificationSettings: notificationSettingsQuery.data,
    phantombusterStatus: phantombusterStatusQuery.data,
    extensionStatus: extensionStatusQuery.data,
    linkedinStatus: linkedinStatusQuery.data,
    isLoading: gmailStatusQuery.isLoading || outlookStatusQuery.isLoading || yahooStatusQuery.isLoading || preferencesQuery.isLoading,
    gmailStatusLoading: gmailStatusQuery.isLoading,
    outlookStatusLoading: outlookStatusQuery.isLoading,
    yahooStatusLoading: yahooStatusQuery.isLoading,
  };
}
