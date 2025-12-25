// Extraction Progress - Animated loading state during AI extraction

import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Globe, Search, Brain, CheckCircle2, XCircle, Zap, Building2 } from 'lucide-react';
import { useState, useEffect } from 'react';

interface ExtractionProgressProps {
    isLoading: boolean;
    error?: string;
}

export function ExtractionProgress({ isLoading, error }: ExtractionProgressProps) {
    const [currentStep, setCurrentStep] = useState(0);

    const steps = [
        { icon: Globe, label: 'Fetching website pages...', duration: 2000 },
        { icon: Zap, label: 'Deep AI analysis...', duration: 8000 },
        { icon: Brain, label: 'Extracting business details...', duration: 3000 },
        { icon: Building2, label: 'Enriching company data...', duration: 2000 },
        { icon: Search, label: 'Finalizing profile...', duration: 1000 },
    ];

    // Animate through steps
    useEffect(() => {
        if (!isLoading) return;

        let totalDelay = 0;
        const timers: NodeJS.Timeout[] = [];

        steps.forEach((step, index) => {
            const timer = setTimeout(() => {
                setCurrentStep(index);
            }, totalDelay);
            timers.push(timer);
            totalDelay += step.duration;
        });

        return () => timers.forEach(clearTimeout);
    }, [isLoading]);

    if (error) {
        return (
            <Card className="border-red-200 bg-red-50 dark:bg-red-900/20">
                <CardContent className="pt-6 text-center">
                    <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold mb-2">Extraction Failed</h2>
                    <p className="text-muted-foreground mb-4">{error}</p>
                    <p className="text-sm text-muted-foreground">
                        Please check your URL and try again, or proceed with manual entry
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardContent className="pt-8 pb-8">
                <div className="text-center mb-8">
                    <div className="relative inline-flex">
                        <div className="w-20 h-20 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                            <Brain className="w-10 h-10 text-violet-600 animate-pulse" />
                        </div>
                        <div className="absolute -inset-2 rounded-full border-4 border-violet-200 border-t-violet-600 animate-spin" />
                    </div>
                </div>

                <h2 className="text-xl font-bold text-center mb-2">
                    Analyzing Your Business
                </h2>
                <p className="text-muted-foreground text-center mb-8">
                    Our AI is researching your company using multiple sources...
                </p>

                <div className="space-y-3 max-w-sm mx-auto">
                    {steps.map((step, index) => {
                        const StepIcon = step.icon;
                        const isComplete = currentStep > index;
                        const isCurrent = currentStep === index && isLoading;

                        return (
                            <div
                                key={index}
                                className={`flex items-center gap-3 transition-opacity duration-300 ${index > currentStep ? 'opacity-40' : 'opacity-100'
                                    }`}
                            >
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isComplete ? 'bg-green-100 dark:bg-green-900/30' :
                                    isCurrent ? 'bg-violet-100 dark:bg-violet-900/30' :
                                        'bg-gray-100 dark:bg-gray-800'
                                    }`}>
                                    {isComplete ? (
                                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                                    ) : isCurrent ? (
                                        <Loader2 className="w-4 h-4 text-violet-600 animate-spin" />
                                    ) : (
                                        <StepIcon className="w-4 h-4 text-gray-400" />
                                    )}
                                </div>
                                <span className={`text-sm ${isCurrent ? 'font-medium text-violet-600' : ''}`}>
                                    {step.label}
                                </span>
                            </div>
                        );
                    })}
                </div>

                <p className="text-xs text-muted-foreground text-center mt-8">
                    ⚡ Optimized extraction - typically 5-10 seconds
                </p>
            </CardContent>
        </Card>
    );
}
