// Header components for inbox tab

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    RefreshCw, CheckCircle2, Phone, AlertTriangle,
    Settings2, Inbox, Wifi, WifiOff, HelpCircle, Zap, Clock,
} from "lucide-react";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatDistanceToNow } from "date-fns";
import { queryClient } from "@/lib/queryClient";
import { SyncedAgo } from "./hooks";
import type { MonitoringSettings, GmailOAuthStatus, AutoReplySettings } from "./types";

interface HeaderRowProps {
    needsAction: number;
    autoReplySettings: AutoReplySettings | undefined;
    toggleAutoReplyMutation: any;
    wsConnected: boolean;
    lastSyncedAt: Date | null;
    repliesFetching: boolean;
    scanMutation: any;
    settings: MonitoringSettings | undefined;
    gmailOAuthStatus: GmailOAuthStatus | undefined;
    editingPhone: boolean;
    setEditingPhone: (value: boolean) => void;
    phoneNumber: string;
    setPhoneNumber: (value: string) => void;
    updateSettingsMutation: any;
    toast: any;
}

export function HeaderRow({
    needsAction, autoReplySettings, toggleAutoReplyMutation, wsConnected, lastSyncedAt,
    repliesFetching, scanMutation, settings, gmailOAuthStatus, editingPhone, setEditingPhone,
    phoneNumber, setPhoneNumber, updateSettingsMutation, toast
}: HeaderRowProps) {
    return (
        <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Inbox className="w-5 h-5 text-primary" />
                </div>
                <div>
                    <h2 className="text-xl font-semibold text-foreground">Reply Command Center</h2>
                    <p className="text-xs text-muted-foreground">
                        {needsAction > 0 ? (
                            <span className="text-amber-600 dark:text-amber-400 font-medium">
                                {needsAction} item{needsAction !== 1 ? 's' : ''} need your attention
                            </span>
                        ) : "All caught up!"}
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-2">
                {/* Auto-Reply Toggle */}
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50 border border-border">
                    <div className="flex items-center gap-1.5">
                        <Zap className={`w-4 h-4 ${autoReplySettings?.enabled ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`} />
                        <Label htmlFor="auto-reply-toggle" className="text-sm font-medium cursor-pointer">Auto-Reply</Label>
                        <Tooltip delayDuration={0}>
                            <TooltipTrigger asChild>
                                <button type="button" className="text-muted-foreground hover:text-foreground transition-colors">
                                    <HelpCircle className="w-3.5 h-3.5" />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="max-w-xs p-3">
                                <p className="text-sm">When enabled, I automatically send your booking link to prospects who express interest in meeting.</p>
                            </TooltipContent>
                        </Tooltip>
                    </div>
                    <Switch
                        id="auto-reply-toggle"
                        checked={autoReplySettings?.enabled ?? false}
                        onCheckedChange={(enabled) => {
                            if (!autoReplySettings?.bookingLink && enabled) {
                                toast({ title: "Booking Link Required", description: "Please configure your booking link in Settings first", variant: "destructive" });
                                return;
                            }
                            toggleAutoReplyMutation.mutate(enabled);
                        }}
                        disabled={toggleAutoReplyMutation.isPending}
                    />
                </div>

                {/* Real-time Status */}
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    {wsConnected ? (
                        <span className="flex items-center gap-1 text-green-600 dark:text-green-400"><Wifi className="w-3 h-3" />Live</span>
                    ) : (
                        <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400"><WifiOff className="w-3 h-3" />Offline</span>
                    )}
                    {lastSyncedAt && <span className="border-l border-border pl-1.5"><SyncedAgo time={lastSyncedAt} /></span>}
                </div>

                {/* Buttons */}
                <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/inbox/replies'] })} disabled={repliesFetching} variant="outline" size="icon">
                    <RefreshCw className={`w-4 h-4 ${repliesFetching ? 'animate-spin' : ''}`} />
                </Button>
                <Button onClick={() => scanMutation.mutate()} disabled={scanMutation.isPending} size="sm">
                    <RefreshCw className={`w-4 h-4 mr-1.5 ${scanMutation.isPending ? 'animate-spin' : ''}`} />Deep Scan
                </Button>

                {/* Settings Popover */}
                <SettingsPopover
                    settings={settings}
                    gmailOAuthStatus={gmailOAuthStatus}
                    editingPhone={editingPhone}
                    setEditingPhone={setEditingPhone}
                    phoneNumber={phoneNumber}
                    setPhoneNumber={setPhoneNumber}
                    updateSettingsMutation={updateSettingsMutation}
                />
            </div>
        </div>
    );
}

// Settings popover component
interface SettingsPopoverProps {
    settings: MonitoringSettings | undefined;
    gmailOAuthStatus: GmailOAuthStatus | undefined;
    editingPhone: boolean;
    setEditingPhone: (value: boolean) => void;
    phoneNumber: string;
    setPhoneNumber: (value: string) => void;
    updateSettingsMutation: any;
}

function SettingsPopover({ settings, gmailOAuthStatus, editingPhone, setEditingPhone, phoneNumber, setPhoneNumber, updateSettingsMutation }: SettingsPopoverProps) {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="outline" size="icon"><Settings2 className="w-4 h-4" /></Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h4 className="font-medium">Monitoring Settings</h4>
                        {gmailOAuthStatus?.hasCustomOAuth ? (
                            <Badge variant="outline" className="text-green-600 border-green-600/50"><CheckCircle2 className="w-3 h-3 mr-1" />Gmail Connected</Badge>
                        ) : (
                            <Badge variant="outline" className="text-amber-600 border-amber-600/50"><AlertTriangle className="w-3 h-3 mr-1" />Connect Gmail</Badge>
                        )}
                    </div>
                    <div className="flex items-center justify-between">
                        <div><Label htmlFor="auto-scan" className="text-sm">Auto-scan</Label><p className="text-xs text-muted-foreground">Check every {settings?.scanIntervalMinutes || 30} min</p></div>
                        <Switch id="auto-scan" checked={settings?.enabled ?? false} onCheckedChange={(enabled) => updateSettingsMutation.mutate({ enabled })} />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-sm">SMS Alerts</Label>
                        {editingPhone ? (
                            <div className="flex gap-2">
                                <Input value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="+1 555-123-4567" className="h-8 text-sm" />
                                <Button size="sm" onClick={() => updateSettingsMutation.mutate({ smsPhoneNumber: phoneNumber })}>Save</Button>
                            </div>
                        ) : (
                            <div className="flex items-center justify-between text-sm cursor-pointer hover-elevate p-2 rounded-md" onClick={() => { setPhoneNumber(settings?.smsPhoneNumber || ""); setEditingPhone(true); }}>
                                <span className="flex items-center gap-2 text-muted-foreground"><Phone className="w-3.5 h-3.5" />{settings?.smsPhoneNumber || "Not set"}</span>
                                <span className="text-xs text-primary">Edit</span>
                            </div>
                        )}
                    </div>
                    {settings?.lastScanAt && (
                        <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                            <Clock className="w-3 h-3" />Last scan: {formatDistanceToNow(new Date(settings.lastScanAt), { addSuffix: true })}
                        </div>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}
