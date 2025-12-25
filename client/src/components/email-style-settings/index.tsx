// Email Style Settings - Main Entry Point
// Refactored into microarchitecture

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, FileText, MessageSquare, Settings2, Users, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

import type { PersonalizationResponse, PersonasResponse, VoiceSamplesResponse, VoicePatternsResponse } from "./types";
import { InstructionsTabContent, VoiceSamplesTabContent, ToneStyleTabContent, PersonasTabContent } from "./TabComponents";

export default function EmailStyleSettings() {
    const { toast } = useToast();
    const [activeSubTab, setActiveSubTab] = useState("instructions");

    // Local state for form fields
    const [isEnabled, setIsEnabled] = useState(true);
    const [personalInstructions, setPersonalInstructions] = useState("");
    const [toneFormality, setToneFormality] = useState(5);
    const [toneWarmth, setToneWarmth] = useState(5);
    const [toneDirectness, setToneDirectness] = useState(5);
    const [avoidWords, setAvoidWords] = useState<string[]>([]);
    const [preferredWords, setPreferredWords] = useState<string[]>([]);
    const [newAvoidWord, setNewAvoidWord] = useState("");
    const [newPreferredWord, setNewPreferredWord] = useState("");
    const [minEmailLength, setMinEmailLength] = useState(50);
    const [maxEmailLength, setMaxEmailLength] = useState(150);

    // Voice sample state
    const [newSampleText, setNewSampleText] = useState("");
    const [newSampleContext, setNewSampleContext] = useState("");

    // Persona state
    const [newPersonaName, setNewPersonaName] = useState("");
    const [newPersonaDescription, setNewPersonaDescription] = useState("");
    const [newPersonaInstructions, setNewPersonaInstructions] = useState("");

    // Queries
    const { data: personalizationData, isLoading: loadingPersonalization } = useQuery<PersonalizationResponse>({ queryKey: ['/api/user/email-personalization'] });
    const { data: personasData, isLoading: loadingPersonas } = useQuery<PersonasResponse>({ queryKey: ['/api/user/email-personas'] });
    const { data: samplesData, isLoading: loadingSamples } = useQuery<VoiceSamplesResponse>({ queryKey: ['/api/user/email-personalization/voice-samples'] });
    const { data: patternsData } = useQuery<VoicePatternsResponse>({ queryKey: ['/api/user/email-personalization/voice-patterns'] });

    // Update local state when data loads
    useEffect(() => {
        if (personalizationData?.personalization) {
            const p = personalizationData.personalization;
            setIsEnabled(p.isEnabled ?? true);
            setPersonalInstructions(p.personalInstructions || "");
            setToneFormality(p.toneFormality ?? 5);
            setToneWarmth(p.toneWarmth ?? 5);
            setToneDirectness(p.toneDirectness ?? 5);
            setAvoidWords(p.avoidWords || []);
            setPreferredWords(p.preferredWords || []);
            setMinEmailLength(p.minEmailLength ?? 50);
            setMaxEmailLength(p.maxEmailLength ?? 150);
        }
    }, [personalizationData]);

    // Mutations
    const savePersonalizationMutation = useMutation({
        mutationFn: async () => apiRequest('PUT', '/api/user/email-personalization', { isEnabled, personalInstructions: personalInstructions || null, toneFormality, toneWarmth, toneDirectness, avoidWords, preferredWords, minEmailLength, maxEmailLength }),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['/api/user/email-personalization'] }); toast({ title: "Settings Saved", description: "Your email style preferences have been updated." }); },
        onError: () => { toast({ title: "Error", description: "Failed to save settings.", variant: "destructive" }); },
    });

    const addVoiceSampleMutation = useMutation({
        mutationFn: async () => apiRequest('POST', '/api/user/email-personalization/voice-samples', { sampleText: newSampleText, context: newSampleContext || undefined }),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['/api/user/email-personalization/voice-samples'] }); queryClient.invalidateQueries({ queryKey: ['/api/user/email-personalization/voice-patterns'] }); setNewSampleText(""); setNewSampleContext(""); toast({ title: "Sample Added" }); },
        onError: (error: any) => { toast({ title: "Error", description: error.message || "Failed to add sample.", variant: "destructive" }); },
    });

    const deleteVoiceSampleMutation = useMutation({
        mutationFn: async (sampleId: number) => apiRequest('DELETE', `/api/user/email-personalization/voice-samples/${sampleId}`, {}),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['/api/user/email-personalization/voice-samples'] }); queryClient.invalidateQueries({ queryKey: ['/api/user/email-personalization/voice-patterns'] }); toast({ title: "Sample Deleted" }); },
        onError: () => { toast({ title: "Error", description: "Failed to delete sample.", variant: "destructive" }); },
    });

    const analyzePatternsMutation = useMutation({
        mutationFn: async () => apiRequest('POST', '/api/user/email-personalization/voice-samples/analyze-all', {}),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['/api/user/email-personalization/voice-patterns'] }); toast({ title: "Analysis Complete" }); },
        onError: () => { toast({ title: "Error", description: "Failed to analyze samples.", variant: "destructive" }); },
    });

    const createPersonaMutation = useMutation({
        mutationFn: async () => apiRequest('POST', '/api/user/email-personas', { name: newPersonaName, description: newPersonaDescription || undefined, instructions: newPersonaInstructions || undefined }),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['/api/user/email-personas'] }); setNewPersonaName(""); setNewPersonaDescription(""); setNewPersonaInstructions(""); toast({ title: "Persona Created" }); },
        onError: (error: any) => { toast({ title: "Error", description: error.message || "Failed to create persona.", variant: "destructive" }); },
    });

    const deletePersonaMutation = useMutation({
        mutationFn: async (personaId: number) => apiRequest('DELETE', `/api/user/email-personas/${personaId}`, {}),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['/api/user/email-personas'] }); toast({ title: "Persona Deleted" }); },
        onError: (error: any) => { toast({ title: "Error", description: error.message || "Failed to delete persona.", variant: "destructive" }); },
    });

    const setDefaultPersonaMutation = useMutation({
        mutationFn: async (personaId: number) => apiRequest('POST', `/api/user/email-personas/${personaId}/set-default`, {}),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['/api/user/email-personas'] }); toast({ title: "Default Set" }); },
        onError: () => { toast({ title: "Error", description: "Failed to set default persona.", variant: "destructive" }); },
    });

    // Helper functions
    const addAvoidWord = () => { if (newAvoidWord.trim() && !avoidWords.includes(newAvoidWord.trim().toLowerCase())) { setAvoidWords([...avoidWords, newAvoidWord.trim().toLowerCase()]); setNewAvoidWord(""); } };
    const addPreferredWord = () => { if (newPreferredWord.trim() && !preferredWords.includes(newPreferredWord.trim().toLowerCase())) { setPreferredWords([...preferredWords, newPreferredWord.trim().toLowerCase()]); setNewPreferredWord(""); } };
    const removeAvoidWord = (word: string) => setAvoidWords(avoidWords.filter(w => w !== word));
    const removePreferredWord = (word: string) => setPreferredWords(preferredWords.filter(w => w !== word));
    const addHelperPrompt = (prompt: string) => setPersonalInstructions(personalInstructions ? personalInstructions + "\n" + prompt : prompt);

    const characterCount = personalInstructions.length;
    const maxCharacters = 2000;
    const isLoading = loadingPersonalization || loadingPersonas || loadingSamples;

    if (isLoading) {
        return <Card><CardContent className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></CardContent></Card>;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-violet-600 shadow-md"><Sparkles className="h-5 w-5 text-white" /></div>
                    <div><h3 className="text-base font-semibold">AI Email Personalization</h3><p className="text-sm text-muted-foreground">Teach AI to write emails in your unique voice</p></div>
                </div>
                <div className="flex items-center gap-2">
                    <Label htmlFor="enable-personalization" className="text-sm text-muted-foreground">{isEnabled ? "Enabled" : "Disabled"}</Label>
                    <Switch id="enable-personalization" checked={isEnabled} onCheckedChange={setIsEnabled} data-testid="switch-personalization-enabled" />
                </div>
            </div>

            <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
                <TabsList className="w-full justify-start">
                    <TabsTrigger value="instructions" className="gap-2" data-testid="subtab-instructions"><MessageSquare className="w-4 h-4" />Instructions</TabsTrigger>
                    <TabsTrigger value="voice" className="gap-2" data-testid="subtab-voice"><FileText className="w-4 h-4" />Voice Samples</TabsTrigger>
                    <TabsTrigger value="tone" className="gap-2" data-testid="subtab-tone"><Settings2 className="w-4 h-4" />Tone & Style</TabsTrigger>
                    <TabsTrigger value="personas" className="gap-2" data-testid="subtab-personas"><Users className="w-4 h-4" />Personas</TabsTrigger>
                </TabsList>

                <TabsContent value="instructions" className="space-y-4 mt-4">
                    <InstructionsTabContent personalInstructions={personalInstructions} setPersonalInstructions={setPersonalInstructions} characterCount={characterCount} maxCharacters={maxCharacters} avoidWords={avoidWords} preferredWords={preferredWords} newAvoidWord={newAvoidWord} setNewAvoidWord={setNewAvoidWord} newPreferredWord={newPreferredWord} setNewPreferredWord={setNewPreferredWord} addAvoidWord={addAvoidWord} addPreferredWord={addPreferredWord} removeAvoidWord={removeAvoidWord} removePreferredWord={removePreferredWord} addHelperPrompt={addHelperPrompt} savePersonalizationMutation={savePersonalizationMutation} />
                </TabsContent>

                <TabsContent value="voice" className="space-y-4 mt-4">
                    <VoiceSamplesTabContent samplesData={samplesData} patternsData={patternsData} newSampleText={newSampleText} setNewSampleText={setNewSampleText} newSampleContext={newSampleContext} setNewSampleContext={setNewSampleContext} addVoiceSampleMutation={addVoiceSampleMutation} deleteVoiceSampleMutation={deleteVoiceSampleMutation} analyzePatternsMutation={analyzePatternsMutation} />
                </TabsContent>

                <TabsContent value="tone" className="space-y-6 mt-4">
                    <ToneStyleTabContent toneFormality={toneFormality} setToneFormality={setToneFormality} toneWarmth={toneWarmth} setToneWarmth={setToneWarmth} toneDirectness={toneDirectness} setToneDirectness={setToneDirectness} minEmailLength={minEmailLength} setMinEmailLength={setMinEmailLength} maxEmailLength={maxEmailLength} setMaxEmailLength={setMaxEmailLength} savePersonalizationMutation={savePersonalizationMutation} />
                </TabsContent>

                <TabsContent value="personas" className="space-y-4 mt-4">
                    <PersonasTabContent personasData={personasData} newPersonaName={newPersonaName} setNewPersonaName={setNewPersonaName} newPersonaDescription={newPersonaDescription} setNewPersonaDescription={setNewPersonaDescription} newPersonaInstructions={newPersonaInstructions} setNewPersonaInstructions={setNewPersonaInstructions} createPersonaMutation={createPersonaMutation} deletePersonaMutation={deletePersonaMutation} setDefaultPersonaMutation={setDefaultPersonaMutation} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
