import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface MutationHandlers {
  setIsVerifyingPhantombuster: (val: boolean) => void;
  setPhantombusterApiKey: (val: string) => void;
  setPhantombusterAutoConnectAgentId: (val: string) => void;
  setPhantombusterMessageSenderAgentId: (val: string) => void;
  setExtensionToken: (val: string) => void;
  setShowExtensionToken: (val: boolean) => void;
}

export function useSettingsMutations(handlers: MutationHandlers) {
  const { toast } = useToast();

  const saveSenderInfoMutation = useMutation({
    mutationFn: async (data: { senderName: string; senderPhone: string }) => apiRequest('POST', '/api/preferences/sender-info', data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['/api/preferences'] }); toast({ title: "Settings Saved", description: "Your sender information has been updated." }); },
    onError: () => { toast({ title: "Error", description: "Failed to save sender information.", variant: "destructive" }); },
  });

  const saveSmsSettingsMutation = useMutation({
    mutationFn: async (twilioPhoneNumber: string) => apiRequest('POST', '/api/sms/settings', { twilioPhoneNumber }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['/api/sms/settings'] }); queryClient.invalidateQueries({ queryKey: ['/api/sms/configured'] }); toast({ title: "SMS Settings Saved", description: "Your Twilio phone number has been updated." }); },
    onError: () => { toast({ title: "Error", description: "Failed to save SMS settings.", variant: "destructive" }); },
  });

  const saveAutoReplySettingsMutation = useMutation({
    mutationFn: async (data: { enabled: boolean; bookingLink: string; customMessage?: string }) => apiRequest('POST', '/api/auto-reply/settings', data),
    onSuccess: (_: any, vars: { enabled: boolean }) => { queryClient.invalidateQueries({ queryKey: ['/api/auto-reply/settings'] }); toast({ title: "AI Auto-Reply Settings Saved", description: vars.enabled ? "Auto-reply is now active." : "Auto-reply has been disabled." }); },
    onError: () => { toast({ title: "Error", description: "Failed to save auto-reply settings.", variant: "destructive" }); },
  });

  const saveNotificationSettingsMutation = useMutation({
    mutationFn: async (phone: string) => apiRequest('POST', '/api/booking/notification-settings', { phone }),
    onSuccess: (_: any, phone: string) => { queryClient.invalidateQueries({ queryKey: ['/api/booking/notification-settings'] }); toast({ title: "Notification Settings Saved", description: phone ? "You'll receive SMS notifications." : "SMS notifications disabled." }); },
    onError: () => { toast({ title: "Error", description: "Failed to save notification settings.", variant: "destructive" }); },
  });

  const connectLinkedinMutation = useMutation({
    mutationFn: async (data: { linkedinProfileUrl: string; displayName: string }) => apiRequest('POST', '/api/linkedin/connect', data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['/api/linkedin/status'] }); queryClient.invalidateQueries({ queryKey: ['/api/linkedin/configured'] }); toast({ title: "LinkedIn Connected", description: "Your LinkedIn account has been connected." }); },
    onError: () => { toast({ title: "Error", description: "Failed to connect LinkedIn account.", variant: "destructive" }); },
  });

  const disconnectLinkedinMutation = useMutation({
    mutationFn: async () => apiRequest('POST', '/api/linkedin/disconnect', {}),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['/api/linkedin/status'] }); queryClient.invalidateQueries({ queryKey: ['/api/linkedin/configured'] }); toast({ title: "LinkedIn Disconnected" }); },
    onError: () => { toast({ title: "Error", description: "Failed to disconnect LinkedIn.", variant: "destructive" }); },
  });

  const saveLinkedinSettingsMutation = useMutation({
    mutationFn: async (data: { dailyConnectionLimit: number; dailyMessageLimit: number }) => apiRequest('PATCH', '/api/linkedin/settings', data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['/api/linkedin/status'] }); toast({ title: "LinkedIn Settings Saved" }); },
    onError: () => { toast({ title: "Error", description: "Failed to save LinkedIn settings.", variant: "destructive" }); },
  });

  const connectPhantombusterMutation = useMutation({
    mutationFn: async (data: { apiKey: string; autoConnectAgentId?: string; messageSenderAgentId?: string }) => {
      handlers.setIsVerifyingPhantombuster(true);
      return apiRequest('POST', '/api/linkedin/phantombuster/connect', data);
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['/api/linkedin/phantombuster/status'] }); handlers.setPhantombusterApiKey(""); handlers.setPhantombusterAutoConnectAgentId(""); handlers.setPhantombusterMessageSenderAgentId(""); toast({ title: "Phantombuster Connected" }); },
    onError: (error: any) => { toast({ title: "Connection Failed", description: error.message || "Failed to connect Phantombuster.", variant: "destructive" }); },
    onSettled: () => { handlers.setIsVerifyingPhantombuster(false); },
  });

  const disconnectPhantombusterMutation = useMutation({
    mutationFn: async () => apiRequest('POST', '/api/linkedin/phantombuster/disconnect', {}),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['/api/linkedin/phantombuster/status'] }); toast({ title: "Phantombuster Disconnected" }); },
    onError: () => { toast({ title: "Error", description: "Failed to disconnect Phantombuster.", variant: "destructive" }); },
  });

  const generateExtensionTokenMutation = useMutation({
    mutationFn: async () => apiRequest('POST', '/api/linkedin/extension/generate-token', {}),
    onSuccess: (data: any) => { handlers.setExtensionToken(data.token); handlers.setShowExtensionToken(true); toast({ title: "Token Generated", description: "Copy this token into the browser extension." }); },
    onError: () => { toast({ title: "Error", description: "Failed to generate extension token.", variant: "destructive" }); },
  });

  const disconnectExtensionMutation = useMutation({
    mutationFn: async () => apiRequest('POST', '/api/linkedin/extension/disconnect', {}),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['/api/linkedin/extension/status'] }); queryClient.invalidateQueries({ queryKey: ['/api/linkedin/status'] }); handlers.setExtensionToken(""); handlers.setShowExtensionToken(false); toast({ title: "LinkedIn Disconnected" }); },
    onError: () => { toast({ title: "Error", description: "Failed to disconnect LinkedIn extension.", variant: "destructive" }); },
  });

  const verifyExtensionMutation = useMutation({
    mutationFn: async () => apiRequest('POST', '/api/linkedin/extension/verify', {}),
    onSuccess: (data: any) => { queryClient.invalidateQueries({ queryKey: ['/api/linkedin/extension/status'] }); toast({ title: data.valid ? "Session Valid" : "Session Expired", description: data.valid ? "Your LinkedIn session is active." : (data.error || "Please reconnect via the extension."), variant: data.valid ? "default" : "destructive" }); },
    onError: () => { toast({ title: "Error", description: "Failed to verify LinkedIn session.", variant: "destructive" }); },
  });

  const disconnectMutation = useMutation({
    mutationFn: async (provider: 'gmail' | 'outlook' | 'yahoo') => apiRequest('POST', `/api/connect/disconnect/${provider}`, {}),
    onSuccess: (_: any, provider: 'gmail' | 'outlook' | 'yahoo') => { queryClient.invalidateQueries({ queryKey: [`/api/connect/${provider}/status`] }); const name = provider === 'gmail' ? 'Gmail' : provider === 'outlook' ? 'Outlook' : 'Yahoo'; toast({ title: "Disconnected", description: `${name} has been disconnected.` }); },
    onError: (_: any, provider: 'gmail' | 'outlook' | 'yahoo') => { const name = provider === 'gmail' ? 'Gmail' : provider === 'outlook' ? 'Outlook' : 'Yahoo'; toast({ title: "Error", description: `Failed to disconnect ${name}.`, variant: "destructive" }); },
  });

  const reconnectGmailMutation = useMutation({
    mutationFn: async () => { const response = await apiRequest('POST', '/api/connect/gmail/reconnect', {}); return response.json(); },
    onSuccess: (data: { authUrl: string }) => { if (data.authUrl) window.location.href = data.authUrl; },
    onError: () => { toast({ title: "Error", description: "Failed to initiate Gmail reconnection.", variant: "destructive" }); },
  });

  return {
    saveSenderInfoMutation, saveSmsSettingsMutation, saveAutoReplySettingsMutation, saveNotificationSettingsMutation,
    connectLinkedinMutation, disconnectLinkedinMutation, saveLinkedinSettingsMutation,
    connectPhantombusterMutation, disconnectPhantombusterMutation,
    generateExtensionTokenMutation, disconnectExtensionMutation, verifyExtensionMutation,
    disconnectMutation, reconnectGmailMutation,
  };
}
