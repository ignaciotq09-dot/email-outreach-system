// Smart Questions - Conversational AI-powered gap questions
// Chat-style interface with context-aware questions

import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
    ArrowRight,
    Sparkles,
    MessageCircle,
    Send,
    CheckCircle2,
    Lightbulb,
    Building2,
    SkipForward,
    Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SmartQuestion {
    id: string;
    field: string;
    question: string;
    context: string;
    examples?: string[];
    inputType: 'text' | 'multiselect' | 'select';
    options?: string[];
    priority: 'critical' | 'high' | 'medium';
    whyWeNeed: string;
}

interface SmartQuestionSet {
    companyContext: string;
    questions: SmartQuestion[];
    totalGaps: number;
    criticalGaps: number;
}

interface SmartQuestionsProps {
    onComplete: () => void;
    onBack: () => void;
}

interface Message {
    id: string;
    type: 'ai' | 'user';
    content: string;
    question?: SmartQuestion;
    timestamp: Date;
}

export function SmartQuestions({ onComplete, onBack }: SmartQuestionsProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [currentAnswer, setCurrentAnswer] = useState<string | string[]>('');
    const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Fetch smart questions
    const { data: questionSet, isLoading } = useQuery<SmartQuestionSet>({
        queryKey: ['smart-questions'],
        queryFn: async () => {
            const response = await apiRequest('GET', '/api/onboarding/company/smart-questions');
            return response.json();
        },
    });

    // Save answers mutation
    const saveMutation = useMutation({
        mutationFn: async (data: Record<string, string | string[]>) => {
            return apiRequest('POST', '/api/onboarding/company/smart-answers', { answers: data });
        },
        onSuccess: () => {
            onComplete();
        },
    });

    // Scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Initialize with first message when questions load
    useEffect(() => {
        if (questionSet && questionSet.questions.length > 0 && messages.length === 0) {
            const greeting: Message = {
                id: 'greeting',
                type: 'ai',
                content: `Great! I found a lot about your company. Just ${questionSet.questions.length} quick question${questionSet.questions.length !== 1 ? 's' : ''} to complete your profile...`,
                timestamp: new Date(),
            };
            setMessages([greeting]);

            // Add first question after delay
            setTimeout(() => {
                addQuestionMessage(questionSet.questions[0]);
            }, 1000);
        } else if (questionSet && questionSet.questions.length === 0) {
            // No questions needed - proceed
            onComplete();
        }
    }, [questionSet]);

    const addQuestionMessage = (question: SmartQuestion) => {
        setIsTyping(true);
        setTimeout(() => {
            const msg: Message = {
                id: `q-${question.id}`,
                type: 'ai',
                content: question.question,
                question,
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, msg]);
            setIsTyping(false);
        }, 500);
    };

    const handleSubmitAnswer = () => {
        if (!questionSet || !currentAnswer || (Array.isArray(currentAnswer) && currentAnswer.length === 0)) return;

        const currentQuestion = questionSet.questions[currentQuestionIndex];

        // Add user's answer to messages
        const userMessage: Message = {
            id: `answer-${currentQuestion.id}`,
            type: 'user',
            content: Array.isArray(currentAnswer) ? currentAnswer.join(', ') : currentAnswer,
            timestamp: new Date(),
        };
        setMessages(prev => [...prev, userMessage]);

        // Save answer
        const newAnswers = { ...answers, [currentQuestion.field]: currentAnswer };
        setAnswers(newAnswers);
        setCurrentAnswer('');

        // Check if there are more questions
        if (currentQuestionIndex < questionSet.questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
            setTimeout(() => {
                // Add acknowledgment
                const ackMessage: Message = {
                    id: `ack-${currentQuestion.id}`,
                    type: 'ai',
                    content: getAcknowledgment(),
                    timestamp: new Date(),
                };
                setMessages(prev => [...prev, ackMessage]);

                // Then next question
                setTimeout(() => {
                    addQuestionMessage(questionSet.questions[currentQuestionIndex + 1]);
                }, 800);
            }, 300);
        } else {
            // All questions answered
            setTimeout(() => {
                const completeMessage: Message = {
                    id: 'complete',
                    type: 'ai',
                    content: "Perfect! That's everything I need. Your profile is now complete!",
                    timestamp: new Date(),
                };
                setMessages(prev => [...prev, completeMessage]);

                // Save and complete
                setTimeout(() => {
                    saveMutation.mutate(newAnswers);
                }, 1000);
            }, 500);
        }
    };

    const handleSkip = () => {
        if (!questionSet) return;

        const currentQuestion = questionSet.questions[currentQuestionIndex];

        // Add skip message
        const skipMessage: Message = {
            id: `skip-${currentQuestion.id}`,
            type: 'user',
            content: 'Skip for now',
            timestamp: new Date(),
        };
        setMessages(prev => [...prev, skipMessage]);

        if (currentQuestionIndex < questionSet.questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
            setTimeout(() => {
                const ackMessage: Message = {
                    id: `skip-ack-${currentQuestion.id}`,
                    type: 'ai',
                    content: "No problem, we can fill this in later.",
                    timestamp: new Date(),
                };
                setMessages(prev => [...prev, ackMessage]);

                setTimeout(() => {
                    addQuestionMessage(questionSet.questions[currentQuestionIndex + 1]);
                }, 600);
            }, 300);
        } else {
            // Last question skipped
            setTimeout(() => {
                const completeMessage: Message = {
                    id: 'complete',
                    type: 'ai',
                    content: "All done! Your profile is ready to go.",
                    timestamp: new Date(),
                };
                setMessages(prev => [...prev, completeMessage]);

                setTimeout(() => {
                    saveMutation.mutate(answers);
                }, 1000);
            }, 500);
        }
    };

    const handleMultiSelect = (option: string, checked: boolean) => {
        const current = Array.isArray(currentAnswer) ? currentAnswer : [];
        if (checked) {
            setCurrentAnswer([...current, option]);
        } else {
            setCurrentAnswer(current.filter(v => v !== option));
        }
    };

    const getAcknowledgment = () => {
        const acks = [
            "Got it!",
            "Thanks for that!",
            "Perfect!",
            "Great, that helps!",
            "Excellent!",
        ];
        return acks[Math.floor(Math.random() * acks.length)];
    };

    const getPriorityBadge = (priority: string) => {
        switch (priority) {
            case 'critical':
                return <Badge variant="destructive" className="text-xs">Important</Badge>;
            case 'high':
                return <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-700">Helpful</Badge>;
            default:
                return null;
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-violet-600 mb-4" />
                <p className="text-muted-foreground">Preparing your questions...</p>
            </div>
        );
    }

    const currentQuestion = questionSet?.questions[currentQuestionIndex];

    return (
        <div className="flex flex-col h-[600px]">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b">
                <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h3 className="font-semibold">AI Assistant</h3>
                        <p className="text-xs text-muted-foreground">
                            {questionSet?.questions.length || 0} questions • {currentQuestionIndex + 1} of {questionSet?.questions.length || 0}
                        </p>
                    </div>
                </div>
                {questionSet && (
                    <div className="flex gap-1">
                        {questionSet.questions.map((q, i) => (
                            <div
                                key={q.id}
                                className={cn(
                                    "w-2 h-2 rounded-full transition-colors",
                                    i < currentQuestionIndex ? "bg-green-500" :
                                        i === currentQuestionIndex ? "bg-violet-500" :
                                            "bg-gray-200"
                                )}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto py-4 space-y-4">
                {messages.map((message) => (
                    <div
                        key={message.id}
                        className={cn(
                            "flex",
                            message.type === 'user' ? "justify-end" : "justify-start"
                        )}
                    >
                        <div
                            className={cn(
                                "max-w-[85%] rounded-2xl px-4 py-3",
                                message.type === 'user'
                                    ? "bg-violet-600 text-white rounded-br-md"
                                    : "bg-gray-100 text-gray-900 rounded-bl-md"
                            )}
                        >
                            <p className="text-sm">{message.content}</p>

                            {/* Context and examples for AI questions */}
                            {message.question && (
                                <div className="mt-3 space-y-2">
                                    {message.question.context && (
                                        <p className="text-xs opacity-75 flex items-center gap-1">
                                            <Building2 className="w-3 h-3" />
                                            {message.question.context}
                                        </p>
                                    )}
                                    {message.question.examples && message.question.examples.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-2">
                                            <Lightbulb className="w-3 h-3 opacity-60" />
                                            {message.question.examples.map((ex, i) => (
                                                <span
                                                    key={i}
                                                    className="text-xs bg-white/50 px-2 py-0.5 rounded cursor-pointer hover:bg-white/80 transition-colors"
                                                    onClick={() => {
                                                        if (message.question?.inputType === 'text') {
                                                            setCurrentAnswer(ex);
                                                        }
                                                    }}
                                                >
                                                    {ex}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2 mt-2">
                                        {getPriorityBadge(message.question.priority)}
                                        <span className="text-xs opacity-60">{message.question.whyWeNeed}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                {/* Typing indicator */}
                {isTyping && (
                    <div className="flex justify-start">
                        <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-3">
                            <div className="flex gap-1">
                                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            {currentQuestion && !saveMutation.isPending && (
                <div className="border-t pt-4">
                    {currentQuestion.inputType === 'text' && (
                        <div className="flex gap-2">
                            <Textarea
                                value={currentAnswer as string}
                                onChange={(e) => setCurrentAnswer(e.target.value)}
                                placeholder="Type your answer..."
                                className="flex-1 min-h-[60px] resize-none"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSubmitAnswer();
                                    }
                                }}
                            />
                            <div className="flex flex-col gap-2">
                                <Button
                                    onClick={handleSubmitAnswer}
                                    disabled={!currentAnswer}
                                    className="bg-violet-600 hover:bg-violet-700"
                                >
                                    <Send className="w-4 h-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleSkip}
                                    className="text-xs text-muted-foreground"
                                >
                                    <SkipForward className="w-3 h-3 mr-1" />
                                    Skip
                                </Button>
                            </div>
                        </div>
                    )}

                    {currentQuestion.inputType === 'multiselect' && currentQuestion.options && (
                        <div className="space-y-3">
                            <div className="flex flex-wrap gap-2">
                                {currentQuestion.options.map((option) => (
                                    <label
                                        key={option}
                                        className={cn(
                                            "flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all",
                                            (currentAnswer as string[])?.includes(option)
                                                ? "bg-violet-50 border-violet-300 text-violet-700"
                                                : "bg-white hover:bg-gray-50"
                                        )}
                                    >
                                        <Checkbox
                                            checked={(currentAnswer as string[])?.includes(option)}
                                            onCheckedChange={(checked) => handleMultiSelect(option, checked as boolean)}
                                        />
                                        <span className="text-sm">{option}</span>
                                    </label>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    onClick={handleSubmitAnswer}
                                    disabled={!currentAnswer || (currentAnswer as string[]).length === 0}
                                    className="flex-1 bg-violet-600 hover:bg-violet-700"
                                >
                                    Continue
                                    <ArrowRight className="w-4 h-4 ml-2" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    onClick={handleSkip}
                                >
                                    Skip
                                </Button>
                            </div>
                        </div>
                    )}

                    {currentQuestion.inputType === 'select' && currentQuestion.options && (
                        <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-2">
                                {currentQuestion.options.map((option) => (
                                    <Button
                                        key={option}
                                        variant={currentAnswer === option ? "default" : "outline"}
                                        className={cn(
                                            "justify-start",
                                            currentAnswer === option && "bg-violet-600"
                                        )}
                                        onClick={() => {
                                            setCurrentAnswer(option);
                                            // Auto-submit on single select
                                            setTimeout(() => {
                                                setAnswers(prev => ({ ...prev, [currentQuestion.field]: option }));
                                                handleSubmitAnswer();
                                            }, 200);
                                        }}
                                    >
                                        {option}
                                    </Button>
                                ))}
                            </div>
                            <Button
                                variant="ghost"
                                className="w-full"
                                onClick={handleSkip}
                            >
                                Skip this question
                            </Button>
                        </div>
                    )}
                </div>
            )}

            {/* Saving state */}
            {saveMutation.isPending && (
                <div className="border-t pt-4 flex items-center justify-center gap-2 text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving your answers...</span>
                </div>
            )}

            {/* Completion state */}
            {saveMutation.isSuccess && (
                <div className="border-t pt-4 flex items-center justify-center gap-2 text-green-600">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Profile complete!</span>
                </div>
            )}
        </div>
    );
}
