// Online Presence Input - Form for entering website and Instagram

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Globe, Instagram, ArrowLeft, ArrowRight, AlertCircle } from 'lucide-react';

interface OnlinePresenceInputProps {
    onSubmit: (websiteUrl: string, instagramHandle?: string) => void;
    onBack: () => void;
}

export function OnlinePresenceInput({ onSubmit, onBack }: OnlinePresenceInputProps) {
    const [websiteUrl, setWebsiteUrl] = useState('');
    const [instagramHandle, setInstagramHandle] = useState('');
    const [errors, setErrors] = useState<{ website?: string; instagram?: string }>({});

    const validateUrl = (url: string): boolean => {
        if (!url) return false;
        try {
            const normalized = url.startsWith('http') ? url : `https://${url}`;
            new URL(normalized);
            return true;
        } catch {
            return false;
        }
    };

    const validateInstagram = (handle: string): boolean => {
        if (!handle) return true; // Optional
        const cleanHandle = handle.replace('@', '').trim();
        return /^[a-zA-Z0-9._]{1,30}$/.test(cleanHandle);
    };

    const handleSubmit = () => {
        const newErrors: { website?: string; instagram?: string } = {};

        if (!websiteUrl.trim()) {
            newErrors.website = 'Website URL is required';
        } else if (!validateUrl(websiteUrl)) {
            newErrors.website = 'Please enter a valid URL';
        }

        if (instagramHandle && !validateInstagram(instagramHandle)) {
            newErrors.instagram = 'Please enter a valid Instagram handle';
        }

        setErrors(newErrors);

        if (Object.keys(newErrors).length === 0) {
            onSubmit(websiteUrl, instagramHandle || undefined);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Globe className="w-5 h-5 text-violet-600" />
                    Enter Your Website
                </CardTitle>
                <CardDescription>
                    We&apos;ll analyze your website to understand your business
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Website URL */}
                <div className="space-y-2">
                    <Label htmlFor="website" className="flex items-center gap-2">
                        <Globe className="w-4 h-4" />
                        Website URL <span className="text-red-500">*</span>
                    </Label>
                    <Input
                        id="website"
                        type="url"
                        placeholder="https://yourcompany.com"
                        value={websiteUrl}
                        onChange={(e) => setWebsiteUrl(e.target.value)}
                        className={errors.website ? 'border-red-500' : ''}
                    />
                    {errors.website && (
                        <p className="text-sm text-red-500 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            {errors.website}
                        </p>
                    )}
                </div>

                {/* Instagram Handle */}
                <div className="space-y-2">
                    <Label htmlFor="instagram" className="flex items-center gap-2">
                        <Instagram className="w-4 h-4" />
                        Instagram Handle <span className="text-muted-foreground text-xs">(optional but recommended)</span>
                    </Label>
                    <div className="flex">
                        <span className="inline-flex items-center px-3 bg-muted border border-r-0 rounded-l-md text-muted-foreground">
                            @
                        </span>
                        <Input
                            id="instagram"
                            type="text"
                            placeholder="yourcompany"
                            value={instagramHandle}
                            onChange={(e) => setInstagramHandle(e.target.value.replace('@', ''))}
                            className={`rounded-l-none ${errors.instagram ? 'border-red-500' : ''}`}
                        />
                    </div>
                    {errors.instagram && (
                        <p className="text-sm text-red-500 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            {errors.instagram}
                        </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                        Adding Instagram helps us understand your brand voice and communication style
                    </p>
                </div>

                {/* Navigation */}
                <div className="flex justify-between pt-4">
                    <Button variant="ghost" onClick={onBack}>
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back
                    </Button>
                    <Button onClick={handleSubmit}>
                        Analyze My Business
                        <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
