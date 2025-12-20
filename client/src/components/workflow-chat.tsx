import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Send, Loader2, Sparkles, Bot, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Workflow, WorkflowNode, WorkflowEdge, WorkflowConversationMessage } from "@shared/schema";

interface WorkflowChatProps {
  workflow: Workflow;
  onWorkflowUpdate: (nodes: WorkflowNode[], edges: WorkflowEdge[]) => void;
  onClose: () => void;
}

export default function WorkflowChat({ workflow, onWorkflowUpdate, onClose }: WorkflowChatProps) {
  const { toast } = useToast();
  const [message, setMessage] = useState("");
  const [conversation, setConversation] = useState<WorkflowConversationMessage[]>(
    (workflow.aiConversationHistory as WorkflowConversationMessage[]) || []
  );
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setConversation((workflow.aiConversationHistory as WorkflowConversationMessage[]) || []);
  }, [workflow.id]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [conversation]);

  const refineMutation = useMutation({
    mutationFn: async (refinementRequest: string) => {
      return apiRequest(`/api/workflows/${workflow.id}/refine`, {
        method: "POST",
        body: JSON.stringify({
          refinementRequest,
          conversationHistory: conversation,
        }),
      });
    },
    onSuccess: (result: { workflow: Workflow; changes: string; summary: string }) => {
      const newConvo: WorkflowConversationMessage[] = [
        ...conversation,
        {
          role: "user",
          content: message,
          timestamp: new Date().toISOString(),
        },
        {
          role: "assistant",
          content: result.changes || result.summary || "Workflow updated successfully",
          timestamp: new Date().toISOString(),
        },
      ];
      setConversation(newConvo);
      setMessage("");
      
      onWorkflowUpdate(
        result.workflow.nodes as WorkflowNode[],
        result.workflow.edges as WorkflowEdge[]
      );

      queryClient.invalidateQueries({ queryKey: ["/api/workflows"] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update workflow",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSend = () => {
    if (!message.trim()) return;
    refineMutation.mutate(message);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="font-medium text-sm">AI Assistant</span>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1 p-3" ref={scrollRef}>
        <div className="space-y-4">
          {conversation.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Bot className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p className="text-sm font-medium">How can I help?</p>
              <p className="text-xs mt-1">
                Describe changes you want to make to your workflow
              </p>
              <div className="mt-4 space-y-2">
                <p className="text-xs font-medium">Try saying:</p>
                <div className="space-y-1.5">
                  {[
                    "Add an SMS step before LinkedIn",
                    "Wait 5 days instead of 3",
                    "Add a condition to check if email was opened",
                    "Remove the last follow-up step",
                  ].map((suggestion, i) => (
                    <button
                      key={i}
                      onClick={() => setMessage(suggestion)}
                      className="block w-full text-left text-xs p-2 rounded bg-muted/50 hover:bg-muted transition-colors"
                    >
                      "{suggestion}"
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            conversation.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-2 ${msg.role === "user" ? "justify-end" : ""}`}
              >
                {msg.role === "assistant" && (
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-3.5 h-3.5 text-primary" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  {msg.content}
                </div>
                {msg.role === "user" && (
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <User className="w-3.5 h-3.5 text-primary-foreground" />
                  </div>
                )}
              </div>
            ))
          )}
          {refineMutation.isPending && (
            <div className="flex gap-2">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Bot className="w-3.5 h-3.5 text-primary" />
              </div>
              <div className="bg-muted rounded-lg px-3 py-2">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-3 border-t border-border">
        <div className="flex gap-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Describe what to change..."
            className="flex-1"
            disabled={refineMutation.isPending}
            data-testid="input-workflow-chat"
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!message.trim() || refineMutation.isPending}
            data-testid="button-send-chat"
          >
            {refineMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
