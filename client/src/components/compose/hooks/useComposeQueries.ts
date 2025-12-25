import { useQuery, useIsFetching } from "@tanstack/react-query";
import type { Campaign } from "@shared/schema";
import type { CampaignContactWithContact } from "../types";

export function useComposeQueries() {
  const { data: activeDraftCampaign, isLoading: isLoadingCampaign } = useQuery<Campaign>({
    queryKey: ['/api/campaigns/active-draft'],
    refetchOnWindowFocus: false,
  });

  const { data: campaignContactsData } = useQuery<CampaignContactWithContact[]>({
    queryKey: ['/api/campaigns', activeDraftCampaign?.id, 'contacts'],
    enabled: !!activeDraftCampaign?.id,
    refetchOnWindowFocus: true,
    staleTime: 0,
  });

  const isFetchingContacts = useIsFetching({
    queryKey: ['/api/campaigns', activeDraftCampaign?.id, 'contacts']
  }) > 0;

  const { data: personalizationData } = useQuery<{ exists: boolean; personalization: { variantDiversity?: number } }>({
    queryKey: ['/api/user/email-personalization'],
  });

  const { data: smsConfig } = useQuery<{ configured: boolean; userPhoneNumber: string | null }>({
    queryKey: ['/api/sms/configured'],
  });

  const smsEnabled = smsConfig?.configured ?? false;
  const variantDiversity = personalizationData?.personalization?.variantDiversity ?? 5;

  return {
    activeDraftCampaign,
    isLoadingCampaign,
    campaignContactsData,
    isFetchingContacts,
    smsEnabled,
    variantDiversity,
  };
}
