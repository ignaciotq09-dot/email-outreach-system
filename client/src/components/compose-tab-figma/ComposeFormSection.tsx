// Compose Form Section - UI for composing base message

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, Sparkles, Mail, Brain } from "lucide-react";
import type { WritingStyle } from "./types";

interface ComposeFormSectionProps {
    baseMessage: string;
    setBaseMessage: (v: string) => void;
    writingStyle: WritingStyle;
    setWritingStyle: (v: WritingStyle) => void;
    isGenerating: boolean;
    onGenerateVariants: () => void;
}

export function ComposeFormSection({ baseMessage, setBaseMessage, writingStyle, setWritingStyle, isGenerating, onGenerateVariants }: ComposeFormSectionProps) {
    return (
        <>
            <div className="mb-10 text-center">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-purple-100 px-4 py-2">
                    <div className="h-2 w-2 rounded-full bg-purple-600"></div>
                    <span className="text-sm text-purple-900">AI-powered email generation</span>
                </div>
                <h1 className="mb-3 text-gray-900 dark:text-gray-100">Compose Your Message</h1>
                <p className="text-gray-600 dark:text-gray-400">Write your base message and let AI create 3 personalized variants</p>
            </div>

            <div className="grid grid-cols-12 gap-6">
                {/* Main Compose Area */}
                <div className="col-span-8">
                    <div className="rounded-2xl border border-purple-100 dark:border-purple-900 bg-white dark:bg-gray-900 p-8 shadow-sm">
                        <Label htmlFor="base-message" className="mb-4 flex items-center gap-3 text-gray-900 dark:text-gray-100">
                            <div className="rounded-lg bg-purple-600 p-2"><Mail className="h-5 w-5 text-white" /></div>
                            <span>Your Base Message</span>
                        </Label>
                        <Textarea id="base-message" placeholder="Start typing your message... AI will transform it into 3 unique variants." className="min-h-[360px] resize-none rounded-xl border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-500" value={baseMessage} onChange={(e) => setBaseMessage(e.target.value)} data-testid="textarea-base-message" />
                    </div>
                </div>

                {/* Sidebar with Writing Style */}
                <div className="col-span-4">
                    <div className="rounded-2xl border border-purple-100 dark:border-purple-900 bg-white dark:bg-gray-900 p-6 shadow-sm">
                        <div className="mb-5 flex items-center gap-3">
                            <div className="rounded-lg bg-violet-600 p-2"><Brain className="h-5 w-5 text-white" /></div>
                            <Label className="text-gray-900 dark:text-gray-100">Writing Style</Label>
                        </div>
                        <RadioGroup value={writingStyle} onValueChange={(v) => setWritingStyle(v as WritingStyle)} className="space-y-3" data-testid="radio-writing-style">
                            <div className="cursor-pointer rounded-xl border-2 border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950 p-4 transition-colors hover:border-purple-400 dark:hover:border-purple-600">
                                <div className="flex items-start gap-3">
                                    <RadioGroupItem value="professional-adult" id="professional-adult" className="mt-1" data-testid="radio-professional-adult" />
                                    <div className="flex-1">
                                        <Label htmlFor="professional-adult" className="cursor-pointer text-gray-900 dark:text-gray-100">Professional & Direct</Label>
                                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Confident, assumes expertise</p>
                                    </div>
                                </div>
                            </div>
                            <div className="cursor-pointer rounded-xl border-2 border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950 p-4 transition-colors hover:border-purple-400 dark:hover:border-purple-600">
                                <div className="flex items-start gap-3">
                                    <RadioGroupItem value="professional-humble" id="professional-humble" className="mt-1" data-testid="radio-professional-humble" />
                                    <div className="flex-1">
                                        <Label htmlFor="professional-humble" className="cursor-pointer text-gray-900 dark:text-gray-100">Professional & Humble</Label>
                                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Curious, asks questions</p>
                                    </div>
                                </div>
                            </div>
                        </RadioGroup>
                    </div>
                </div>
            </div>

            {/* Generate Button */}
            <div className="mt-10 text-center">
                <Button onClick={onGenerateVariants} disabled={isGenerating || !baseMessage} className="rounded-xl bg-gradient-to-r from-purple-600 to-violet-600 px-10 py-6 shadow-lg shadow-purple-300 dark:shadow-purple-900 hover:shadow-xl hover:shadow-purple-400 dark:hover:shadow-purple-800" data-testid="button-generate-variants">
                    <span className="flex items-center gap-2 text-white">
                        {isGenerating ? <><Loader2 className="h-5 w-5 animate-spin" /><span>Generating...</span></> : <><Sparkles className="h-5 w-5" /><span>Generate 3 Email Variants</span></>}
                    </span>
                </Button>
                <div className="mt-6 flex items-center justify-center gap-8 text-sm">
                    <div className="flex items-center gap-2"><div className="flex h-5 w-5 items-center justify-center rounded-full bg-green-100 dark:bg-green-900"><div className="h-2 w-2 rounded-full bg-green-600"></div></div><span className="text-gray-700 dark:text-gray-300">Takes ~30 seconds</span></div>
                    <div className="flex items-center gap-2"><div className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900"><div className="h-2 w-2 rounded-full bg-purple-600"></div></div><span className="text-gray-700 dark:text-gray-300">Unique to your voice</span></div>
                </div>
            </div>
        </>
    );
}
