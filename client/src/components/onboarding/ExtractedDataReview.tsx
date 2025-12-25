// Extracted Data Review - Validation cards with thumbs up/down

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ThumbsUp, ThumbsDown, ArrowLeft, ArrowRight, Building2, Package, Users, Lightbulb, MessageSquare, Edit2, Check, X } from 'lucide-react';
import type { CompanyProfile } from './types';

interface ExtractedDataReviewProps {
    data: Partial<CompanyProfile>;
    confidence: Record<string, number>;
    onComplete: () => void;
    onBack: () => void;
}

interface ValidationSection {
    id: string;
    title: string;
    icon: React.ReactNode;
    fields: { key: string; label: string; isArray?: boolean }[];
}

const sections: ValidationSection[] = [
    {
        id: 'business_identity',
        title: 'Business Identity',
        icon: <Building2 className="w-5 h-5" />,
        fields: [
            { key: 'companyName', label: 'Company Name' },
            { key: 'businessType', label: 'Business Type' },
            { key: 'industry', label: 'Industry' },
            { key: 'tagline', label: 'Tagline' },
            { key: 'businessDescription', label: 'Description' },
        ],
    },
    {
        id: 'products_services',
        title: 'Products & Services',
        icon: <Package className="w-5 h-5" />,
        fields: [
            { key: 'productsServices', label: 'Products/Services', isArray: true },
            { key: 'typicalDealSize', label: 'Typical Deal Size' },
        ],
    },
    {
        id: 'target_customers',
        title: 'Target Customers',
        icon: <Users className="w-5 h-5" />,
        fields: [
            { key: 'idealCustomerDescription', label: 'Ideal Customer' },
            { key: 'targetJobTitles', label: 'Target Job Titles', isArray: true },
            { key: 'targetIndustries', label: 'Target Industries', isArray: true },
        ],
    },
    {
        id: 'value_proposition',
        title: 'Value Proposition',
        icon: <Lightbulb className="w-5 h-5" />,
        fields: [
            { key: 'problemSolved', label: 'Problem Solved' },
            { key: 'uniqueDifferentiator', label: 'What Makes You Different' },
            { key: 'typicalResults', label: 'Typical Results' },
        ],
    },
    {
        id: 'brand_voice',
        title: 'Brand Voice',
        icon: <MessageSquare className="w-5 h-5" />,
        fields: [
            { key: 'brandPersonality', label: 'Brand Personality', isArray: true },
            { key: 'formalityLevel', label: 'Formality Level' },
        ],
    },
];

