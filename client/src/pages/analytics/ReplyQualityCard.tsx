import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquare, ThumbsUp, ThumbsDown, Calendar, User, XCircle, HelpCircle, ArrowRight } from "lucide-react";
import type { ReplyQualityBreakdown, ReplyQualityTrend } from "./types";

interface ReplyQualityCardProps {
    quality: ReplyQualityBreakdown | undefined;
    trends: ReplyQualityTrend[] | undefined;
    isLoading: boolean;
}

const CLASSIFICATION_CONFIG = {
    positive: { label: "Positive", color: "bg-green-500", icon: ThumbsUp },
    meeting_request: { label: "Meeting Request", color: "bg-blue-500", icon: Calendar },
    question: { label: "Question", color: "bg-yellow-500", icon: HelpCircle },
    referral: { label: "Referral", color: "bg-purple-500", icon: ArrowRight },
    neutral: { label: "Neutral", color: "bg-gray-400", icon: MessageSquare },
    negative: { label: "Negative", color: "bg-red-500", icon: ThumbsDown },
    not_interested: { label: "Not Interested", color: "bg-orange-500", icon: XCircle },
    out_of_office: { label: "Out of Office", color: "bg-cyan-500", icon: User },
    unsubscribe: { label: "Unsubscribe", color: "bg-red-600", icon: XCircle },
};

export function ReplyQualityCard({ quality, trends, isLoading }: ReplyQualityCardProps) {
    if (isLoading) {
        return (
            <Card data-testid="reply-quality-card">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5" />
                        Reply Quality Analysis
                    </CardTitle>
                    <CardDescription>Understand the quality and sentiment of your replies</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <Skeleton key={i} className="h-10 w-full" />
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (!quality || !quality.hasEnoughData) {
        return (
            <Card data-testid="reply-quality-card">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5" />
                        Reply Quality Analysis
                    </CardTitle>
                    <CardDescription>Understand the quality and sentiment of your replies</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8 text-muted-foreground">
                        <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>Get at least 5 replies to see quality analysis</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Sort classifications by count
    const sortedClassifications = Object.entries(quality.byClassification)
        .filter(([_, count]) => count > 0)
        .sort(([, a], [, b]) => b - a);

    return (
        <Card data-testid="reply-quality-card">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Reply Quality Analysis
                </CardTitle>
                <CardDescription>
                    {quality.total} replies analyzed • {quality.positiveRate.toFixed(1)}% positive engagement
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Summary Metrics */}
                <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{quality.positiveRate.toFixed(1)}%</div>
                        <div className="text-xs text-muted-foreground">Positive Rate</div>
                    </div>
                    <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{quality.meetingRequestRate.toFixed(1)}%</div>
                        <div className="text-xs text-muted-foreground">Meeting Requests</div>
                    </div>
                    <div className="text-center p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
                        <div className="text-2xl font-bold text-red-600">{quality.unsubscribeRate.toFixed(1)}%</div>
                        <div className="text-xs text-muted-foreground">Unsubscribes</div>
                    </div>
                </div>

                {/* Classification Breakdown */}
                <div className="space-y-2">
                    <div className="text-sm font-medium mb-3">Reply Breakdown</div>
                    {sortedClassifications.map(([classification, count]) => {
                        const config = CLASSIFICATION_CONFIG[classification as keyof typeof CLASSIFICATION_CONFIG];
                        if (!config) return null;

                        const percentage = (count / quality.total) * 100;
                        const Icon = config.icon;

                        return (
                            <div key={classification} className="flex items-center gap-3">
                                <div className="w-8 flex justify-center">
                                    <Icon className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <div className="w-28 text-sm">{config.label}</div>
                                <div className="flex-1 bg-muted rounded-full h-3 overflow-hidden">
                                    <div
                                        className={`h-full ${config.color} transition-all duration-500`}
                                        style={{ width: `${percentage}%` }}
                                    />
                                </div>
                                <div className="w-16 text-right text-sm">
                                    <span className="font-medium">{count}</span>
                                    <span className="text-muted-foreground ml-1">({percentage.toFixed(0)}%)</span>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Recent Trend */}
                {trends && trends.length > 0 && (
                    <div className="pt-4 border-t">
                        <div className="text-sm font-medium mb-2">Recent 7-Day Trend</div>
                        <div className="flex items-end gap-1 h-16">
                            {trends.slice(-7).map((day, i) => {
                                const maxTotal = Math.max(...trends.slice(-7).map(t => t.total));
                                const height = maxTotal > 0 ? (day.total / maxTotal) * 100 : 0;
                                const positiveRatio = day.total > 0 ? ((day.positive + day.meetingRequest) / day.total) : 0;

                                return (
                                    <div key={i} className="flex-1 flex flex-col items-center">
                                        <div
                                            className={`w-full rounded-t transition-all duration-300 ${positiveRatio >= 0.5 ? 'bg-green-400' : 'bg-gray-300'}`}
                                            style={{ height: `${height}%`, minHeight: day.total > 0 ? '4px' : '0' }}
                                            title={`${day.date}: ${day.total} replies, ${(positiveRatio * 100).toFixed(0)}% positive`}
                                        />
                                        <div className="text-[10px] text-muted-foreground mt-1">
                                            {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 1)}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
