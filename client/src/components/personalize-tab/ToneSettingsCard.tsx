// Tone Settings Card component

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { getFormalityDescription, getWarmthDescription, getDirectnessDescription } from "@/lib/tone-descriptions";
import { getDiversityLabel } from "./types";

interface ToneSettingsCardProps {
    toneFormality: number;
    setToneFormality: (v: number) => void;
    toneWarmth: number;
    setToneWarmth: (v: number) => void;
    toneDirectness: number;
    setToneDirectness: (v: number) => void;
    variantDiversity: number;
    setVariantDiversity: (v: number) => void;
}

export function ToneSettingsCard({ toneFormality, setToneFormality, toneWarmth, setToneWarmth, toneDirectness, setToneDirectness, variantDiversity, setVariantDiversity }: ToneSettingsCardProps) {
    return (
        <Card>
            <CardHeader><CardTitle className="text-lg">Tone Settings</CardTitle><CardDescription>Fine-tune your email personality</CardDescription></CardHeader>
            <CardContent className="space-y-6">
                {/* Formality Slider */}
                <div>
                    <div className="flex justify-between mb-1"><span className="text-sm text-muted-foreground">Formality</span><span className="text-xs font-medium text-purple-600 dark:text-purple-400">{getFormalityDescription(toneFormality).name}</span></div>
                    <div className="flex items-center gap-3"><span className="text-xs text-muted-foreground w-12">Casual</span><Slider value={[toneFormality]} onValueChange={([v]) => setToneFormality(v)} min={1} max={10} step={1} className="flex-1" data-testid="slider-formality" /><span className="text-xs text-muted-foreground w-12 text-right">Formal</span></div>
                    <p className="text-xs text-muted-foreground mt-1 italic">"{getFormalityDescription(toneFormality).example}"</p>
                </div>

                {/* Warmth Slider */}
                <div>
                    <div className="flex justify-between mb-1"><span className="text-sm text-muted-foreground">Warmth</span><span className="text-xs font-medium text-purple-600 dark:text-purple-400">{getWarmthDescription(toneWarmth).name}</span></div>
                    <div className="flex items-center gap-3"><span className="text-xs text-muted-foreground w-12">Neutral</span><Slider value={[toneWarmth]} onValueChange={([v]) => setToneWarmth(v)} min={1} max={10} step={1} className="flex-1" data-testid="slider-warmth" /><span className="text-xs text-muted-foreground w-12 text-right">Warm</span></div>
                    <p className="text-xs text-muted-foreground mt-1 italic">"{getWarmthDescription(toneWarmth).example}"</p>
                </div>

                {/* Directness Slider */}
                <div>
                    <div className="flex justify-between mb-1"><span className="text-sm text-muted-foreground">Directness</span><span className="text-xs font-medium text-purple-600 dark:text-purple-400">{getDirectnessDescription(toneDirectness).name}</span></div>
                    <div className="flex items-center gap-3"><span className="text-xs text-muted-foreground w-12">Subtle</span><Slider value={[toneDirectness]} onValueChange={([v]) => setToneDirectness(v)} min={1} max={10} step={1} className="flex-1" data-testid="slider-directness" /><span className="text-xs text-muted-foreground w-12 text-right">Bold</span></div>
                    <p className="text-xs text-muted-foreground mt-1 italic">"{getDirectnessDescription(toneDirectness).example}"</p>
                </div>

                {/* Variant Diversity */}
                <div className="pt-4 border-t">
                    <div className="flex justify-between mb-2"><span className="text-sm font-medium">Variant Diversity</span><span className="text-xs text-muted-foreground">{variantDiversity}/10 · {getDiversityLabel(variantDiversity)}</span></div>
                    <p className="text-xs text-muted-foreground mb-3">How different should the 3 generated email variants be from each other?</p>
                    <div className="flex items-center gap-3"><span className="text-xs text-muted-foreground w-12">Similar</span><Slider value={[variantDiversity]} onValueChange={([v]) => setVariantDiversity(v)} min={1} max={10} step={1} className="flex-1" data-testid="slider-variant-diversity" /><span className="text-xs text-muted-foreground w-12 text-right">Different</span></div>
                </div>
            </CardContent>
        </Card>
    );
}

// Live Preview Card
interface LivePreviewCardProps {
    toneFormality: number;
    toneWarmth: number;
    toneDirectness: number;
}

export function LivePreviewCard({ toneFormality, toneWarmth, toneDirectness }: LivePreviewCardProps) {
    return (
        <Card className="border-dashed">
            <CardHeader className="pb-3"><CardTitle className="text-lg flex items-center gap-2">Live Preview</CardTitle><CardDescription>See how your settings affect email output</CardDescription></CardHeader>
            <CardContent>
                <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                    <div>
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Opening will sound like:</span>
                        <p className="text-sm mt-1">
                            {toneFormality <= 3 ? "Hey!" : toneFormality <= 6 ? `Hi [Name],` : "Dear [Name],"}{" "}
                            {toneWarmth >= 7 ? "Great to connect with you! " : ""}
                            {toneDirectness >= 7 ? "Quick question for you:" : toneDirectness >= 4 ? "I wanted to reach out because..." : "I hope this message finds you well. I've been thinking about..."}
                        </p>
                    </div>
                    <div className="border-t pt-3">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Closing will sound like:</span>
                        <p className="text-sm mt-1">
                            {toneDirectness >= 7 ? "Let me know?" : toneDirectness >= 4 ? "Would love to hear your thoughts." : "Whenever you have a moment, I'd appreciate hearing your perspective on this."}{" "}
                            {toneFormality <= 3 ? "Cheers!" : toneFormality <= 6 ? "Best," : "Best regards,"}
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
