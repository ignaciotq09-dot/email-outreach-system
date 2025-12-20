import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowDown, ArrowUp, TrendingUp, TrendingDown, Clock, MessageSquare, Zap, Target } from "lucide-react";
import type { EngagementFunnelData, DropoffAnalysis, ReplyVelocityMetrics } from "./types";

interface EngagementFunnelCardProps {
    funnel: EngagementFunnelData | undefined;
    dropoff: DropoffAnalysis[] | undefined;
    velocity: ReplyVelocityMetrics | undefined;
    isLoading: boolean;
}

const FUNNEL_COLORS = {
    Sent: "bg-blue-500",
    Delivered: "bg-green-500",
    Opened: "bg-yellow-500",
    Clicked: "bg-orange-500",
    Replied: "bg-purple-500",
};

export function EngagementFunnelCard({ funnel, dropoff, velocity, isLoading }: EngagementFunnelCardProps) {
    if (isLoading) {
        return (
            <Card data-testid="engagement-funnel-card">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5" />
                        Engagement Funnel
                    </CardTitle>
                    <CardDescription>Track your email journey from send to reply</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <Skeleton key={i} className="h-10 w-full" />
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (!funnel || !funnel.hasEnoughData) {
        return (
            <Card data-testid="engagement-funnel-card">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5" />
                        Engagement Funnel
                    </CardTitle>
                    <CardDescription>Track your email journey from send to reply</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8 text-muted-foreground">
                        <Target className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>Send at least 10 emails to see funnel analytics</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    const maxCount = Math.max(...funnel.stages.map(s => s.count));

    return (
        <Card data-testid="engagement-funnel-card">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Engagement Funnel
                </CardTitle>
                <CardDescription>
                    {funnel.totalSent.toLocaleString()} emails tracked • {funnel.conversionRates.sentToReplied.toFixed(1)}% overall reply rate
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Funnel Visualization */}
                <div className="space-y-3">
                    {funnel.stages.map((stage, index) => {
                        const widthPercent = maxCount > 0 ? (stage.count / maxCount) * 100 : 0;
                        const colorClass = FUNNEL_COLORS[stage.stage as keyof typeof FUNNEL_COLORS] || "bg-gray-500";

                        return (
                            <div key={stage.stage} className="flex items-center gap-3">
                                <div className="w-20 text-sm font-medium text-right">{stage.stage}</div>
                                <div className="flex-1 relative h-8 bg-muted rounded-md overflow-hidden">
                                    <div
                                        className={`absolute inset-y-0 left-0 ${colorClass} transition-all duration-500 rounded-md`}
                                        style={{ width: `${widthPercent}%` }}
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center text-sm font-medium">
                                        {stage.count.toLocaleString()} ({stage.percentage.toFixed(1)}%)
                                    </div>
                                </div>
                                {index < funnel.stages.length - 1 && (
                                    <ArrowDown className="h-4 w-4 text-muted-foreground" />
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Conversion Rates */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-4 border-t">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{funnel.conversionRates.sentToOpened.toFixed(1)}%</div>
                        <div className="text-xs text-muted-foreground">Open Rate</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">{funnel.conversionRates.openedToClicked.toFixed(1)}%</div>
                        <div className="text-xs text-muted-foreground">Click Rate (of opened)</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">{funnel.conversionRates.openedToReplied.toFixed(1)}%</div>
                        <div className="text-xs text-muted-foreground">Reply Rate (of opened)</div>
                    </div>
                </div>

                {/* Reply Velocity */}
                {velocity && velocity.averageHoursToReply > 0 && (
                    <div className="pt-4 border-t">
                        <div className="flex items-center gap-2 mb-3">
                            <Clock className="h-4 w-4" />
                            <span className="font-medium">Reply Velocity</span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                            <div className="p-2 bg-muted rounded-md text-center">
                                <div className="font-bold">{velocity.averageHoursToReply.toFixed(1)}h</div>
                                <div className="text-xs text-muted-foreground">Avg Time</div>
                            </div>
                            <div className="p-2 bg-muted rounded-md text-center">
                                <div className="font-bold">{velocity.repliesByTimeframe.within1Hour}</div>
                                <div className="text-xs text-muted-foreground">Within 1h</div>
                            </div>
                            <div className="p-2 bg-muted rounded-md text-center">
                                <div className="font-bold">{velocity.repliesByTimeframe.within24Hours}</div>
                                <div className="text-xs text-muted-foreground">1-24h</div>
                            </div>
                            <div className="p-2 bg-muted rounded-md text-center">
                                <div className="font-bold">{velocity.repliesByTimeframe.after3Days}</div>
                                <div className="text-xs text-muted-foreground">After 3 days</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Top Dropoff Analysis */}
                {dropoff && dropoff.length > 0 && (
                    <div className="pt-4 border-t">
                        <div className="flex items-center gap-2 mb-3">
                            <TrendingDown className="h-4 w-4 text-red-500" />
                            <span className="font-medium">Biggest Drop-offs</span>
                        </div>
                        <div className="space-y-2">
                            {dropoff.slice(0, 2).map((d) => (
                                <div key={d.stage} className="p-3 bg-red-50 dark:bg-red-950/20 rounded-md">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="font-medium text-sm">{d.stage}</span>
                                        <Badge variant="destructive">{d.dropoffPercentage.toFixed(0)}% drop</Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground">{d.recommendation}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
