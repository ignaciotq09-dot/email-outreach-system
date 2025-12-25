// Personalize Tab - Main Entry Point
// Refactored into microarchitecture

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { PERSONALIZATION_PRESETS } from "@/lib/personalization-presets";
import { Sparkles, Save, CheckCircle2, AlertCircle, Plus, Wand2 } from "lucide-react";

import { ToneSettingsCard, LivePreviewCard } from "./ToneSettingsCard";
import { QUICK_ADD_SUGGESTIONS, type PersonalizationSettings } from "./types";

export default function PersonalizeTab() {
    const { toast } = useToast();
    const [personalInstructions, setPersonalInstructions] = useState("");
    const [favoriteEmailSamples, setFavoriteEmailSamples] = useState("");
    const [toneFormality, setToneFormality] = useState(5);
    const [toneWarmth, setToneWarmth] = useState(5);
    const [toneDirectness, setToneDirectness] = useState(5);
    const [variantDiversity, setVariantDiversity] = useState(5);
    const [isEnabled, setIsEnabled] = useState(true);
    const [activeStyleTab, setActiveStyleTab] = useState<'style' | 'examples'>('style');

    const { data: settingsData } = useQuery<{ exists: boolean; personalization: PersonalizationSettings }>({ queryKey: ["/api/user/email-personalization"] });

    useEffect(() => {
        if (settingsData?.personalization) {
            const p = settingsData.personalization;
            setPersonalInstructions(p.personalInstructions || "");
            setFavoriteEmailSamples(p.favoriteEmailSamples || "");
            setToneFormality(p.toneFormality);
            setToneWarmth(p.toneWarmth);
            setToneDirectness(p.toneDirectness);
            setVariantDiversity(p.variantDiversity ?? 5);
            setIsEnabled(p.isEnabled);
        }
    }, [settingsData]);

    const saveSettingsMutation = useMutation({
        mutationFn: async () => apiRequest("PUT", "/api/user/email-personalization", { personalInstructions: personalInstructions || null, favoriteEmailSamples: favoriteEmailSamples || null, toneFormality, toneWarmth, toneDirectness, variantDiversity, isEnabled }),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/user/email-personalization"] }); toast({ title: "Settings Saved", description: "Your AI writing preferences have been updated." }); },
        onError: () => { toast({ title: "Error", description: "Failed to save settings.", variant: "destructive" }); },
    });

    const handleAddSuggestion = (suggestion: string) => { if (!personalInstructions.includes(suggestion)) setPersonalInstructions(personalInstructions.trim() ? personalInstructions.trim() + ". " + suggestion : suggestion); };
    const isSuggestionAdded = (suggestion: string) => personalInstructions.toLowerCase().includes(suggestion.toLowerCase());

    const applyPreset = (preset: typeof PERSONALIZATION_PRESETS[0]) => {
        setToneFormality(preset.toneFormality); setToneWarmth(preset.toneWarmth); setToneDirectness(preset.toneDirectness); setVariantDiversity(preset.variantDiversity);
        if (preset.suggestedInstructions && !personalInstructions.trim()) setPersonalInstructions(preset.suggestedInstructions);
        toast({ title: `Applied "${preset.name}" preset`, description: "Tone settings updated. Feel free to customize further." });
    };

    return (
        <div className="h-full overflow-auto p-6">
            <div className="max-w-3xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div><h1 className="text-2xl font-bold flex items-center gap-2" data-testid="text-personalize-title"><Sparkles className="w-6 h-6 text-purple-500" />AI Personalization</h1><p className="text-muted-foreground mt-1">Tell the AI how you want your emails written</p></div>
                    <div className="flex items-center gap-2"><Switch checked={isEnabled} onCheckedChange={setIsEnabled} data-testid="switch-personalization-enabled" /><Label className="text-sm">{isEnabled ? <span className="text-green-600 dark:text-green-400 flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Active</span> : <span className="text-muted-foreground flex items-center gap-1"><AlertCircle className="w-4 h-4" /> Disabled</span>}</Label></div>
                </div>

                {/* Writing Style Card */}
                <div className="relative">
                    <div className="flex items-end gap-0 pl-2">
                        <button onClick={() => setActiveStyleTab('style')} className={`relative px-4 py-2 text-sm font-medium rounded-t-lg transition-all ${activeStyleTab === 'style' ? 'bg-card text-foreground border border-b-0 border-border z-10' : 'bg-muted/50 text-muted-foreground border border-b-0 border-transparent hover:bg-muted/80'}`} style={activeStyleTab === 'style' ? { marginBottom: '-1px' } : {}} data-testid="tab-writing-style">Your Writing Style</button>
                        <button onClick={() => setActiveStyleTab('examples')} className={`relative px-4 py-2 text-sm font-medium rounded-t-lg transition-all ${activeStyleTab === 'examples' ? 'bg-card text-foreground border border-b-0 border-border z-10' : 'bg-muted/50 text-muted-foreground border border-b-0 border-transparent hover:bg-muted/80'}`} style={activeStyleTab === 'examples' ? { marginBottom: '-1px' } : {}} data-testid="tab-email-examples">Email Examples (Optional)</button>
                    </div>
                    <Card className="rounded-tl-none">
                        <CardContent className="pt-6">
                            {activeStyleTab === 'style' ? (
                                <div className="space-y-6">
                                    <div><p className="text-sm text-muted-foreground mb-3">Describe how you want your emails to sound</p><Textarea placeholder="Example: Write casually like I'm talking to a friend. Keep sentences short. Never use corporate buzzwords. Start with something personal before getting to the point." value={personalInstructions} onChange={(e) => setPersonalInstructions(e.target.value)} className="min-h-[120px] resize-none" maxLength={2000} data-testid="textarea-ai-instructions" /><div className="text-xs text-muted-foreground text-right mt-2">{personalInstructions.length}/2000 characters</div></div>
                                    <div className="space-y-3"><Label className="text-sm font-medium">Quick Add</Label><div className="flex flex-wrap gap-2">{QUICK_ADD_SUGGESTIONS.map((suggestion) => { const isAdded = isSuggestionAdded(suggestion); return <Badge key={suggestion} variant={isAdded ? "secondary" : "outline"} className={`cursor-pointer transition-all text-xs ${isAdded ? "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800" : "hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:border-purple-300 dark:hover:border-purple-700"}`} onClick={() => !isAdded && handleAddSuggestion(suggestion)} data-testid={`badge-suggestion-${suggestion.slice(0, 20).replace(/\s+/g, '-').toLowerCase()}`}>{!isAdded && <Plus className="w-3 h-3 mr-1" />}{suggestion}</Badge>; })}</div></div>
                                </div>
                            ) : (
                                <div className="space-y-3"><p className="text-sm text-muted-foreground">Paste 1-2 emails you've written that you really like. The AI will learn from your actual writing patterns.</p><Textarea placeholder="Paste an email you've written that represents your style..." value={favoriteEmailSamples} onChange={(e) => setFavoriteEmailSamples(e.target.value)} className="min-h-[200px] resize-none" maxLength={5000} data-testid="textarea-favorite-samples" /><div className="flex justify-between text-xs text-muted-foreground"><span>Helps AI match your authentic voice</span><span>{favoriteEmailSamples.length}/5000 characters</span></div></div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Quick Presets */}
                <Card>
                    <CardHeader className="pb-3"><CardTitle className="text-lg flex items-center gap-2"><Wand2 className="w-5 h-5 text-purple-500" />Quick Presets</CardTitle><CardDescription>Start with a template, then customize</CardDescription></CardHeader>
                    <CardContent><div className="grid grid-cols-2 md:grid-cols-4 gap-2">{PERSONALIZATION_PRESETS.map((preset) => <Button key={preset.id} variant="outline" className="h-auto py-3 px-3 flex flex-col items-center gap-1 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:border-purple-300 dark:hover:border-purple-700 transition-all" onClick={() => applyPreset(preset)} data-testid={`preset-${preset.id}`}><span className="text-xl">{preset.icon}</span><span className="text-xs font-medium">{preset.name}</span></Button>)}</div></CardContent>
                </Card>

                {/* Tone Settings */}
                <ToneSettingsCard toneFormality={toneFormality} setToneFormality={setToneFormality} toneWarmth={toneWarmth} setToneWarmth={setToneWarmth} toneDirectness={toneDirectness} setToneDirectness={setToneDirectness} variantDiversity={variantDiversity} setVariantDiversity={setVariantDiversity} />

                {/* Live Preview */}
                <LivePreviewCard toneFormality={toneFormality} toneWarmth={toneWarmth} toneDirectness={toneDirectness} />

                {/* Save Button */}
                <div className="flex justify-end pb-6"><Button onClick={() => saveSettingsMutation.mutate()} disabled={saveSettingsMutation.isPending} size="lg" data-testid="button-save-personalization"><Save className="w-4 h-4 mr-2" />{saveSettingsMutation.isPending ? "Saving..." : "Save Settings"}</Button></div>
            </div>
        </div>
    );
}
