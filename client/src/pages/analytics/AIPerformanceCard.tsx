import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Brain, TrendingUp, TrendingDown, CheckCircle, XCircle, Zap, ArrowUp, ArrowDown } from "lucide-react";
import type { AIComparisonData, AIPredictionAccuracy, RuleEffectiveness, AIOptimizationROI } from "./types";

interface AIPerformanceCardProps {
    comparison: AIComparisonData | undefined;
    accuracy: AIPredictionAccuracy | undefined;
    rules: RuleEffectiveness[] | undefined;
    roi: AIOptimizationROI | undefined;
    isLoading: boolean;
}

export function AIPerformanceCard({ comparison, accuracy, rules, roi, isLoading }: AIPerformanceCardProps) {
    if (isLoading) {
        return (
            <Card data-testid="ai-performance-card">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Brain className="h-5 w-5" />
                        AI Optimization Performance
                    </CardTitle>
                    <CardDescription>How AI is improving your email performance</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <Skeleton key={i} className="h-16 w-full" />
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (!comparison || !comparison.hasEnoughData) {
        return (
            <Card data-testid="ai-performance-card">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Brain className="h-5 w-5" />
                        AI Optimization Performance
                    </CardTitle>
                    <CardDescription>How AI is improving your email performance</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8 text-muted-foreground">
                        <Brain className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>Use AI optimization on more emails to see performance data</p>
                        <p className="text-sm mt-2">Need at least 10 optimized and 10 non-optimized emails</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    const isPositiveLift = comparison.lift.replyRateLift > 0;

    return (
        <Card data-testid="ai-performance-card">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5" />
                    AI Optimization Performance
                </CardTitle>
                <CardDescription>
                    Comparing {comparison.optimized.totalSent.toLocaleString()} optimized vs {comparison.nonOptimized.totalSent.toLocaleString()} non-optimized emails
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Optimization Lift Summary */}
                <div className={`p-4 rounded-lg ${isPositiveLift ? 'bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800' : 'bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800'}`}>
                    <div className="flex items-center gap-2 mb-2">
                        {isPositiveLift ? (
                            <TrendingUp className="h-5 w-5 text-green-600" />
                        ) : (
                            <TrendingDown className="h-5 w-5 text-yellow-600" />
                        )}
                        <span className="font-semibold">
                            {isPositiveLift ? 'AI is boosting your performance!' : 'Room for improvement'}
                        </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{comparison.recommendation}</p>
                </div>

                {/* Comparison Metrics */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <div className="text-sm font-medium text-muted-foreground">AI Optimized</div>
                        <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-md space-y-1">
                            <div className="flex justify-between">
                                <span className="text-sm">Open Rate</span>
                                <span className="font-bold">{comparison.optimized.openRate.toFixed(1)}%</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm">Reply Rate</span>
                                <span className="font-bold">{comparison.optimized.replyRate.toFixed(1)}%</span>
                            </div>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="text-sm font-medium text-muted-foreground">Non-Optimized</div>
                        <div className="p-3 bg-gray-50 dark:bg-gray-950/20 rounded-md space-y-1">
                            <div className="flex justify-between">
                                <span className="text-sm">Open Rate</span>
                                <span className="font-bold">{comparison.nonOptimized.openRate.toFixed(1)}%</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm">Reply Rate</span>
                                <span className="font-bold">{comparison.nonOptimized.replyRate.toFixed(1)}%</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Lift Metrics */}
                <div className="grid grid-cols-3 gap-3 pt-4 border-t">
                    <div className="text-center">
                        <div className={`text-xl font-bold flex items-center justify-center gap-1 ${comparison.lift.openRateLift > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {comparison.lift.openRateLift > 0 ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                            {Math.abs(comparison.lift.openRateLift).toFixed(1)}%
                        </div>
                        <div className="text-xs text-muted-foreground">Open Rate Lift</div>
                    </div>
                    <div className="text-center">
                        <div className={`text-xl font-bold flex items-center justify-center gap-1 ${comparison.lift.replyRateLift > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {comparison.lift.replyRateLift > 0 ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                            {Math.abs(comparison.lift.replyRateLift).toFixed(1)}%
                        </div>
                        <div className="text-xs text-muted-foreground">Reply Rate Lift</div>
                    </div>
                    <div className="text-center">
                        <div className={`text-xl font-bold flex items-center justify-center gap-1 ${comparison.lift.clickRateLift > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {comparison.lift.clickRateLift > 0 ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                            {Math.abs(comparison.lift.clickRateLift).toFixed(1)}%
                        </div>
                        <div className="text-xs text-muted-foreground">Click Rate Lift</div>
                    </div>
                </div>

                {/* Prediction Accuracy */}
                {accuracy && accuracy.totalPredictions > 0 && (
                    <div className="pt-4 border-t">
                        <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-sm">AI Prediction Accuracy</span>
                            <Badge variant={accuracy.accuracyScore >= 70 ? "default" : accuracy.accuracyScore >= 50 ? "secondary" : "destructive"}>
                                {accuracy.accuracyScore}%
                            </Badge>
                        </div>
                        <Progress value={accuracy.accuracyScore} className="h-2" />
                        <p className="text-xs text-muted-foreground mt-1">
                            Based on {accuracy.totalPredictions} predictions
                        </p>
                    </div>
                )}

                {/* Top Rules */}
                {rules && rules.length > 0 && (
                    <div className="pt-4 border-t">
                        <div className="flex items-center gap-2 mb-3">
                            <Zap className="h-4 w-4" />
                            <span className="font-medium">Top Optimization Rules</span>
                        </div>
                        <div className="space-y-2">
                            {rules.slice(0, 3).map((rule) => (
                                <div key={rule.ruleName} className="flex items-center justify-between p-2 bg-muted rounded-md">
                                    <div>
                                        <div className="font-medium text-sm">{rule.ruleName}</div>
                                        <div className="text-xs text-muted-foreground">Applied {rule.timesApplied} times</div>
                                    </div>
                                    <Badge variant="outline" className="text-green-600">
                                        +{rule.avgReplyRateIncrease.toFixed(1)}% replies
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ROI Insights */}
                {roi && roi.topInsights.length > 0 && (
                    <div className="pt-4 border-t">
                        <div className="flex items-center gap-2 mb-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span className="font-medium">Key Insights</span>
                        </div>
                        <ul className="space-y-1 text-sm text-muted-foreground">
                            {roi.topInsights.map((insight, i) => (
                                <li key={i}>• {insight}</li>
                            ))}
                        </ul>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
