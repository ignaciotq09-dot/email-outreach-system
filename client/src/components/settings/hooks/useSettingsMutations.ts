import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function useSettingsMutations() {
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
    disconnectMutation, reconnectGmailMutation,
  };
}