export function ExtractedDataReview({ data, confidence, onComplete, onBack }: ExtractedDataReviewProps) {
    const queryClient = useQueryClient();
    const [validatedSections, setValidatedSections] = useState<Record<string, boolean>>({});
    const [editingField, setEditingField] = useState<string | null>(null);
    const [editValue, setEditValue] = useState<string>('');
    const [corrections, setCorrections] = useState<Record<string, any>>({});

    // Validate field mutation - using apiRequest for proper CSRF handling
    const validateMutation = useMutation({
        mutationFn: async ({ field, isCorrect, correctedValue }: { field: string; isCorrect: boolean; correctedValue?: any }) => {
            return apiRequest('POST', '/api/onboarding/company/validate-field', { field, isCorrect, correctedValue });
        },
    });

    const handleThumbsUp = (sectionId: string) => {
        const section = sections.find(s => s.id === sectionId);
        section?.fields.forEach(field => {
            validateMutation.mutate({ field: field.key, isCorrect: true });
        });
        setValidatedSections(prev => ({ ...prev, [sectionId]: true }));
    };

    const handleThumbsDown = (sectionId: string, fieldKey: string) => {
        const currentValue = (data as any)[fieldKey];
        setEditingField(fieldKey);
        setEditValue(Array.isArray(currentValue) ? currentValue.join(', ') : (currentValue || ''));
    };

    const handleSaveEdit = (fieldKey: string, isArray: boolean) => {
        const value = isArray ? editValue.split(',').map(s => s.trim()).filter(Boolean) : editValue;
        setCorrections(prev => ({ ...prev, [fieldKey]: value }));
        validateMutation.mutate({ field: fieldKey, isCorrect: false, correctedValue: value });
        setEditingField(null);
        setEditValue('');
    };

    const handleCancelEdit = () => {
        setEditingField(null);
        setEditValue('');
    };

    const getValue = (key: string) => {
        return corrections[key] ?? (data as any)[key];
    };

    const getConfidenceColor = (score: number) => {
        if (score >= 80) return 'bg-green-100 text-green-800';
        if (score >= 50) return 'bg-yellow-100 text-yellow-800';
        return 'bg-red-100 text-red-800';
    };

    const allValidated = sections.every(s => validatedSections[s.id]);

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Review What We Found</CardTitle>
                    <CardDescription>
                        Validate each section with 👍 if correct, or 👎 to make corrections
                    </CardDescription>
                </CardHeader>
            </Card>

            {sections.map(section => {
                const hasData = section.fields.some(f => getValue(f.key));
                if (!hasData) return null;

                return (
                    <Card key={section.id} className={validatedSections[section.id] ? 'border-green-500' : ''}>
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    {section.icon}
                                    {section.title}
                                </CardTitle>
                                {!validatedSections[section.id] ? (
                                    <div className="flex gap-2">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="text-green-600 hover:bg-green-50"
                                            onClick={() => handleThumbsUp(section.id)}
                                        >
                                            <ThumbsUp className="w-4 h-4 mr-1" />
                                            Correct
                                        </Button>
                                    </div>
                                ) : (
                                    <Badge variant="outline" className="text-green-600 border-green-600">
                                        <Check className="w-3 h-3 mr-1" />
                                        Validated
                                    </Badge>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {section.fields.map(field => {
                                const value = getValue(field.key);
                                if (!value) return null;

                                const fieldConfidence = confidence[field.key] || 0;
                                const isEditing = editingField === field.key;

                                return (
                                    <div key={field.key} className="border rounded-lg p-3">
                                        <div className="flex items-start justify-between gap-2 mb-1">
                                            <span className="text-sm font-medium text-muted-foreground">{field.label}</span>
                                            <div className="flex items-center gap-2">
                                                <Badge variant="secondary" className={getConfidenceColor(fieldConfidence)}>
                                                    {fieldConfidence}% confident
                                                </Badge>
                                                {!validatedSections[section.id] && !isEditing && (
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="h-6 w-6 p-0 text-red-500 hover:bg-red-50"
                                                        onClick={() => handleThumbsDown(section.id, field.key)}
                                                    >
                                                        <Edit2 className="w-3 h-3" />
                                                    </Button>
                                                )}
                                            </div>
                                        </div>

                                        {isEditing ? (
                                            <div className="space-y-2">
                                                {field.isArray ? (
                                                    <Textarea
                                                        value={editValue}
                                                        onChange={(e) => setEditValue(e.target.value)}
                                                        placeholder="Enter values separated by commas"
                                                        rows={3}
                                                    />
                                                ) : (
                                                    <Input
                                                        value={editValue}
                                                        onChange={(e) => setEditValue(e.target.value)}
                                                    />
                                                )}
                                                <div className="flex gap-2">
                                                    <Button size="sm" onClick={() => handleSaveEdit(field.key, field.isArray || false)}>
                                                        <Check className="w-3 h-3 mr-1" />
                                                        Save
                                                    </Button>
                                                    <Button size="sm" variant="ghost" onClick={handleCancelEdit}>
                                                        <X className="w-3 h-3 mr-1" />
                                                        Cancel
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : field.isArray ? (
                                            <div className="flex flex-wrap gap-1">
                                                {(value as string[]).map((item: string, i: number) => (
                                                    <Badge key={i} variant="secondary">{item}</Badge>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-sm">{value as string}</p>
                                        )}
                                    </div>
                                );
                            })}
                        </CardContent>
                    </Card>
                );
            })}

            <div className="flex justify-between pt-4">
                <Button variant="ghost" onClick={onBack}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                </Button>
                <Button onClick={onComplete} disabled={!allValidated}>
                    {allValidated ? 'Continue' : 'Validate All Sections'}
                    <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
            </div>
        </div>
    );
}
