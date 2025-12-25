// Gap Questions - Targeted follow-up questions for missing information

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
import { ArrowLeft, ArrowRight, HelpCircle, AlertCircle } from 'lucide-react';
import type { GapQuestion } from './types';

interface GapQuestionsProps {
    questions: GapQuestion[];
    onComplete: () => void;
    onBack: () => void;
}

export function GapQuestions({ questions, onComplete, onBack }: GapQuestionsProps) {
    const [answers, setAnswers] = useState<Record<string, any>>({});
    const [errors, setErrors] = useState<Record<string, string>>({});

    const saveMutation = useMutation({
        mutationFn: async (data: Record<string, any>) => {
            return apiRequest('POST', '/api/onboarding/company/gap-answers', { answers: data });
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

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};

        for (const question of questions) {
            if (question.required) {
                const value = answers[question.field];
                if (!value || (Array.isArray(value) && value.length === 0)) {
                    newErrors[question.field] = 'This field is required';
                }
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = () => {
        if (validate()) {
            saveMutation.mutate(answers);
        }
    };

    if (questions.length === 0) {
        // No gaps - skip this step
        onComplete();
        return null;
    }

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'critical': return 'border-l-red-500';
            case 'high': return 'border-l-orange-500';
            case 'medium': return 'border-l-yellow-500';
            default: return 'border-l-gray-300';
        }
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <HelpCircle className="w-5 h-5 text-violet-600" />
                        A Few More Questions
                    </CardTitle>
                    <CardDescription>
                        We couldn&apos;t find some information on your website. Help us fill in the gaps.
                    </CardDescription>
                </CardHeader>
            </Card>

            {questions.map((question) => (
                <Card key={question.id} className={`border-l-4 ${getPriorityColor(question.priority)}`}>
                    <CardContent className="pt-6">
                        <div className="space-y-3">
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
                                    placeholder="Enter your answer..."
                                    rows={3}
                                    className={errors[question.field] ? 'border-red-500' : ''}
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

                            {question.type === 'multi_select' && question.options && (
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
                                </div>
                            )}

                            {errors[question.field] && (
                                <p className="text-sm text-red-500 flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3" />
                                    {errors[question.field]}
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            ))}

            <div className="flex justify-between pt-4">
                <Button variant="ghost" onClick={onBack}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                </Button>
                <Button onClick={handleSubmit} disabled={saveMutation.isPending}>
                    {saveMutation.isPending ? 'Saving...' : 'Continue'}
                    <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
            </div>
        </div>
    );
}
