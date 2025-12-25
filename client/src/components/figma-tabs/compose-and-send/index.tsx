// ComposeAndSend component - Main entry point

import { useState, useEffect, useMemo } from 'react';
import { WritingStyleModal } from '../WritingStyleModal';
import { EmailVariants } from '../EmailVariants';
import { AddContacts } from '../AddContacts';
import { WRITING_STYLES, DEFAULT_ACTIVE_STYLES, MAX_ACTIVE_STYLES, type WritingStyleId } from '@shared/writing-styles';
import { useComposeQueries } from '@/components/compose/hooks/useComposeQueries';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

import type { Channel, EmailVariant } from './types';
import { CHANNELS } from './data';
import { OutreachChannelsSection } from './sections/OutreachChannels';
import { ComposeMessageSection } from './sections/ComposeMessage';
import { StyleModal } from './sections/StyleModal';

// Re-export types for backward compatibility
export type { Channel, EmailVariant } from './types';

export function ComposeAndSend() {
    const { toast } = useToast();
    const { variantDiversity, smsEnabled } = useComposeQueries();

    // Writing styles management (3 default + 1 optional, max 4, then replace only)
    const [activeStyleIds, setActiveStyleIds] = useState<WritingStyleId[]>(DEFAULT_ACTIVE_STYLES);
    const [showAddStyleModal, setShowAddStyleModal] = useState(false);
    const [newStyleToAdd, setNewStyleToAdd] = useState<WritingStyleId | null>(null);

    // Clear old localStorage and start fresh with 3 defaults
    useEffect(() => {
        localStorage.setItem('activeWritingStyles', JSON.stringify(DEFAULT_ACTIVE_STYLES));
        setActiveStyleIds([...DEFAULT_ACTIVE_STYLES]);
    }, []);

    // Save active styles to localStorage
    const saveActiveStyles = (styles: WritingStyleId[]) => {
        const unique = Array.from(new Set(styles)) as WritingStyleId[];
        const limited = unique.slice(0, MAX_ACTIVE_STYLES);
        setActiveStyleIds(limited);
        localStorage.setItem('activeWritingStyles', JSON.stringify(limited));
    };

    // Step 1: Select a new style to add (if at max, goes to replace flow)
    const selectNewStyle = (styleId: WritingStyleId) => {
        if (activeStyleIds.length < MAX_ACTIVE_STYLES) {
            saveActiveStyles([...activeStyleIds, styleId]);
            setShowAddStyleModal(false);
            setNewStyleToAdd(null);
        } else {
            setNewStyleToAdd(styleId);
        }
    };

    // Step 2: Select which current style to replace with the new style
    const replaceWithNewStyle = (oldStyleId: WritingStyleId) => {
        if (newStyleToAdd) {
            const newStyles = activeStyleIds.map(id => id === oldStyleId ? newStyleToAdd : id);
            saveActiveStyles(newStyles);
        }
        setNewStyleToAdd(null);
        setShowAddStyleModal(false);
    };

    // Remove a writing style
    const removeStyle = (styleId: WritingStyleId) => {
        saveActiveStyles(activeStyleIds.filter(id => id !== styleId));
    };

    // Get available styles (not currently active)
    const availableStyles = useMemo(() => {
        return (Object.keys(WRITING_STYLES) as WritingStyleId[])
            .filter(id => !activeStyleIds.includes(id));
    }, [activeStyleIds]);

    // Convert active styles to array for rendering
    const writingStylesArray = useMemo(() => {
        return activeStyleIds
            .filter(id => WRITING_STYLES[id])
            .map(id => ({
                id,
                ...WRITING_STYLES[id]
            }));
    }, [activeStyleIds]);

    const [channels, setChannels] = useState(CHANNELS);
    const [message, setMessage] = useState('');
    const [selectedStyle, setSelectedStyle] = useState<WritingStyleId>('professional-adult');
    const [isGenerating, setIsGenerating] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [showWritingStyleModal, setShowWritingStyleModal] = useState(false);
    const [showVariants, setShowVariants] = useState(false);
    const [selectedVariant, setSelectedVariant] = useState<number | null>(null);
    const [feedback, setFeedback] = useState('');
    const [showContacts, setShowContacts] = useState(false);
    const [variants, setVariants] = useState<EmailVariant[]>([]);

    // Detect dark mode
    useEffect(() => {
        const checkDarkMode = () => {
            setIsDarkMode(document.documentElement.classList.contains('dark'));
        };

        checkDarkMode();

        const observer = new MutationObserver(checkDarkMode);
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class']
        });

        return () => observer.disconnect();
    }, []);

    const toggleChannel = (channelId: string) => {
        setChannels(prev =>
            prev.map(ch =>
                ch.id === channelId ? { ...ch, enabled: !ch.enabled } : ch
            )
        );
    };

    const handleGenerate = async () => {
        if (!message.trim()) {
            toast({
                title: "Missing Message",
                description: "Please enter a base message.",
                variant: "destructive",
            });
            return;
        }
        setIsGenerating(true);
        try {
            const data = await apiRequest<{ variants: EmailVariant[] }>('POST', '/api/emails/generate', {
                baseMessage: message,
                writingStyle: selectedStyle,
                variantDiversity: variantDiversity,
            });

            console.log('Generated variants:', data);

            setVariants(data.variants || []);
            setIsGenerating(false);
            setShowVariants(true);

            toast({
                title: "Variants Generated",
                description: `${data.variants?.length || 0} email variants created!`,
            });
        } catch (error) {
            console.error('Error generating variants:', error);
            setIsGenerating(false);
            toast({
                title: "Error",
                description: "Failed to generate variants. Please try again.",
                variant: "destructive",
            });
        }
    };

    const handleRegenerate = async () => {
        setIsGenerating(true);
        try {
            const response = await fetch('/api/emails/regenerate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    baseMessage: message,
                    writingStyle: selectedStyle,
                    feedback: feedback,
                    currentVariants: variants,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to regenerate variants');
            }

            const data = await response.json();
            console.log('Regenerated variants:', data);

            setVariants(data.variants || []);
            setFeedback('');
            setIsGenerating(false);
        } catch (error) {
            console.error('Error regenerating variants:', error);
            setIsGenerating(false);
        }
    };

    return (
        <div className={`h-full overflow-auto ${isDarkMode ? 'bg-[#0a0515]' : 'bg-slate-50'}`}>
            <div className="max-w-7xl mx-auto p-4 space-y-4">

                {/* Page Header */}
                <div className="mb-4">
                    <h1
                        className="text-2xl font-bold mb-1"
                        style={{ color: isDarkMode ? '#e9d5ff' : '#1f2937' }}
                    >
                        Compose & Send
                    </h1>
                    <p
                        className="text-xs"
                        style={{ color: isDarkMode ? '#a78bfa' : '#6b7280' }}
                    >
                        Create AI-powered outreach messages across multiple channels
                    </p>
                </div>

                {/* Outreach Channels Section */}
                {!showVariants && (
                    <OutreachChannelsSection
                        channels={channels}
                        onToggleChannel={toggleChannel}
                        isDarkMode={isDarkMode}
                    />
                )}

                {/* Compose Message Section */}
                {!showVariants && (
                    <ComposeMessageSection
                        message={message}
                        onMessageChange={setMessage}
                        selectedStyle={selectedStyle}
                        onStyleChange={setSelectedStyle}
                        writingStyles={writingStylesArray}
                        onAddStyleClick={() => {
                            setNewStyleToAdd(null);
                            setShowAddStyleModal(true);
                        }}
                        onGenerate={handleGenerate}
                        isGenerating={isGenerating}
                        isDarkMode={isDarkMode}
                        maxStyles={MAX_ACTIVE_STYLES}
                        activeStyleCount={activeStyleIds.length}
                    />
                )}

                {/* Email Variants Section */}
                {showVariants && (
                    <EmailVariants
                        isDarkMode={isDarkMode}
                        selectedVariant={selectedVariant}
                        setSelectedVariant={setSelectedVariant}
                        feedback={feedback}
                        setFeedback={setFeedback}
                        variants={variants}
                        onRegenerate={handleRegenerate}
                        isRegenerating={isGenerating}
                    />
                )}

                {/* Add Contacts Section */}
                {selectedVariant !== null && (
                    <AddContacts isDarkMode={isDarkMode} />
                )}
            </div>

            {/* Add/Replace Writing Style Modal */}
            <StyleModal
                isOpen={showAddStyleModal}
                onClose={() => {
                    setShowAddStyleModal(false);
                    setNewStyleToAdd(null);
                }}
                newStyleToAdd={newStyleToAdd}
                activeStyleIds={activeStyleIds}
                availableStyles={availableStyles}
                onSelectNewStyle={selectNewStyle}
                onReplaceStyle={replaceWithNewStyle}
                isDarkMode={isDarkMode}
                maxStyles={MAX_ACTIVE_STYLES}
            />

            {/* Writing Style Modal */}
            <WritingStyleModal
                isOpen={showWritingStyleModal}
                onClose={() => setShowWritingStyleModal(false)}
                isDarkMode={isDarkMode}
                activeStyleIds={activeStyleIds}
                onAddStyle={selectNewStyle}
                onRemoveStyle={removeStyle}
                maxStyles={MAX_ACTIVE_STYLES}
            />
        </div>
    );
}
