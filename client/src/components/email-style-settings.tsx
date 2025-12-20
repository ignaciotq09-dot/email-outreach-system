import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { 
  Sparkles, 
  Plus, 
  X, 
  Trash2, 
  Check, 
  Pencil,
  FileText,
  Wand2,
  MessageSquare,
  Settings2,
  Users,
  Brain,
  Loader2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { UserEmailPersonalization, UserEmailPersona, UserVoiceSample } from "@shared/schema";

interface PersonalizationResponse {
  exists: boolean;
  personalization: UserEmailPersonalization;
}

interface PersonasResponse {
  personas: UserEmailPersona[];
}

interface VoiceSamplesResponse {
  samples: UserVoiceSample[];
}

interface VoicePatternsResponse {
  hasPatterns: boolean;
  patterns: {
    averageSentenceLength: number;
    commonPhrases: string[];
    greetingStyle: string;
    closingStyle: string;
    punctuationStyle: string;
    formalityScore: number;
    warmthScore: number;
    keyCharacteristics: string[];
  } | null;
  samplesCount?: number;
}

const HELPER_PROMPTS = [
  "Write casually, like I'm texting a friend",
  "Be direct and get to the point quickly",
  "Use short sentences and simple words",
  "Always ask a question at the end",
  "Reference their company specifically",
  "Sound confident but not arrogant",
  "Keep emails under 100 words",
  "Use data and numbers when relevant",
];

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
  const [editingPersona, setEditingPersona] = useState<number | null>(null);
  const [newPersonaName, setNewPersonaName] = useState("");
  const [newPersonaDescription, setNewPersonaDescription] = useState("");
  const [newPersonaInstructions, setNewPersonaInstructions] = useState("");
  
  // Fetch personalization settings
  const { data: personalizationData, isLoading: loadingPersonalization } = useQuery<PersonalizationResponse>({
    queryKey: ['/api/user/email-personalization'],
  });
  
  // Fetch personas
  const { data: personasData, isLoading: loadingPersonas } = useQuery<PersonasResponse>({
    queryKey: ['/api/user/email-personas'],
  });
  
  // Fetch voice samples
  const { data: samplesData, isLoading: loadingSamples } = useQuery<VoiceSamplesResponse>({
    queryKey: ['/api/user/email-personalization/voice-samples'],
  });
  
  // Fetch voice patterns
  const { data: patternsData, isLoading: loadingPatterns } = useQuery<VoicePatternsResponse>({
    queryKey: ['/api/user/email-personalization/voice-patterns'],
  });
  
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
  
  // Save personalization mutation
  const savePersonalizationMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('PUT', '/api/user/email-personalization', {
        isEnabled,
        personalInstructions: personalInstructions || null,
        toneFormality,
        toneWarmth,
        toneDirectness,
        avoidWords,
        preferredWords,
        minEmailLength,
        maxEmailLength,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/email-personalization'] });
      toast({
        title: "Settings Saved",
        description: "Your email style preferences have been updated.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // Add voice sample mutation
  const addVoiceSampleMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('POST', '/api/user/email-personalization/voice-samples', {
        sampleText: newSampleText,
        context: newSampleContext || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/email-personalization/voice-samples'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user/email-personalization/voice-patterns'] });
      setNewSampleText("");
      setNewSampleContext("");
      toast({
        title: "Sample Added",
        description: "Your writing sample has been saved. AI will learn from it.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add sample.",
        variant: "destructive",
      });
    },
  });
  
  // Delete voice sample mutation
  const deleteVoiceSampleMutation = useMutation({
    mutationFn: async (sampleId: number) => {
      return await apiRequest('DELETE', `/api/user/email-personalization/voice-samples/${sampleId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/email-personalization/voice-samples'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user/email-personalization/voice-patterns'] });
      toast({
        title: "Sample Deleted",
        description: "The writing sample has been removed.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete sample.",
        variant: "destructive",
      });
    },
  });
  
  // Analyze voice samples mutation
  const analyzePatternsMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('POST', '/api/user/email-personalization/voice-samples/analyze-all', {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/email-personalization/voice-patterns'] });
      toast({
        title: "Analysis Complete",
        description: "Your writing patterns have been analyzed.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to analyze samples.",
        variant: "destructive",
      });
    },
  });
  
  // Create persona mutation
  const createPersonaMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('POST', '/api/user/email-personas', {
        name: newPersonaName,
        description: newPersonaDescription || undefined,
        instructions: newPersonaInstructions || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/email-personas'] });
      setNewPersonaName("");
      setNewPersonaDescription("");
      setNewPersonaInstructions("");
      toast({
        title: "Persona Created",
        description: "Your new email persona has been saved.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create persona.",
        variant: "destructive",
      });
    },
  });
  
  // Delete persona mutation
  const deletePersonaMutation = useMutation({
    mutationFn: async (personaId: number) => {
      return await apiRequest('DELETE', `/api/user/email-personas/${personaId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/email-personas'] });
      toast({
        title: "Persona Deleted",
        description: "The persona has been removed.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete persona.",
        variant: "destructive",
      });
    },
  });
  
  // Set default persona mutation
  const setDefaultPersonaMutation = useMutation({
    mutationFn: async (personaId: number) => {
      return await apiRequest('POST', `/api/user/email-personas/${personaId}/set-default`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/email-personas'] });
      toast({
        title: "Default Set",
        description: "This persona will be used by default.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to set default persona.",
        variant: "destructive",
      });
    },
  });
  
  // Helper functions
  const addAvoidWord = () => {
    if (newAvoidWord.trim() && !avoidWords.includes(newAvoidWord.trim().toLowerCase())) {
      setAvoidWords([...avoidWords, newAvoidWord.trim().toLowerCase()]);
      setNewAvoidWord("");
    }
  };
  
  const addPreferredWord = () => {
    if (newPreferredWord.trim() && !preferredWords.includes(newPreferredWord.trim().toLowerCase())) {
      setPreferredWords([...preferredWords, newPreferredWord.trim().toLowerCase()]);
      setNewPreferredWord("");
    }
  };
  
  const removeAvoidWord = (word: string) => {
    setAvoidWords(avoidWords.filter(w => w !== word));
  };
  
  const removePreferredWord = (word: string) => {
    setPreferredWords(preferredWords.filter(w => w !== word));
  };
  
  const addHelperPrompt = (prompt: string) => {
    if (personalInstructions) {
      setPersonalInstructions(personalInstructions + "\n" + prompt);
    } else {
      setPersonalInstructions(prompt);
    }
  };
  
  const getToneLabel = (value: number, type: string) => {
    if (type === "formality") {
      if (value <= 3) return "Casual";
      if (value <= 6) return "Balanced";
      return "Formal";
    }
    if (type === "warmth") {
      if (value <= 3) return "Neutral";
      if (value <= 6) return "Friendly";
      return "Very Warm";
    }
    if (type === "directness") {
      if (value <= 3) return "Subtle";
      if (value <= 6) return "Clear";
      return "Very Direct";
    }
    return String(value);
  };
  
  const characterCount = personalInstructions.length;
  const maxCharacters = 2000;
  
  const isLoading = loadingPersonalization || loadingPersonas || loadingSamples;
  
  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header with toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-violet-600 shadow-md">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-base font-semibold">AI Email Personalization</h3>
            <p className="text-sm text-muted-foreground">
              Teach AI to write emails in your unique voice
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="enable-personalization" className="text-sm text-muted-foreground">
            {isEnabled ? "Enabled" : "Disabled"}
          </Label>
          <Switch
            id="enable-personalization"
            checked={isEnabled}
            onCheckedChange={setIsEnabled}
            data-testid="switch-personalization-enabled"
          />
        </div>
      </div>
      
      <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
        <TabsList className="w-full justify-start">
          <TabsTrigger value="instructions" className="gap-2" data-testid="subtab-instructions">
            <MessageSquare className="w-4 h-4" />
            Instructions
          </TabsTrigger>
          <TabsTrigger value="voice" className="gap-2" data-testid="subtab-voice">
            <FileText className="w-4 h-4" />
            Voice Samples
          </TabsTrigger>
          <TabsTrigger value="tone" className="gap-2" data-testid="subtab-tone">
            <Settings2 className="w-4 h-4" />
            Tone & Style
          </TabsTrigger>
          <TabsTrigger value="personas" className="gap-2" data-testid="subtab-personas">
            <Users className="w-4 h-4" />
            Personas
          </TabsTrigger>
        </TabsList>
        
        {/* Instructions Tab */}
        <TabsContent value="instructions" className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="personal-instructions" className="text-sm font-medium">
              Your Writing Instructions
            </Label>
            <p className="text-sm text-muted-foreground">
              Tell AI exactly how you want your emails written. Be specific about your style, tone, and preferences.
            </p>
            <Textarea
              id="personal-instructions"
              value={personalInstructions}
              onChange={(e) => setPersonalInstructions(e.target.value)}
              placeholder="Example: Write casually like I'm texting a friend. Use short sentences. Always end with a question. Never use corporate jargon like 'synergy' or 'leverage'."
              className="min-h-[150px] resize-none"
              maxLength={maxCharacters}
              data-testid="textarea-instructions"
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{characterCount}/{maxCharacters} characters</span>
              {characterCount > maxCharacters * 0.9 && (
                <span className="text-status-yellow">Almost at limit</span>
              )}
            </div>
          </div>
          
          {/* Helper Prompts */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Quick Add Suggestions</Label>
            <div className="flex flex-wrap gap-2">
              {HELPER_PROMPTS.map((prompt, i) => (
                <Badge
                  key={i}
                  variant="outline"
                  className="cursor-pointer hover-elevate"
                  onClick={() => addHelperPrompt(prompt)}
                  data-testid={`badge-helper-prompt-${i}`}
                >
                  <Plus className="w-3 h-3 mr-1" />
                  {prompt}
                </Badge>
              ))}
            </div>
          </div>
          
          {/* Avoid/Prefer Words */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Words to Avoid</Label>
              <p className="text-xs text-muted-foreground">AI will never use these words</p>
              <div className="flex gap-2">
                <Input
                  value={newAvoidWord}
                  onChange={(e) => setNewAvoidWord(e.target.value)}
                  placeholder="e.g., synergy"
                  className="flex-1"
                  onKeyDown={(e) => e.key === 'Enter' && addAvoidWord()}
                  data-testid="input-avoid-word"
                />
                <Button size="icon" onClick={addAvoidWord} data-testid="button-add-avoid-word">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-1 min-h-[60px] p-2 border border-border rounded-md bg-muted/30">
                {avoidWords.map((word) => (
                  <Badge key={word} variant="secondary" className="gap-1">
                    {word}
                    <X 
                      className="w-3 h-3 cursor-pointer" 
                      onClick={() => removeAvoidWord(word)}
                    />
                  </Badge>
                ))}
                {avoidWords.length === 0 && (
                  <span className="text-xs text-muted-foreground">No words added</span>
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-medium">Preferred Words</Label>
              <p className="text-xs text-muted-foreground">AI will try to use these naturally</p>
              <div className="flex gap-2">
                <Input
                  value={newPreferredWord}
                  onChange={(e) => setNewPreferredWord(e.target.value)}
                  placeholder="e.g., awesome"
                  className="flex-1"
                  onKeyDown={(e) => e.key === 'Enter' && addPreferredWord()}
                  data-testid="input-preferred-word"
                />
                <Button size="icon" onClick={addPreferredWord} data-testid="button-add-preferred-word">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-1 min-h-[60px] p-2 border border-border rounded-md bg-muted/30">
                {preferredWords.map((word) => (
                  <Badge key={word} variant="secondary" className="gap-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200">
                    {word}
                    <X 
                      className="w-3 h-3 cursor-pointer" 
                      onClick={() => removePreferredWord(word)}
                    />
                  </Badge>
                ))}
                {preferredWords.length === 0 && (
                  <span className="text-xs text-muted-foreground">No words added</span>
                )}
              </div>
            </div>
          </div>
          
          <Button 
            onClick={() => savePersonalizationMutation.mutate()}
            disabled={savePersonalizationMutation.isPending}
            data-testid="button-save-instructions"
          >
            {savePersonalizationMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                Save Instructions
              </>
            )}
          </Button>
        </TabsContent>
        
        {/* Voice Samples Tab */}
        <TabsContent value="voice" className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Your Writing Samples</Label>
            <p className="text-sm text-muted-foreground">
              Paste examples of emails you've written. AI will analyze your style and learn to write like you.
            </p>
          </div>
          
          {/* Detected Patterns */}
          {patternsData?.hasPatterns && patternsData.patterns && (
            <Card className="bg-muted/30 border-purple-200 dark:border-purple-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Brain className="w-4 h-4 text-purple-600" />
                  Detected Writing Patterns
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  {patternsData.patterns.keyCharacteristics.map((char, i) => (
                    <Badge key={i} variant="outline" className="bg-purple-50 dark:bg-purple-900/20">
                      {char}
                    </Badge>
                  ))}
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>Average sentence: ~{Math.round(patternsData.patterns.averageSentenceLength)} words</p>
                  <p>Greeting style: {patternsData.patterns.greetingStyle}</p>
                  <p>Closing style: {patternsData.patterns.closingStyle}</p>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Existing Samples */}
          {samplesData?.samples && samplesData.samples.length > 0 && (
            <div className="space-y-2">
              {samplesData.samples.map((sample) => (
                <Card key={sample.id} className="bg-muted/20">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm line-clamp-3">{sample.sampleText}</p>
                        {sample.context && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Context: {sample.context}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteVoiceSampleMutation.mutate(sample.id)}
                        disabled={deleteVoiceSampleMutation.isPending}
                        data-testid={`button-delete-sample-${sample.id}`}
                      >
                        <Trash2 className="w-4 h-4 text-muted-foreground" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          
          {/* Add New Sample */}
          <div className="space-y-3 p-4 border border-dashed border-border rounded-lg">
            <Label className="text-sm font-medium">Add a New Sample</Label>
            <Textarea
              value={newSampleText}
              onChange={(e) => setNewSampleText(e.target.value)}
              placeholder="Paste an email you've written that represents your style..."
              className="min-h-[100px] resize-none"
              data-testid="textarea-new-sample"
            />
            <Input
              value={newSampleContext}
              onChange={(e) => setNewSampleContext(e.target.value)}
              placeholder="Context (optional): e.g., 'Cold outreach to VP of Sales'"
              data-testid="input-sample-context"
            />
            <div className="flex gap-2">
              <Button
                onClick={() => addVoiceSampleMutation.mutate()}
                disabled={!newSampleText || newSampleText.length < 50 || addVoiceSampleMutation.isPending}
                data-testid="button-add-sample"
              >
                {addVoiceSampleMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                Add Sample
              </Button>
              {samplesData?.samples && samplesData.samples.length > 0 && (
                <Button
                  variant="outline"
                  onClick={() => analyzePatternsMutation.mutate()}
                  disabled={analyzePatternsMutation.isPending}
                  data-testid="button-analyze-patterns"
                >
                  {analyzePatternsMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Wand2 className="w-4 h-4 mr-2" />
                  )}
                  Analyze Patterns
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {samplesData?.samples ? `${samplesData.samples.length}/5` : '0/5'} samples used • Minimum 50 characters
            </p>
          </div>
        </TabsContent>
        
        {/* Tone & Style Tab */}
        <TabsContent value="tone" className="space-y-6 mt-4">
          <div className="space-y-6">
            {/* Formality Slider */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Formality</Label>
                <Badge variant="outline" data-testid="badge-formality-value">
                  {getToneLabel(toneFormality, "formality")} ({toneFormality}/10)
                </Badge>
              </div>
              <Slider
                value={[toneFormality]}
                onValueChange={([val]) => setToneFormality(val)}
                min={1}
                max={10}
                step={1}
                className="w-full"
                data-testid="slider-formality"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Casual</span>
                <span>Balanced</span>
                <span>Formal</span>
              </div>
            </div>
            
            {/* Warmth Slider */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Warmth</Label>
                <Badge variant="outline" data-testid="badge-warmth-value">
                  {getToneLabel(toneWarmth, "warmth")} ({toneWarmth}/10)
                </Badge>
              </div>
              <Slider
                value={[toneWarmth]}
                onValueChange={([val]) => setToneWarmth(val)}
                min={1}
                max={10}
                step={1}
                className="w-full"
                data-testid="slider-warmth"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Neutral</span>
                <span>Friendly</span>
                <span>Very Warm</span>
              </div>
            </div>
            
            {/* Directness Slider */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Directness</Label>
                <Badge variant="outline" data-testid="badge-directness-value">
                  {getToneLabel(toneDirectness, "directness")} ({toneDirectness}/10)
                </Badge>
              </div>
              <Slider
                value={[toneDirectness]}
                onValueChange={([val]) => setToneDirectness(val)}
                min={1}
                max={10}
                step={1}
                className="w-full"
                data-testid="slider-directness"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Subtle</span>
                <span>Clear</span>
                <span>Very Direct</span>
              </div>
            </div>
            
            <Separator />
            
            {/* Email Length */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Email Length (words)</Label>
              <div className="flex items-center gap-4">
                <div className="flex-1 space-y-1">
                  <Label className="text-xs text-muted-foreground">Minimum</Label>
                  <Input
                    type="number"
                    value={minEmailLength}
                    onChange={(e) => setMinEmailLength(parseInt(e.target.value) || 30)}
                    min={20}
                    max={200}
                    data-testid="input-min-length"
                  />
                </div>
                <div className="flex-1 space-y-1">
                  <Label className="text-xs text-muted-foreground">Maximum</Label>
                  <Input
                    type="number"
                    value={maxEmailLength}
                    onChange={(e) => setMaxEmailLength(parseInt(e.target.value) || 150)}
                    min={50}
                    max={500}
                    data-testid="input-max-length"
                  />
                </div>
              </div>
            </div>
          </div>
          
          <Button 
            onClick={() => savePersonalizationMutation.mutate()}
            disabled={savePersonalizationMutation.isPending}
            data-testid="button-save-tone"
          >
            {savePersonalizationMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                Save Tone Settings
              </>
            )}
          </Button>
        </TabsContent>
        
        {/* Personas Tab */}
        <TabsContent value="personas" className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Email Personas</Label>
            <p className="text-sm text-muted-foreground">
              Create different writing styles for different contexts (cold outreach, follow-ups, partnerships, etc.)
            </p>
          </div>
          
          {/* Existing Personas */}
          {personasData?.personas && personasData.personas.length > 0 && (
            <div className="grid gap-3">
              {personasData.personas.map((persona) => (
                <Card key={persona.id} className={`${persona.isDefault ? 'border-purple-300 dark:border-purple-700 bg-purple-50/50 dark:bg-purple-900/20' : ''}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{persona.name}</h4>
                          {persona.isDefault && (
                            <Badge variant="secondary" className="text-xs">Default</Badge>
                          )}
                        </div>
                        {persona.description && (
                          <p className="text-sm text-muted-foreground mt-1">{persona.description}</p>
                        )}
                        {persona.instructions && (
                          <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                            {persona.instructions}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-1">
                        {!persona.isDefault && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDefaultPersonaMutation.mutate(persona.id)}
                            disabled={setDefaultPersonaMutation.isPending}
                            data-testid={`button-set-default-${persona.id}`}
                          >
                            Set Default
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deletePersonaMutation.mutate(persona.id)}
                          disabled={deletePersonaMutation.isPending || persona.isDefault}
                          data-testid={`button-delete-persona-${persona.id}`}
                        >
                          <Trash2 className="w-4 h-4 text-muted-foreground" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          
          {/* Create New Persona */}
          <div className="space-y-3 p-4 border border-dashed border-border rounded-lg">
            <Label className="text-sm font-medium">Create New Persona</Label>
            <Input
              value={newPersonaName}
              onChange={(e) => setNewPersonaName(e.target.value)}
              placeholder="Persona name (e.g., Cold Outreach, Follow-up, Partnership)"
              data-testid="input-persona-name"
            />
            <Input
              value={newPersonaDescription}
              onChange={(e) => setNewPersonaDescription(e.target.value)}
              placeholder="Short description (optional)"
              data-testid="input-persona-description"
            />
            <Textarea
              value={newPersonaInstructions}
              onChange={(e) => setNewPersonaInstructions(e.target.value)}
              placeholder="Specific instructions for this persona (optional)"
              className="min-h-[80px] resize-none"
              data-testid="textarea-persona-instructions"
            />
            <Button
              onClick={() => createPersonaMutation.mutate()}
              disabled={!newPersonaName || createPersonaMutation.isPending}
              data-testid="button-create-persona"
            >
              {createPersonaMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              Create Persona
            </Button>
            <p className="text-xs text-muted-foreground">
              {personasData?.personas ? `${personasData.personas.length}/10` : '0/10'} personas used
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
