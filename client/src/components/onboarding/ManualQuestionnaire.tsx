// Manual Questionnaire - Full 27-question form for companies without online presence

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, ArrowRight, Check, AlertCircle } from 'lucide-react';
import type { QuestionnaireSection, QuestionnaireQuestion } from './types';

interface ManualQuestionnaireProps {
    sections: QuestionnaireSection[];
    onComplete: () => void;
    onBack: () => void;
}

export function ManualQuestionnaire({ sections, onComplete, onBack }: ManualQuestionnaireProps) {
    const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, any>>({});
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [otherValues, setOtherValues] = useState<Record<string, string>>({});

    const currentSection = sections[currentSectionIndex];
    const isLastSection = currentSectionIndex === sections.length - 1;
    const isFirstSection = currentSectionIndex === 0;

    const saveMutation = useMutation({
        mutationFn: async (data: Record<string, any>) => {
            return apiRequest('POST', '/api/onboarding/company/manual-answers', { answers: data });
        },
        onSuccess: () => {
            onComplete();
        },
    });

    const handleChange = (field: string, value: any) => {
        setAnswers(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    const handleMultiSelect = (field: string, option: string, checked: boolean) => {
        const current = answers[field] || [];
        const updated = checked
            ? [...current, option]
            : current.filter((v: string) => v !== option);
        handleChange(field, updated);
    };

    const handleOtherChange = (field: string, value: string) => {
        setOtherValues(prev => ({ ...prev, [field]: value }));
    };

    const validateSection = (): boolean => {
        const newErrors: Record<string, string> = {};

        for (const question of currentSection.questions) {
            if (question.required) {
                const value = answers[question.field];
                if (!value || (typeof value === 'string' && !value.trim()) || (Array.isArray(value) && value.length === 0)) {
                    newErrors[question.field] = 'This field is required';
                }
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNext = () => {
        if (!validateSection()) return;

        if (isLastSection) {
            // Merge "Other" values into answers
            const finalAnswers = { ...answers };
            for (const [field, value] of Object.entries(otherValues)) {
                if (value.trim()) {
                    const current = finalAnswers[field] || [];
                    if (Array.isArray(current)) {
                        finalAnswers[field] = [...current.filter((v: string) => v !== 'Other'), value];
                    }
                }
            }
            saveMutation.mutate(finalAnswers);
        } else {
            setCurrentSectionIndex(prev => prev + 1);
        }
    };

    const handleBack = () => {
        if (isFirstSection) {
            onBack();
        } else {
            setCurrentSectionIndex(prev => prev - 1);
        }
    };

    const progress = ((currentSectionIndex + 1) / sections.length) * 100;

    const renderQuestion = (question: QuestionnaireQuestion) => {
        const hasError = !!errors[question.field];

        return (
            <div key={question.id} className="space-y-3">
                <Label className="text-base font-medium">
                    {question.question}
                    {question.required && <span className="text-red-500 ml-1">*</span>}
                </Label>

                {question.helpText && (
                    <p className="text-sm text-muted-foreground">{question.helpText}</p>
                )}

                {question.type === 'short_answer' && (
                    <Textarea
                        value={answers[question.field] || ''}
                        onChange={(e) => handleChange(question.field, e.target.value)}
                        placeholder={question.placeholder || 'Enter your answer...'}
                        rows={3}
                        className={hasError ? 'border-red-500' : ''}
                    />
                )}

                {question.type === 'single_select' && question.options && (
                    <RadioGroup
                        value={answers[question.field] || ''}
                        onValueChange={(value) => handleChange(question.field, value)}
                    >
                        {question.options.map((option) => (
                            <div key={option} className="flex items-center space-x-2">
                                <RadioGroupItem value={option} id={`${question.id}-${option}`} />
                                <Label htmlFor={`${question.id}-${option}`} className="font-normal cursor-pointer">
                                    {option}
                                </Label>
                            </div>
                        ))}
                    </RadioGroup>
                )}

                {(question.type === 'multi_select' || question.type === 'multi_select_with_other') && question.options && (
                    <div className="space-y-2">
                        {question.options.map((option) => (
                            <div key={option} className="flex items-center space-x-2">
                                <Checkbox
                                    id={`${question.id}-${option}`}
                                    checked={(answers[question.field] || []).includes(option)}
                                    onCheckedChange={(checked) => handleMultiSelect(question.field, option, checked as boolean)}
                                />
                                <Label htmlFor={`${question.id}-${option}`} className="font-normal cursor-pointer">
                                    {option}
                                </Label>
                            </div>
                        ))}
                        {question.type === 'multi_select_with_other' && (
                            <div className="flex items-center gap-2 mt-2">
                                <Checkbox
                                    id={`${question.id}-other`}
                                    checked={(answers[question.field] || []).includes('Other')}
                                    onCheckedChange={(checked) => handleMultiSelect(question.field, 'Other', checked as boolean)}
                                />
                                <Label htmlFor={`${question.id}-other`} className="font-normal">Other:</Label>
                                <Input
                                    value={otherValues[question.field] || ''}
                                    onChange={(e) => handleOtherChange(question.field, e.target.value)}
                                    placeholder="Specify..."
                                    className="flex-1"
                                    disabled={!(answers[question.field] || []).includes('Other')}
                                />
                            </div>
                        )}
                        {question.maxSelections && (
                            <p className="text-xs text-muted-foreground">
                                Select up to {question.maxSelections}
                            </p>
                        )}
                    </div>
                )}

                {hasError && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors[question.field]}
                    </p>
                )}
            </div>
        );
    };

    return (
        <div className="space-y-6">
            {/* Progress */}
            <div className="mb-6">
                <div className="flex justify-between text-sm text-muted-foreground mb-2">
                    <span>Section {currentSectionIndex + 1} of {sections.length}</span>
                    <span>{Math.round(progress)}% complete</span>
                </div>
                <Progress value={progress} className="h-2" />
            </div>

            {/* Section Header */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-xl">{currentSection.title}</CardTitle>
                    <CardDescription>{currentSection.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {currentSection.questions.map(renderQuestion)}
                </CardContent>
            </Card>

            {/* Navigation */}
            <div className="flex justify-between pt-4">
                <Button variant="ghost" onClick={handleBack}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    {isFirstSection ? 'Back' : 'Previous Section'}
                </Button>
                <Button onClick={handleNext} disabled={saveMutation.isPending}>
                    {saveMutation.isPending ? 'Saving...' : isLastSection ? 'Complete Questionnaire' : 'Next Section'}
                    {isLastSection ? <Check className="w-4 h-4 ml-2" /> : <ArrowRight className="w-4 h-4 ml-2" />}
                </Button>
            </div>
        </div>
    );
}
