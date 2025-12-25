// Tab content components for email style settings

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Plus, X, Trash2, Check, Wand2, Brain, Loader2 } from "lucide-react";
import { HELPER_PROMPTS, getToneLabel } from "./types";
import type { VoiceSamplesResponse, VoicePatternsResponse, PersonasResponse } from "./types";

// Instructions Tab Content Component
export function InstructionsTabContent({ personalInstructions, setPersonalInstructions, characterCount, maxCharacters, avoidWords, preferredWords, newAvoidWord, setNewAvoidWord, newPreferredWord, setNewPreferredWord, addAvoidWord, addPreferredWord, removeAvoidWord, removePreferredWord, addHelperPrompt, savePersonalizationMutation }: any) {
    return (
        <>
            <div className="space-y-2">
                <Label htmlFor="personal-instructions" className="text-sm font-medium">Your Writing Instructions</Label>
                <p className="text-sm text-muted-foreground">Tell AI exactly how you want your emails written.</p>
                <Textarea id="personal-instructions" value={personalInstructions} onChange={(e) => setPersonalInstructions(e.target.value)} placeholder="Example: Write casually like I'm texting a friend..." className="min-h-[150px] resize-none" maxLength={maxCharacters} data-testid="textarea-instructions" />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{characterCount}/{maxCharacters} characters</span>
                    {characterCount > maxCharacters * 0.9 && <span className="text-status-yellow">Almost at limit</span>}
                </div>
            </div>

            <div className="space-y-2">
                <Label className="text-sm font-medium">Quick Add Suggestions</Label>
                <div className="flex flex-wrap gap-2">
                    {HELPER_PROMPTS.map((prompt, i) => (
                        <Badge key={i} variant="outline" className="cursor-pointer hover-elevate" onClick={() => addHelperPrompt(prompt)} data-testid={`badge-helper-prompt-${i}`}>
                            <Plus className="w-3 h-3 mr-1" />{prompt}
                        </Badge>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <WordListEditor label="Words to Avoid" description="AI will never use these words" words={avoidWords} newWord={newAvoidWord} setNewWord={setNewAvoidWord} addWord={addAvoidWord} removeWord={removeAvoidWord} testIdPrefix="avoid" />
                <WordListEditor label="Preferred Words" description="AI will try to use these naturally" words={preferredWords} newWord={newPreferredWord} setNewWord={setNewPreferredWord} addWord={addPreferredWord} removeWord={removePreferredWord} testIdPrefix="preferred" isPreferred />
            </div>

            <Button onClick={() => savePersonalizationMutation.mutate()} disabled={savePersonalizationMutation.isPending} data-testid="button-save-instructions">
                {savePersonalizationMutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : <><Check className="w-4 h-4 mr-2" />Save Instructions</>}
            </Button>
        </>
    );
}

// Word List Editor Component
function WordListEditor({ label, description, words, newWord, setNewWord, addWord, removeWord, testIdPrefix, isPreferred }: any) {
    return (
        <div className="space-y-2">
            <Label className="text-sm font-medium">{label}</Label>
            <p className="text-xs text-muted-foreground">{description}</p>
            <div className="flex gap-2">
                <Input value={newWord} onChange={(e) => setNewWord(e.target.value)} placeholder={`e.g., ${isPreferred ? 'awesome' : 'synergy'}`} className="flex-1" onKeyDown={(e) => e.key === 'Enter' && addWord()} data-testid={`input-${testIdPrefix}-word`} />
                <Button size="icon" onClick={addWord} data-testid={`button-add-${testIdPrefix}-word`}><Plus className="w-4 h-4" /></Button>
            </div>
            <div className="flex flex-wrap gap-1 min-h-[60px] p-2 border border-border rounded-md bg-muted/30">
                {words.map((word: string) => (
                    <Badge key={word} variant="secondary" className={`gap-1 ${isPreferred ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200' : ''}`}>
                        {word}<X className="w-3 h-3 cursor-pointer" onClick={() => removeWord(word)} />
                    </Badge>
                ))}
                {words.length === 0 && <span className="text-xs text-muted-foreground">No words added</span>}
            </div>
        </div>
    );
}

// Voice Samples Tab Content Component
export function VoiceSamplesTabContent({ samplesData, patternsData, newSampleText, setNewSampleText, newSampleContext, setNewSampleContext, addVoiceSampleMutation, deleteVoiceSampleMutation, analyzePatternsMutation }: { samplesData: VoiceSamplesResponse | undefined; patternsData: VoicePatternsResponse | undefined;[key: string]: any }) {
    return (
        <>
            <div className="space-y-2">
                <Label className="text-sm font-medium">Your Writing Samples</Label>
                <p className="text-sm text-muted-foreground">Paste examples of emails you've written. AI will analyze your style.</p>
            </div>

            {patternsData?.hasPatterns && patternsData.patterns && (
                <Card className="bg-muted/30 border-purple-200 dark:border-purple-800">
                    <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Brain className="w-4 h-4 text-purple-600" />Detected Writing Patterns</CardTitle></CardHeader>
                    <CardContent className="space-y-2">
                        <div className="flex flex-wrap gap-2">{patternsData.patterns.keyCharacteristics.map((char: string, i: number) => <Badge key={i} variant="outline" className="bg-purple-50 dark:bg-purple-900/20">{char}</Badge>)}</div>
                        <div className="text-xs text-muted-foreground space-y-1">
                            <p>Average sentence: ~{Math.round(patternsData.patterns.averageSentenceLength)} words</p>
                            <p>Greeting style: {patternsData.patterns.greetingStyle}</p>
                            <p>Closing style: {patternsData.patterns.closingStyle}</p>
                        </div>
                    </CardContent>
                </Card>
            )}

            {samplesData?.samples && samplesData.samples.length > 0 && (
                <div className="space-y-2">
                    {samplesData.samples.map((sample: any) => (
                        <Card key={sample.id} className="bg-muted/20">
                            <CardContent className="p-4">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm line-clamp-3">{sample.sampleText}</p>
                                        {sample.context && <p className="text-xs text-muted-foreground mt-1">Context: {sample.context}</p>}
                                    </div>
                                    <Button variant="ghost" size="icon" onClick={() => deleteVoiceSampleMutation.mutate(sample.id)} disabled={deleteVoiceSampleMutation.isPending} data-testid={`button-delete-sample-${sample.id}`}><Trash2 className="w-4 h-4 text-muted-foreground" /></Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <div className="space-y-3 p-4 border border-dashed border-border rounded-lg">
                <Label className="text-sm font-medium">Add a New Sample</Label>
                <Textarea value={newSampleText} onChange={(e) => setNewSampleText(e.target.value)} placeholder="Paste an email you've written..." className="min-h-[100px] resize-none" data-testid="textarea-new-sample" />
                <Input value={newSampleContext} onChange={(e) => setNewSampleContext(e.target.value)} placeholder="Context (optional)" data-testid="input-sample-context" />
                <div className="flex gap-2">
                    <Button onClick={() => addVoiceSampleMutation.mutate()} disabled={!newSampleText || newSampleText.length < 50 || addVoiceSampleMutation.isPending} data-testid="button-add-sample">
                        {addVoiceSampleMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}Add Sample
                    </Button>
                    {samplesData?.samples && samplesData.samples.length > 0 && (
                        <Button variant="outline" onClick={() => analyzePatternsMutation.mutate()} disabled={analyzePatternsMutation.isPending} data-testid="button-analyze-patterns">
                            {analyzePatternsMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Wand2 className="w-4 h-4 mr-2" />}Analyze Patterns
                        </Button>
                    )}
                </div>
                <p className="text-xs text-muted-foreground">{samplesData?.samples ? `${samplesData.samples.length}/5` : '0/5'} samples used</p>
            </div>
        </>
    );
}

// Tone & Style Tab Content Component
export function ToneStyleTabContent({ toneFormality, setToneFormality, toneWarmth, setToneWarmth, toneDirectness, setToneDirectness, minEmailLength, setMinEmailLength, maxEmailLength, setMaxEmailLength, savePersonalizationMutation }: any) {
    return (
        <>
            <div className="space-y-6">
                <ToneSlider label="Formality" value={toneFormality} setValue={setToneFormality} type="formality" labels={["Casual", "Balanced", "Formal"]} testId="formality" />
                <ToneSlider label="Warmth" value={toneWarmth} setValue={setToneWarmth} type="warmth" labels={["Neutral", "Friendly", "Very Warm"]} testId="warmth" />
                <ToneSlider label="Directness" value={toneDirectness} setValue={setToneDirectness} type="directness" labels={["Subtle", "Clear", "Very Direct"]} testId="directness" />

                <Separator />

                <div className="space-y-3">
                    <Label className="text-sm font-medium">Email Length (words)</Label>
                    <div className="flex items-center gap-4">
                        <div className="flex-1 space-y-1">
                            <Label className="text-xs text-muted-foreground">Minimum</Label>
                            <Input type="number" value={minEmailLength} onChange={(e) => setMinEmailLength(parseInt(e.target.value) || 30)} min={20} max={200} data-testid="input-min-length" />
                        </div>
                        <div className="flex-1 space-y-1">
                            <Label className="text-xs text-muted-foreground">Maximum</Label>
                            <Input type="number" value={maxEmailLength} onChange={(e) => setMaxEmailLength(parseInt(e.target.value) || 150)} min={50} max={500} data-testid="input-max-length" />
                        </div>
                    </div>
                </div>
            </div>

            <Button onClick={() => savePersonalizationMutation.mutate()} disabled={savePersonalizationMutation.isPending} data-testid="button-save-tone">
                {savePersonalizationMutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : <><Check className="w-4 h-4 mr-2" />Save Tone Settings</>}
            </Button>
        </>
    );
}

// Tone Slider Component
function ToneSlider({ label, value, setValue, type, labels, testId }: { label: string; value: number; setValue: (v: number) => void; type: string; labels: string[]; testId: string }) {
    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">{label}</Label>
                <Badge variant="outline" data-testid={`badge-${testId}-value`}>{getToneLabel(value, type)} ({value}/10)</Badge>
            </div>
            <Slider value={[value]} onValueChange={([val]) => setValue(val)} min={1} max={10} step={1} className="w-full" data-testid={`slider-${testId}`} />
            <div className="flex justify-between text-xs text-muted-foreground">{labels.map(l => <span key={l}>{l}</span>)}</div>
        </div>
    );
}

// Personas Tab Content Component
export function PersonasTabContent({ personasData, newPersonaName, setNewPersonaName, newPersonaDescription, setNewPersonaDescription, newPersonaInstructions, setNewPersonaInstructions, createPersonaMutation, deletePersonaMutation, setDefaultPersonaMutation }: { personasData: PersonasResponse | undefined;[key: string]: any }) {
    return (
        <>
            <div className="space-y-2">
                <Label className="text-sm font-medium">Email Personas</Label>
                <p className="text-sm text-muted-foreground">Create different writing styles for different contexts.</p>
            </div>

            {personasData?.personas && personasData.personas.length > 0 && (
                <div className="grid gap-3">
                    {personasData.personas.map((persona: any) => (
                        <Card key={persona.id} className={`${persona.isDefault ? 'border-purple-300 dark:border-purple-700 bg-purple-50/50 dark:bg-purple-900/20' : ''}`}>
                            <CardContent className="p-4">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-medium">{persona.name}</h4>
                                            {persona.isDefault && <Badge variant="secondary" className="text-xs">Default</Badge>}
                                        </div>
                                        {persona.description && <p className="text-sm text-muted-foreground mt-1">{persona.description}</p>}
                                        {persona.instructions && <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{persona.instructions}</p>}
                                    </div>
                                    <div className="flex gap-1">
                                        {!persona.isDefault && <Button variant="ghost" size="sm" onClick={() => setDefaultPersonaMutation.mutate(persona.id)} disabled={setDefaultPersonaMutation.isPending} data-testid={`button-set-default-${persona.id}`}>Set Default</Button>}
                                        <Button variant="ghost" size="icon" onClick={() => deletePersonaMutation.mutate(persona.id)} disabled={deletePersonaMutation.isPending || persona.isDefault} data-testid={`button-delete-persona-${persona.id}`}><Trash2 className="w-4 h-4 text-muted-foreground" /></Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <div className="space-y-3 p-4 border border-dashed border-border rounded-lg">
                <Label className="text-sm font-medium">Create New Persona</Label>
                <Input value={newPersonaName} onChange={(e) => setNewPersonaName(e.target.value)} placeholder="Persona name" data-testid="input-persona-name" />
                <Input value={newPersonaDescription} onChange={(e) => setNewPersonaDescription(e.target.value)} placeholder="Short description (optional)" data-testid="input-persona-description" />
                <Textarea value={newPersonaInstructions} onChange={(e) => setNewPersonaInstructions(e.target.value)} placeholder="Specific instructions (optional)" className="min-h-[80px] resize-none" data-testid="textarea-persona-instructions" />
                <Button onClick={() => createPersonaMutation.mutate()} disabled={!newPersonaName || createPersonaMutation.isPending} data-testid="button-create-persona">
                    {createPersonaMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}Create Persona
                </Button>
                <p className="text-xs text-muted-foreground">{personasData?.personas ? `${personasData.personas.length}/10` : '0/10'} personas used</p>
            </div>
        </>
    );
}
