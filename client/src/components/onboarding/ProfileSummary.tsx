// Profile Summary - Final review before completing onboarding

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Check, Building2, Package, Users, Lightbulb, MessageSquare, Loader2 } from 'lucide-react';
import type { CompanyProfile } from './types';

interface ProfileSummaryProps {
    onComplete: () => void;
    isSubmitting: boolean;
    onBack: () => void;
}

export function ProfileSummary({ onComplete, isSubmitting, onBack }: ProfileSummaryProps) {
    const { data, isLoading } = useQuery<{ profile: CompanyProfile }>({
        queryKey: ['/api/onboarding/company/profile'],
    });

    const profile = data?.profile;

    if (isLoading) {
        return (
            <Card>
                <CardContent className="pt-8 pb-8 flex justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        );
    }

    if (!profile) {
        return (
            <Card>
                <CardContent className="pt-6">
                    <p className="text-center text-muted-foreground">No profile data found</p>
                </CardContent>
            </Card>
        );
    }

    const renderArrayField = (value?: string[]) => {
        if (!value || value.length === 0) return <span className="text-muted-foreground">Not specified</span>;
        return (
            <div className="flex flex-wrap gap-1">
                {value.map((item, i) => (
                    <Badge key={i} variant="secondary">{item}</Badge>
                ))}
            </div>
        );
    };

    const renderField = (value?: string) => {
        if (!value) return <span className="text-muted-foreground">Not specified</span>;
        return <span>{value}</span>;
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Check className="w-5 h-5 text-green-500" />
                        Review Your Company Profile
                    </CardTitle>
                    <CardDescription>
                        Make sure everything looks correct before finishing
                    </CardDescription>
                </CardHeader>
            </Card>

            {/* Business Identity */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Building2 className="w-4 h-4" />
                        Business Identity
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="text-muted-foreground">Company Name:</span>
                            <p className="font-medium">{renderField(profile.companyName)}</p>
                        </div>
                        <div>
                            <span className="text-muted-foreground">Type:</span>
                            <p className="font-medium">{renderField(profile.businessType)}</p>
                        </div>
                        <div>
                            <span className="text-muted-foreground">Industry:</span>
                            <p className="font-medium">{renderField(profile.industry)}</p>
                        </div>
                        <div>
                            <span className="text-muted-foreground">Size:</span>
                            <p className="font-medium">{renderField(profile.employeeCount)}</p>
                        </div>
                    </div>
                    {profile.businessDescription && (
                        <div>
                            <span className="text-muted-foreground text-sm">Description:</span>
                            <p className="text-sm">{profile.businessDescription}</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Products & Services */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Package className="w-4 h-4" />
                        Products & Services
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {renderArrayField(profile.productsServices)}
                    {profile.typicalDealSize && (
                        <p className="text-sm mt-2">
                            <span className="text-muted-foreground">Typical deal size: </span>
                            {profile.typicalDealSize}
                        </p>
                    )}
                </CardContent>
            </Card>

            {/* Target Customers */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Target Customers
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    {profile.idealCustomerDescription && (
                        <p className="text-sm">{profile.idealCustomerDescription}</p>
                    )}
                    <div className="text-sm">
                        <span className="text-muted-foreground">Target job titles: </span>
                        {renderArrayField(profile.targetJobTitles)}
                    </div>
                    <div className="text-sm">
                        <span className="text-muted-foreground">Target company sizes: </span>
                        {renderArrayField(profile.targetCompanySizes)}
                    </div>
                </CardContent>
            </Card>

            {/* Value Proposition */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Lightbulb className="w-4 h-4" />
                        Value Proposition
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                    {profile.problemSolved && (
                        <div>
                            <span className="text-muted-foreground">Problem solved: </span>
                            <p>{profile.problemSolved}</p>
                        </div>
                    )}
                    {profile.uniqueDifferentiator && (
                        <div>
                            <span className="text-muted-foreground">What makes you different: </span>
                            <p>{profile.uniqueDifferentiator}</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Brand Voice */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <MessageSquare className="w-4 h-4" />
                        Brand Voice
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="text-sm">
                        <span className="text-muted-foreground">Personality: </span>
                        {renderArrayField(profile.brandPersonality)}
                    </div>
                    {profile.formalityLevel && (
                        <p className="text-sm">
                            <span className="text-muted-foreground">Formality: </span>
                            {profile.formalityLevel}
                        </p>
                    )}
                </CardContent>
            </Card>

            {/* Data source indicator */}
            <div className="text-center text-sm text-muted-foreground">
                <Badge variant="outline">
                    {profile.dataSource === 'ai_extracted' ? '🤖 AI-extracted data' :
                        profile.dataSource === 'hybrid' ? '🤖 + ✏️ AI + Manual corrections' :
                            '✏️ Manually entered data'}
                </Badge>
            </div>

            {/* Navigation */}
            <div className="flex justify-between pt-4">
                <Button variant="ghost" onClick={onBack}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                </Button>
                <Button onClick={onComplete} disabled={isSubmitting}>
                    {isSubmitting ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Completing...
                        </>
                    ) : (
                        <>
                            Complete Onboarding
                            <Check className="w-4 h-4 ml-2" />
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}
