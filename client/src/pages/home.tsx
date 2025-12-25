import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2, XCircle, LogOut, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import ComposeTabNew from "@/components/compose-tab-new";
import SentEmailsTab from "@/components/sent-emails-tab";
import InboxTab from "@/components/inbox-tab";
import SettingsTab from "@/components/settings";
import LeadFinderTab from "@/components/lead-finder";
import AnalyticsPage from "@/pages/analytics";
import PersonalizeTab from "@/components/personalize-tab";
import MeetingsTab from "@/components/meetings-tab";

export default function HomePage() {
  const [activeTab, setActiveTab] = useState("compose");

  // BULLETPROOF: Counter that signals compose tab to refresh contacts
  // Incremented when navigating back from Lead Finder after adding contacts
  // Resets to 0 on page reload (natural React state behavior)
  const [refreshContactsSignal, setRefreshContactsSignal] = useState(0);

  // Handler for when contacts are added in Lead Finder
  const handleContactsAdded = useCallback(() => {
    // Increment signal to trigger refresh in compose tab
    setRefreshContactsSignal(prev => prev + 1);
    // Navigate to compose tab
    setActiveTab("compose");
  }, []);
  const { user } = useAuth();
  const { data: gmailStatus } = useQuery<{ connected: boolean; email: string | null }>({
    queryKey: ['/api/connect/gmail/status'],
  });

  const gmailConnected = gmailStatus?.connected ?? false;
  const userEmail = gmailStatus?.email ?? "Not connected";

  const handleSignOut = async () => {
    await fetch('/api/logout', { method: 'POST', credentials: 'include' });
    window.location.href = '/';
  };

  const getUserInitials = () => {
    if (!user) return "U";
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user.firstName) {
      return user.firstName[0].toUpperCase();
    }
    if (user.email) {
      return user.email[0].toUpperCase();
    }
    return "U";
  };

  const getUserDisplayName = () => {
    if (!user) return "User";
    // Priority: firstName + lastName > name > firstName > email
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    if (user.name) {
      return user.name;
    }
    if (user.firstName) {
      return user.firstName;
    }
    return user.email || "User";
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-gray-50 to-purple-50 dark:from-gray-900 dark:to-purple-950">
      {/* Header - 60px height */}
      <header className="h-15 border-b border-purple-100 dark:border-purple-900 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-violet-600 shadow-md shadow-purple-200 dark:shadow-purple-900">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-lg font-semibold text-foreground">
            Email Outreach System
          </h1>
        </div>

        <div className="flex items-center gap-6">
          {/* Gmail Status */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {gmailConnected ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-status-green" data-testid="icon-gmail-connected" />
                <span data-testid="text-gmail-status">Connected to: {userEmail}</span>
              </>
            ) : (
              <>
                <XCircle className="w-4 h-4 text-status-red" data-testid="icon-gmail-disconnected" />
                <span data-testid="text-gmail-status">Gmail not connected</span>
              </>
            )}
          </div>

          {/* User Info */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8" data-testid="avatar-user">
                <AvatarImage src={user?.profileImageUrl || undefined} alt={getUserDisplayName()} />
                <AvatarFallback>{getUserInitials()}</AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium text-foreground" data-testid="text-user-name">
                {getUserDisplayName()}
              </span>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleSignOut}
              data-testid="button-sign-out"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Tab Navigation - 50px height */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="w-full h-12 rounded-none border-b border-purple-100 dark:border-purple-900 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm justify-start px-6">
          <TabsTrigger
            value="compose"
            className="data-[state=active]:border-b-2 data-[state=active]:border-purple-600 rounded-none text-gray-900 dark:text-gray-100 data-[state=inactive]:text-gray-600 dark:data-[state=inactive]:text-gray-400"
            data-testid="tab-compose"
          >
            Compose & Send
          </TabsTrigger>
          <TabsTrigger
            value="find-contacts"
            className="data-[state=active]:border-b-2 data-[state=active]:border-purple-600 rounded-none text-gray-900 dark:text-gray-100 data-[state=inactive]:text-gray-600 dark:data-[state=inactive]:text-gray-400"
            data-testid="tab-find-contacts"
          >
            Find Contacts
          </TabsTrigger>
          <TabsTrigger
            value="sent"
            className="data-[state=active]:border-b-2 data-[state=active]:border-purple-600 rounded-none text-gray-900 dark:text-gray-100 data-[state=inactive]:text-gray-600 dark:data-[state=inactive]:text-gray-400"
            data-testid="tab-sent"
          >
            Sent
          </TabsTrigger>
          <TabsTrigger
            value="inbox"
            className="data-[state=active]:border-b-2 data-[state=active]:border-purple-600 rounded-none text-gray-900 dark:text-gray-100 data-[state=inactive]:text-gray-600 dark:data-[state=inactive]:text-gray-400"
            data-testid="tab-inbox"
          >
            Inbox
          </TabsTrigger>
          <TabsTrigger
            value="meetings"
            className="data-[state=active]:border-b-2 data-[state=active]:border-purple-600 rounded-none text-gray-900 dark:text-gray-100 data-[state=inactive]:text-gray-600 dark:data-[state=inactive]:text-gray-400"
            data-testid="tab-meetings"
          >
            Meetings
          </TabsTrigger>
          <TabsTrigger
            value="analytics"
            className="data-[state=active]:border-b-2 data-[state=active]:border-purple-600 rounded-none text-gray-900 dark:text-gray-100 data-[state=inactive]:text-gray-600 dark:data-[state=inactive]:text-gray-400"
            data-testid="tab-analytics"
          >
            Analytics
          </TabsTrigger>
          <TabsTrigger
            value="personalize"
            className="data-[state=active]:border-b-2 data-[state=active]:border-purple-600 rounded-none text-gray-900 dark:text-gray-100 data-[state=inactive]:text-gray-600 dark:data-[state=inactive]:text-gray-400"
            data-testid="tab-personalize"
          >
            Personalize
          </TabsTrigger>
          <TabsTrigger
            value="settings"
            className="data-[state=active]:border-b-2 data-[state=active]:border-purple-600 rounded-none text-gray-900 dark:text-gray-100 data-[state=inactive]:text-gray-600 dark:data-[state=inactive]:text-gray-400"
            data-testid="tab-settings"
          >
            Settings
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-hidden">
          {/* Compose and Find Contacts use forceMount to preserve state when switching tabs */}
          <TabsContent value="compose" className="h-full m-0 p-0 overflow-auto data-[state=inactive]:hidden" forceMount>
            <ComposeTabNew
              onNavigateToLeadFinder={() => setActiveTab("find-contacts")}
              refreshContactsSignal={refreshContactsSignal}
            />
          </TabsContent>

          <TabsContent value="find-contacts" className="h-full m-0 p-0 data-[state=inactive]:hidden" forceMount>
            <LeadFinderTab onContactsAdded={handleContactsAdded} />
          </TabsContent>

          <TabsContent value="sent" className="h-full m-0 p-0">
            {activeTab === "sent" && <SentEmailsTab />}
          </TabsContent>

          <TabsContent value="inbox" className="h-full m-0 p-0">
            {activeTab === "inbox" && <InboxTab />}
          </TabsContent>

          <TabsContent value="meetings" className="h-full m-0 p-0">
            {activeTab === "meetings" && <MeetingsTab />}
          </TabsContent>

          <TabsContent value="analytics" className="h-full m-0 p-0">
            {activeTab === "analytics" && <AnalyticsPage />}
          </TabsContent>

          <TabsContent value="personalize" className="h-full m-0 p-0">
            {activeTab === "personalize" && <PersonalizeTab />}
          </TabsContent>

          <TabsContent value="settings" className="h-full m-0 p-0">
            {activeTab === "settings" && <SettingsTab />}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
