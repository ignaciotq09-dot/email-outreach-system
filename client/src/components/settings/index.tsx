import { useState, useEffect } from "react";
import { useSettingsQueries } from "./hooks/useSettingsQueries";
import { useSettingsMutations } from "./hooks/useSettingsMutations";
import { EmailProviderSettings } from "./components/EmailProviderSettings";
import { SenderInfoSettings } from "./components/SenderInfoSettings";
import { SmsSettings } from "./components/SmsSettings";
import { LinkedInSettings } from "./components/LinkedInSettings";
import { NotificationSettings } from "./components/NotificationSettings";
import { AutoReplySettings } from "./components/AutoReplySettings";

export default function SettingsTab() {
  const [checkInterval, setCheckInterval] = useState("30");
  const [senderName, setSenderName] = useState("Ignacio Torres");
  const [senderPhone, setSenderPhone] = useState("786-572-4981");
  const [twilioPhoneNumber, setTwilioPhoneNumber] = useState("");
  const [autoReplyEnabled, setAutoReplyEnabled] = useState(false);
  const [bookingLink, setBookingLink] = useState("");
  const [customAutoReplyMessage, setCustomAutoReplyMessage] = useState("");
  const [notificationPhone, setNotificationPhone] = useState("");
  const [linkedinProfileUrl, setLinkedinProfileUrl] = useState("");
  const [linkedinDisplayName, setLinkedinDisplayName] = useState("");
  const [linkedinDailyConnectionLimit, setLinkedinDailyConnectionLimit] = useState(20);
  const [linkedinDailyMessageLimit, setLinkedinDailyMessageLimit] = useState(50);
  const [phantombusterApiKey, setPhantombusterApiKey] = useState("");
  const [phantombusterAutoConnectAgentId, setPhantombusterAutoConnectAgentId] = useState("");
  const [phantombusterMessageSenderAgentId, setPhantombusterMessageSenderAgentId] = useState("");
  const [isVerifyingPhantombuster, setIsVerifyingPhantombuster] = useState(false);
  const [extensionToken, setExtensionToken] = useState("");
  const [showExtensionToken, setShowExtensionToken] = useState(false);

  const queries = useSettingsQueries();
  const mutations = useSettingsMutations({
    setIsVerifyingPhantombuster, setPhantombusterApiKey, setPhantombusterAutoConnectAgentId,
    setPhantombusterMessageSenderAgentId, setExtensionToken, setShowExtensionToken,
  });

  useEffect(() => { if (queries.preferences) { setSenderName(queries.preferences.senderName || "Ignacio Torres"); setSenderPhone(queries.preferences.senderPhone || "786-572-4981"); } }, [queries.preferences]);
  useEffect(() => { if (queries.smsSettings?.twilioPhoneNumber) setTwilioPhoneNumber(queries.smsSettings.twilioPhoneNumber); }, [queries.smsSettings]);
  useEffect(() => { if (queries.autoReplySettings) { setAutoReplyEnabled(queries.autoReplySettings.enabled); setBookingLink(queries.autoReplySettings.bookingLink || ""); setCustomAutoReplyMessage(queries.autoReplySettings.customMessage || ""); } }, [queries.autoReplySettings]);
  useEffect(() => { if (queries.notificationSettings?.phone) setNotificationPhone(queries.notificationSettings.phone); }, [queries.notificationSettings]);
  useEffect(() => { if (queries.linkedinStatus) { setLinkedinProfileUrl(queries.linkedinStatus.profileUrl || ""); setLinkedinDisplayName(queries.linkedinStatus.displayName || ""); setLinkedinDailyConnectionLimit(queries.linkedinStatus.dailyConnectionLimit ?? 20); setLinkedinDailyMessageLimit(queries.linkedinStatus.dailyMessageLimit ?? 50); } }, [queries.linkedinStatus]);

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-2xl mx-auto p-6 space-y-8">
        <div><h2 className="text-lg font-semibold mb-6">Settings</h2></div>

        <EmailProviderSettings
          gmailStatus={queries.gmailStatus}
          outlookStatus={queries.outlookStatus}
          yahooStatus={queries.yahooStatus}
          disconnectPending={mutations.disconnectMutation.isPending}
          reconnectPending={mutations.reconnectGmailMutation.isPending}
          onConnectGmail={() => { window.location.href = '/api/connect/gmail'; }}
          onDisconnectGmail={() => mutations.disconnectMutation.mutate('gmail')}
          onReconnectGmail={() => mutations.reconnectGmailMutation.mutate()}
          onConnectOutlook={() => { window.location.href = '/api/connect/outlook'; }}
          onDisconnectOutlook={() => mutations.disconnectMutation.mutate('outlook')}
          onConnectYahoo={() => { window.location.href = '/api/connect/yahoo'; }}
          onDisconnectYahoo={() => mutations.disconnectMutation.mutate('yahoo')}
        />

        <SenderInfoSettings
          senderName={senderName}
          senderPhone={senderPhone}
          checkInterval={checkInterval}
          isSaving={mutations.saveSenderInfoMutation.isPending}
          onSenderNameChange={setSenderName}
          onSenderPhoneChange={setSenderPhone}
          onCheckIntervalChange={setCheckInterval}
          onSave={() => mutations.saveSenderInfoMutation.mutate({ senderName, senderPhone })}
        />

        <SmsSettings
          smsConfig={queries.smsConfig}
          twilioPhoneNumber={twilioPhoneNumber}
          isSaving={mutations.saveSmsSettingsMutation.isPending}
          onTwilioPhoneChange={setTwilioPhoneNumber}
          onSave={() => mutations.saveSmsSettingsMutation.mutate(twilioPhoneNumber)}
        />

        <LinkedInSettings
          linkedinStatus={queries.linkedinStatus}
          extensionStatus={queries.extensionStatus}
          linkedinProfileUrl={linkedinProfileUrl}
          linkedinDisplayName={linkedinDisplayName}
          linkedinDailyConnectionLimit={linkedinDailyConnectionLimit}
          linkedinDailyMessageLimit={linkedinDailyMessageLimit}
          extensionToken={extensionToken}
          showExtensionToken={showExtensionToken}
          connectPending={mutations.connectLinkedinMutation.isPending}
          disconnectPending={mutations.disconnectLinkedinMutation.isPending}
          savePending={mutations.saveLinkedinSettingsMutation.isPending}
          generateTokenPending={mutations.generateExtensionTokenMutation.isPending}
          disconnectExtensionPending={mutations.disconnectExtensionMutation.isPending}
          verifyExtensionPending={mutations.verifyExtensionMutation.isPending}
          onProfileUrlChange={setLinkedinProfileUrl}
          onDisplayNameChange={setLinkedinDisplayName}
          onConnectionLimitChange={setLinkedinDailyConnectionLimit}
          onMessageLimitChange={setLinkedinDailyMessageLimit}
          onConnect={() => mutations.connectLinkedinMutation.mutate({ linkedinProfileUrl, displayName: linkedinDisplayName })}
          onDisconnect={() => mutations.disconnectLinkedinMutation.mutate()}
          onSaveSettings={() => mutations.saveLinkedinSettingsMutation.mutate({ dailyConnectionLimit: linkedinDailyConnectionLimit, dailyMessageLimit: linkedinDailyMessageLimit })}
          onGenerateToken={() => mutations.generateExtensionTokenMutation.mutate()}
          onDisconnectExtension={() => mutations.disconnectExtensionMutation.mutate()}
          onVerifyExtension={() => mutations.verifyExtensionMutation.mutate()}
        />

        <NotificationSettings
          notificationSettings={queries.notificationSettings}
          notificationPhone={notificationPhone}
          isSaving={mutations.saveNotificationSettingsMutation.isPending}
          onPhoneChange={setNotificationPhone}
          onSave={() => mutations.saveNotificationSettingsMutation.mutate(notificationPhone)}
        />

        <AutoReplySettings
          autoReplyEnabled={autoReplyEnabled}
          bookingLink={bookingLink}
          customAutoReplyMessage={customAutoReplyMessage}
          autoReplyLogs={queries.autoReplyLogs}
          isSaving={mutations.saveAutoReplySettingsMutation.isPending}
          onEnabledChange={setAutoReplyEnabled}
          onBookingLinkChange={setBookingLink}
          onCustomMessageChange={setCustomAutoReplyMessage}
          onSave={() => mutations.saveAutoReplySettingsMutation.mutate({ enabled: autoReplyEnabled, bookingLink, customMessage: customAutoReplyMessage || undefined })}
        />
      </div>
    </div>
  );
}
