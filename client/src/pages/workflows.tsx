import { useState, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  BackgroundVariant,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Plus, Play, Save, Sparkles, Clock, 
  Mail, MessageSquare, Linkedin, Search, Users, 
  Loader2, Calendar, Zap, Trash2, History, CheckCircle,
  XCircle, PlayCircle, ChevronLeft, GitBranch
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Workflow, WorkflowNode, WorkflowEdge, WorkflowRun } from "@shared/schema";
import WorkflowChat from "@/components/workflow-chat";
import WorkflowScheduler from "@/components/workflow-scheduler";
import { TriggerNode, ActionNode, ConditionNode, DelayNode, EndNode } from "@/components/workflow-nodes";

const nodeTypes = {
  trigger: TriggerNode,
  action: ActionNode,
  condition: ConditionNode,
  delay: DelayNode,
  end: EndNode,
};

const INTERVALS = [
  { value: "weekly", label: "Every week", unit: "week", multiplier: 1 },
  { value: "biweekly", label: "Every 2 weeks", unit: "week", multiplier: 2 },
  { value: "monthly", label: "Every month", unit: "month", multiplier: 1 },
  { value: "bimonthly", label: "Every 2 months", unit: "month", multiplier: 2 },
  { value: "quarterly", label: "Every 4 months", unit: "month", multiplier: 4 },
  { value: "semiannual", label: "Every 6 months", unit: "month", multiplier: 6 },
];

const DAYS_OF_WEEK = [
  { value: 0, label: "Sunday", short: "Sun" },
  { value: 1, label: "Monday", short: "Mon" },
  { value: 2, label: "Tuesday", short: "Tue" },
  { value: 3, label: "Wednesday", short: "Wed" },
  { value: 4, label: "Thursday", short: "Thu" },
  { value: 5, label: "Friday", short: "Fri" },
  { value: 6, label: "Saturday", short: "Sat" },
];

const TIME_SLOTS = {
  morning: [
    { value: "07:00", label: "7:00 AM" },
    { value: "08:00", label: "8:00 AM" },
    { value: "09:00", label: "9:00 AM" },
    { value: "10:00", label: "10:00 AM" },
    { value: "11:00", label: "11:00 AM" },
  ],
  afternoon: [
    { value: "12:00", label: "12:00 PM" },
    { value: "13:00", label: "1:00 PM" },
    { value: "14:00", label: "2:00 PM" },
    { value: "15:00", label: "3:00 PM" },
    { value: "16:00", label: "4:00 PM" },
  ],
  evening: [
    { value: "17:00", label: "5:00 PM" },
    { value: "18:00", label: "6:00 PM" },
    { value: "19:00", label: "7:00 PM" },
  ],
};

type BestTimeRecommendation = {
  hasData: boolean;
  recommendation: {
    dayOfWeek: number;
    time: string;
    label: string;
  };
  message: string;
  confidence: number;
  engagementRate?: number;
  totalEmails?: number;
};

export default function WorkflowsPage() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [showRightPanel, setShowRightPanel] = useState<"chat" | "scheduler" | "history" | null>("chat");
  const [newWorkflowPrompt, setNewWorkflowPrompt] = useState("");
  
  const [selectedInterval, setSelectedInterval] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [channelError, setChannelError] = useState<string | null>(null);
  
  const [channelEmail, setChannelEmail] = useState(true);
  const [channelSms, setChannelSms] = useState(false);
  const [channelLinkedin, setChannelLinkedin] = useState(false);

  const isScheduleValid = selectedInterval !== null && selectedDay !== null && selectedTime !== "";
  const hasAtLeastOneChannel = channelEmail || channelSms || channelLinkedin;

  const validateSchedule = (): boolean => {
    let valid = true;
    
    if (!hasAtLeastOneChannel) {
      setChannelError("Please select at least one channel");
      valid = false;
    } else {
      setChannelError(null);
    }
    
    if (!selectedInterval) {
      setScheduleError("Please select a frequency");
      valid = false;
    } else if (selectedDay === null) {
      setScheduleError("Please select a day");
      valid = false;
    } else if (!selectedTime) {
      setScheduleError("Please select a time");
      valid = false;
    } else {
      setScheduleError(null);
    }
    
    return valid;
  };

  const { data: workflowsList, isLoading } = useQuery<Workflow[]>({
    queryKey: ["/api/workflows"],
  });

  const { data: runHistory, refetch: refetchRuns } = useQuery<WorkflowRun[]>({
    queryKey: ["/api/workflows", selectedWorkflow?.id, "runs"],
    enabled: !!selectedWorkflow?.id,
  });

  const { data: bestTimeData } = useQuery<BestTimeRecommendation>({
    queryKey: ["/api/workflows/schedule/best-time"],
  });

  const applyBestTime = () => {
    if (bestTimeData?.recommendation) {
      setSelectedDay(bestTimeData.recommendation.dayOfWeek);
      setSelectedTime(bestTimeData.recommendation.time);
      setScheduleError(null);
      toast({
        title: "Best time applied",
        description: bestTimeData.message,
      });
    }
  };

  const createWorkflowMutation = useMutation({
    mutationFn: async (data: { name: string; description?: string }) => {
      return apiRequest("POST", "/api/workflows", data);
    },
    onSuccess: (workflow: Workflow) => {
      queryClient.invalidateQueries({ queryKey: ["/api/workflows"] });
      setSelectedWorkflow(workflow);
      toast({ title: "Workflow created" });
    },
  });

  const handleGenerateWorkflow = (description: string) => {
    if (!validateSchedule()) {
      return;
    }
    generateWorkflowMutation.mutate(description);
  };

  const generateWorkflowMutation = useMutation({
    mutationFn: async (description: string) => {
      const channels = { email: channelEmail, sms: channelSms, linkedin: channelLinkedin };
      return apiRequest("POST", "/api/workflows/generate", { description, channels });
    },
    onSuccess: async (result: { nodes: WorkflowNode[]; edges: WorkflowEdge[]; summary: string }) => {
      const channels = { email: channelEmail, sms: channelSms, linkedin: channelLinkedin };
      
      const workflow = await createWorkflowMutation.mutateAsync({
        name: result.summary?.substring(0, 50) || "AI Generated Workflow",
        description: result.summary,
      });

      await saveWorkflowMutation.mutateAsync({
        id: workflow.id,
        nodes: result.nodes,
        edges: result.edges,
      });

      const intervalData = INTERVALS.find(i => i.value === selectedInterval);
      await apiRequest("POST", `/api/workflows/${workflow.id}/schedule`, {
        enabled: true,
        intervalUnit: intervalData?.unit || "week",
        intervalMultiplier: intervalData?.multiplier || 1,
        day: selectedDay!,
        time: selectedTime,
        timezone: "America/New_York",
        channels,
      });

      const flowNodes = convertToFlowNodes(result.nodes);
      const flowEdges = convertToFlowEdges(result.edges);
      setNodes(flowNodes);
      setEdges(flowEdges);
      setNewWorkflowPrompt("");
      setShowRightPanel("chat");
      
      queryClient.invalidateQueries({ queryKey: ["/api/workflows"] });
      
      const dayLabel = DAYS_OF_WEEK.find(d => d.value === selectedDay)?.label || "selected day";
      const channelsList = [channelEmail && "Email", channelSms && "SMS", channelLinkedin && "LinkedIn"].filter(Boolean).join(", ");
      toast({
        title: "Workflow created with schedule",
        description: `Runs ${intervalData?.label?.toLowerCase()} on ${dayLabel}s at ${selectedTime} via ${channelsList}`,
      });
      
      navigate(`/workflows/${workflow.id}/compose`);
    },
    onError: (error: any) => {
      toast({ 
        title: "Generation failed", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const saveWorkflowMutation = useMutation({
    mutationFn: async (data: { id: number; nodes?: any; edges?: any; name?: string }) => {
      return apiRequest("PATCH", `/api/workflows/${data.id}`, {
        nodes: data.nodes,
        edges: data.edges,
        name: data.name,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workflows"] });
      toast({ title: "Workflow saved" });
    },
  });

  const runWorkflowMutation = useMutation({
    mutationFn: async (workflowId: number) => {
      return apiRequest("POST", `/api/workflows/${workflowId}/run`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workflows", selectedWorkflow?.id, "runs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/workflows"] });
      toast({ title: "Workflow started", description: "Execution has begun" });
    },
  });

  const deleteWorkflowMutation = useMutation({
    mutationFn: async (workflowId: number) => {
      return apiRequest("DELETE", `/api/workflows/${workflowId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workflows"] });
      setSelectedWorkflow(null);
      setNodes([]);
      setEdges([]);
      toast({ title: "Workflow deleted" });
    },
  });

  const convertToFlowNodes = (workflowNodes: WorkflowNode[]): Node[] => {
    return workflowNodes.map((node) => ({
      id: node.id,
      type: node.type,
      position: node.position,
      data: {
        ...node.data,
        actionType: node.actionType,
      },
    }));
  };

  const convertToFlowEdges = (workflowEdges: WorkflowEdge[]): Edge[] => {
    return workflowEdges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      sourceHandle: edge.sourceHandle,
      targetHandle: edge.targetHandle,
      label: edge.label,
      animated: true,
      style: { stroke: "#6B7280", strokeWidth: 2 },
    }));
  };

  const loadWorkflow = (workflow: Workflow) => {
    setSelectedWorkflow(workflow);
    const wfNodes = (workflow.nodes as WorkflowNode[]) || [];
    const wfEdges = (workflow.edges as WorkflowEdge[]) || [];
    setNodes(convertToFlowNodes(wfNodes));
    setEdges(convertToFlowEdges(wfEdges));
  };

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({ ...params, animated: true }, eds)),
    [setEdges]
  );

  const handleSave = () => {
    if (!selectedWorkflow) return;
    
    const workflowNodes: WorkflowNode[] = nodes.map((node) => ({
      id: node.id,
      type: node.type as any,
      actionType: node.data?.actionType,
      position: node.position,
      data: node.data as any,
    }));

    const workflowEdges: WorkflowEdge[] = edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      sourceHandle: edge.sourceHandle,
      targetHandle: edge.targetHandle,
      label: edge.label as string,
    }));

    saveWorkflowMutation.mutate({
      id: selectedWorkflow.id,
      nodes: workflowNodes,
      edges: workflowEdges,
    });
  };

  const handleWorkflowUpdate = (updatedNodes: WorkflowNode[], updatedEdges: WorkflowEdge[]) => {
    setNodes(convertToFlowNodes(updatedNodes));
    setEdges(convertToFlowEdges(updatedEdges));

    if (selectedWorkflow) {
      saveWorkflowMutation.mutate({
        id: selectedWorkflow.id,
        nodes: updatedNodes,
        edges: updatedEdges,
      });
    }
  };

  const handleBackToList = () => {
    setSelectedWorkflow(null);
    setNodes([]);
    setEdges([]);
  };

  const hasWorkflows = workflowsList && workflowsList.length > 0;
  const showCenteredCreation = !selectedWorkflow && !hasWorkflows && !isLoading;

  return (
    <div className="flex h-full" data-testid="workflows-page">
      {/* Centered AI Creation - shown when no workflows exist */}
      {showCenteredCreation && (
        <div className="flex-1 flex flex-col pt-12 px-6 bg-gradient-to-b from-purple-50/50 to-transparent dark:from-purple-950/20">
          <div className="max-w-2xl w-full mx-auto">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/50 mb-3">
                <Zap className="w-6 h-6 text-purple-600" />
              </div>
              <h2 className="text-xl font-semibold mb-1">
                Create AI-Powered Workflows
              </h2>
              <p className="text-sm text-muted-foreground">
                Describe your automation and set when it runs
              </p>
            </div>
            
            <div className="flex gap-2 items-center mb-6">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                </div>
                <Input
                  placeholder="Find tech leads, send personalized email, wait 3 days, follow up if no reply..."
                  value={newWorkflowPrompt}
                  onChange={(e) => setNewWorkflowPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !generateWorkflowMutation.isPending && newWorkflowPrompt.trim()) {
                      handleGenerateWorkflow(newWorkflowPrompt);
                    }
                  }}
                  className="pl-12 h-12 bg-white dark:bg-gray-900 border-purple-200 dark:border-purple-800 focus:border-purple-400 focus:ring-purple-400 shadow-sm"
                  data-testid="input-workflow-prompt-centered"
                />
              </div>
              <Button
                onClick={() => handleGenerateWorkflow(newWorkflowPrompt)}
                disabled={generateWorkflowMutation.isPending || !newWorkflowPrompt.trim()}
                className="h-12 px-5 bg-purple-600 hover:bg-purple-700"
                data-testid="button-generate-workflow-centered"
              >
                {generateWorkflowMutation.isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Sparkles className="w-5 h-5" />
                )}
              </Button>
            </div>

            {/* Channel Selection - moved to top */}
            <div className={`p-4 rounded-xl border mb-4 ${channelError ? "border-red-400 bg-red-50/50 dark:bg-red-900/10" : "border-border bg-card/50"}`}>
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Outreach Channels</span>
                {channelError && <span className="text-xs text-red-500">{channelError}</span>}
              </div>
              
              <div className="flex gap-2 justify-center">
                <div 
                  className={`flex-1 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    channelEmail 
                      ? "border-purple-400 bg-purple-50 dark:bg-purple-900/20" 
                      : "border-border bg-background hover:border-purple-300"
                  }`}
                  onClick={() => { setChannelEmail(!channelEmail); setChannelError(null); }}
                  data-testid="toggle-channel-email"
                >
                  <div className="flex items-center justify-between mb-1">
                    <Mail className={`w-4 h-4 ${channelEmail ? "text-purple-600" : "text-muted-foreground"}`} />
                    <Switch 
                      checked={channelEmail} 
                      onCheckedChange={(v) => { setChannelEmail(v); setChannelError(null); }}
                      className="scale-75"
                      data-testid="switch-channel-email"
                    />
                  </div>
                  <p className={`text-xs font-medium ${channelEmail ? "text-purple-700 dark:text-purple-300" : ""}`}>Email</p>
                </div>

                <div 
                  className={`flex-1 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    channelSms 
                      ? "border-green-400 bg-green-50 dark:bg-green-900/20" 
                      : "border-border bg-background hover:border-green-300"
                  }`}
                  onClick={() => { setChannelSms(!channelSms); setChannelError(null); }}
                  data-testid="toggle-channel-sms"
                >
                  <div className="flex items-center justify-between mb-1">
                    <MessageSquare className={`w-4 h-4 ${channelSms ? "text-green-600" : "text-muted-foreground"}`} />
                    <Switch 
                      checked={channelSms} 
                      onCheckedChange={(v) => { setChannelSms(v); setChannelError(null); }}
                      className="scale-75"
                      data-testid="switch-channel-sms"
                    />
                  </div>
                  <p className={`text-xs font-medium ${channelSms ? "text-green-700 dark:text-green-300" : ""}`}>SMS</p>
                </div>

                <div 
                  className={`flex-1 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    channelLinkedin 
                      ? "border-sky-400 bg-sky-50 dark:bg-sky-900/20" 
                      : "border-border bg-background hover:border-sky-300"
                  }`}
                  onClick={() => { setChannelLinkedin(!channelLinkedin); setChannelError(null); }}
                  data-testid="toggle-channel-linkedin"
                >
                  <div className="flex items-center justify-between mb-1">
                    <Linkedin className={`w-4 h-4 ${channelLinkedin ? "text-sky-600" : "text-muted-foreground"}`} />
                    <Switch 
                      checked={channelLinkedin} 
                      onCheckedChange={(v) => { setChannelLinkedin(v); setChannelError(null); }}
                      className="scale-75"
                      data-testid="switch-channel-linkedin"
                    />
                  </div>
                  <p className={`text-xs font-medium ${channelLinkedin ? "text-sky-700 dark:text-sky-300" : ""}`}>LinkedIn</p>
                </div>
              </div>

            </div>

            <div className={`p-4 rounded-xl border mb-6 ${scheduleError ? "border-red-400 bg-red-50/50 dark:bg-red-900/10" : "border-border bg-card/50"}`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Schedule & Frequency</span>
                  {scheduleError && <span className="text-xs text-red-500">{scheduleError}</span>}
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-2">How often?</p>
                  <div className="flex flex-wrap gap-2">
                    {INTERVALS.map((interval) => (
                      <button
                        key={interval.value}
                        onClick={() => { setSelectedInterval(interval.value); setScheduleError(null); }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                          selectedInterval === interval.value
                            ? "border-purple-400 bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300"
                            : "border-border bg-background hover:border-purple-300"
                        }`}
                        data-testid={`interval-${interval.value}`}
                      >
                        {interval.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Best Time Recommendation */}
                {bestTimeData && (
                  <div 
                    onClick={applyBestTime}
                    className="flex items-center justify-between p-3 rounded-lg border-2 border-dashed border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-950/30 cursor-pointer hover:bg-green-100 dark:hover:bg-green-950/50 transition-colors"
                    data-testid="button-best-time"
                  >
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-green-600" />
                      <div>
                        <p className="text-sm font-medium text-green-700 dark:text-green-300">Best Time</p>
                        <p className="text-xs text-green-600 dark:text-green-400">
                          {bestTimeData.recommendation.label}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-green-600 dark:text-green-400">{bestTimeData.message}</p>
                      {bestTimeData.hasData && (
                        <p className="text-xs text-muted-foreground">{bestTimeData.totalEmails} emails analyzed</p>
                      )}
                    </div>
                  </div>
                )}

                <div>
                  <p className="text-xs text-muted-foreground mb-2">Which day?</p>
                  <div className="flex gap-1">
                    {DAYS_OF_WEEK.map((day) => (
                      <button
                        key={day.value}
                        onClick={() => { setSelectedDay(day.value); setScheduleError(null); }}
                        className={`flex-1 py-1.5 rounded text-xs font-medium transition-all ${
                          selectedDay === day.value
                            ? "bg-purple-600 text-white"
                            : "bg-muted hover:bg-muted/80"
                        }`}
                        data-testid={`day-${day.short.toLowerCase()}`}
                      >
                        {day.short}
                      </button>
                    ))}
                  </div>
                </div>
                  
                <div>
                  <p className="text-xs text-muted-foreground mb-2">What time?</p>
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-muted-foreground/70 mb-1">Morning</p>
                      <div className="flex flex-wrap gap-1">
                        {TIME_SLOTS.morning.map((slot) => (
                          <button
                            key={slot.value}
                            onClick={() => { setSelectedTime(slot.value); setScheduleError(null); }}
                            className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                              selectedTime === slot.value
                                ? "bg-purple-600 text-white"
                                : "bg-muted hover:bg-muted/80"
                            }`}
                            data-testid={`time-${slot.value.replace(":", "")}`}
                          >
                            {slot.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground/70 mb-1">Afternoon</p>
                      <div className="flex flex-wrap gap-1">
                        {TIME_SLOTS.afternoon.map((slot) => (
                          <button
                            key={slot.value}
                            onClick={() => { setSelectedTime(slot.value); setScheduleError(null); }}
                            className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                              selectedTime === slot.value
                                ? "bg-purple-600 text-white"
                                : "bg-muted hover:bg-muted/80"
                            }`}
                            data-testid={`time-${slot.value.replace(":", "")}`}
                          >
                            {slot.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground/70 mb-1">Evening</p>
                      <div className="flex flex-wrap gap-1">
                        {TIME_SLOTS.evening.map((slot) => (
                          <button
                            key={slot.value}
                            onClick={() => { setSelectedTime(slot.value); setScheduleError(null); }}
                            className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                              selectedTime === slot.value
                                ? "bg-purple-600 text-white"
                                : "bg-muted hover:bg-muted/80"
                            }`}
                            data-testid={`time-${slot.value.replace(":", "")}`}
                          >
                            {slot.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {isScheduleValid && selectedInterval && selectedDay !== null && selectedTime && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
                    <CheckCircle className="w-3 h-3 text-green-500" />
                    <span>
                      Runs {INTERVALS.find(i => i.value === selectedInterval)?.label?.toLowerCase() || "on schedule"} on {DAYS_OF_WEEK.find(d => d.value === selectedDay)?.label || "selected day"}s at {selectedTime}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="text-center text-xs text-muted-foreground">
              <p>After generation, you'll preview and configure your workflow before activating</p>
            </div>
          </div>
        </div>
      )}

      {/* Workflow List View - shown when workflows exist but none selected */}
      {!showCenteredCreation && !selectedWorkflow && (
        <div className="flex-1 flex flex-col">
          {/* Header with create button */}
          <div className="p-4 border-b border-border bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-950/30 dark:to-violet-950/30">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Your Workflows</h2>
              </div>
              
              {/* Inline AI creation */}
              <div className="flex gap-2 items-center mb-4">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                  </div>
                  <Input
                    placeholder="Describe a new workflow..."
                    value={newWorkflowPrompt}
                    onChange={(e) => setNewWorkflowPrompt(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !generateWorkflowMutation.isPending && newWorkflowPrompt.trim()) {
                        handleGenerateWorkflow(newWorkflowPrompt);
                      }
                    }}
                    className="pl-10 h-10 bg-white dark:bg-gray-900 border-purple-200 dark:border-purple-800 focus:border-purple-400 focus:ring-purple-400"
                    data-testid="input-workflow-prompt-list"
                  />
                </div>
                <Button
                  onClick={() => handleGenerateWorkflow(newWorkflowPrompt)}
                  disabled={generateWorkflowMutation.isPending || !newWorkflowPrompt.trim()}
                  className="h-10 px-4 bg-purple-600 hover:bg-purple-700"
                  data-testid="button-generate-workflow-list"
                >
                  {generateWorkflowMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                </Button>
              </div>

              {/* Schedule & Frequency */}
              <div className={`p-3 rounded-lg border ${scheduleError ? "border-red-400 bg-red-50/50 dark:bg-red-900/10" : "border-border bg-white/50 dark:bg-gray-900/50"}`}>
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Schedule:</span>
                      {scheduleError && <span className="text-xs text-red-500">{scheduleError}</span>}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {INTERVALS.map((interval) => (
                        <button
                          key={interval.value}
                          onClick={() => { setSelectedInterval(interval.value); setScheduleError(null); }}
                          className={`px-2 py-1 rounded text-xs font-medium transition-all border ${
                            selectedInterval === interval.value
                              ? "border-purple-400 bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300"
                              : "border-transparent bg-muted hover:border-purple-300"
                          }`}
                          data-testid={`list-interval-${interval.value}`}
                        >
                          {interval.label.replace("Every ", "")}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="flex gap-0.5">
                      {DAYS_OF_WEEK.map((day) => (
                        <button
                          key={day.value}
                          onClick={() => { setSelectedDay(day.value); setScheduleError(null); }}
                          className={`w-7 h-7 rounded text-xs font-medium transition-all ${
                            selectedDay === day.value
                              ? "bg-purple-600 text-white"
                              : "bg-muted hover:bg-muted/80"
                          }`}
                          data-testid={`list-day-${day.short.toLowerCase()}`}
                        >
                          {day.short.charAt(0)}
                        </button>
                      ))}
                    </div>
                    <Input
                      type="time"
                      value={selectedTime}
                      onChange={(e) => { setSelectedTime(e.target.value); setScheduleError(null); }}
                      className="w-24 h-7 text-xs"
                      data-testid="list-input-schedule-time"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Workflow grid */}
          <ScrollArea className="flex-1 p-6">
            <div className="max-w-4xl mx-auto">
              {isLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {workflowsList?.map((workflow) => (
                    <div
                      key={workflow.id}
                      onClick={() => loadWorkflow(workflow)}
                      className="p-4 rounded-lg border border-border bg-card hover-elevate cursor-pointer transition-all"
                      data-testid={`workflow-card-${workflow.id}`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{workflow.name}</p>
                        </div>
                        <Badge
                          variant={
                            workflow.status === "active" ? "default" :
                            workflow.status === "paused" ? "secondary" : "outline"
                          }
                          className="ml-2 text-xs"
                        >
                          {workflow.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {workflow.description || "No description"}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        {workflow.scheduleEnabled && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Scheduled
                          </span>
                        )}
                        {workflow.totalRuns !== null && workflow.totalRuns > 0 && (
                          <span className="flex items-center gap-1">
                            <Play className="w-3 h-3" />
                            {workflow.totalRuns} runs
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Workflow Editor View - shown when a workflow is selected */}
      {selectedWorkflow && (
        <>
          {/* Main canvas area */}
          <div className="flex-1 flex flex-col bg-[#1a1a2e]">
            {/* Header toolbar */}
            <div className="flex items-center justify-between p-3 border-b border-border bg-card">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleBackToList}
                  data-testid="button-back-to-list"
                >
                  <ChevronLeft className="w-5 h-5" />
                </Button>
                <h3 className="font-semibold">{selectedWorkflow.name}</h3>
                <Badge variant="outline">{selectedWorkflow.status}</Badge>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSave}
                  disabled={saveWorkflowMutation.isPending}
                  data-testid="button-save-workflow"
                >
                  <Save className="w-4 h-4 mr-1" />
                  Save
                </Button>
                <Button
                  size="sm"
                  onClick={() => runWorkflowMutation.mutate(selectedWorkflow.id)}
                  disabled={runWorkflowMutation.isPending}
                  data-testid="button-run-workflow"
                >
                  {runWorkflowMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-1" />
                  ) : (
                    <Play className="w-4 h-4 mr-1" />
                  )}
                  Run Now
                </Button>
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => deleteWorkflowMutation.mutate(selectedWorkflow.id)}
                  data-testid="button-delete-workflow"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Canvas */}
            <div className="flex-1 relative">
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                nodeTypes={nodeTypes}
                fitView
                className="bg-[#1a1a2e]"
              >
                <Background 
                  variant={BackgroundVariant.Dots} 
                  gap={20} 
                  size={1}
                  color="#2d2d44"
                />
                <Controls className="bg-card border border-border rounded-lg" />
                <MiniMap 
                  className="bg-card border border-border rounded-lg"
                  nodeColor={(node) => {
                    switch (node.type) {
                      case "trigger": return "#3B82F6";
                      case "action": return "#8B5CF6";
                      case "condition": return "#F59E0B";
                      case "delay": return "#6B7280";
                      case "end": return "#EF4444";
                      default: return "#6B7280";
                    }
                  }}
                />
              </ReactFlow>
            </div>
          </div>

          {/* Right side panel */}
          <div className="w-80 border-l border-border bg-card flex flex-col">
            {/* Panel tabs */}
            <div className="flex border-b border-border">
              <button
                onClick={() => setShowRightPanel("chat")}
                className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
                  showRightPanel === "chat"
                    ? "bg-primary/10 text-primary border-b-2 border-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                data-testid="button-panel-chat"
              >
                <Sparkles className="w-4 h-4 inline mr-1" />
                AI Edit
              </button>
              <button
                onClick={() => setShowRightPanel("scheduler")}
                className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
                  showRightPanel === "scheduler"
                    ? "bg-primary/10 text-primary border-b-2 border-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                data-testid="button-panel-scheduler"
              >
                <Calendar className="w-4 h-4 inline mr-1" />
                Schedule
              </button>
              <button
                onClick={() => {
                  setShowRightPanel("history");
                  refetchRuns();
                }}
                className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
                  showRightPanel === "history"
                    ? "bg-primary/10 text-primary border-b-2 border-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                data-testid="button-panel-history"
              >
                <History className="w-4 h-4 inline mr-1" />
                History
              </button>
            </div>

            {/* Panel content */}
            <div className="flex-1 overflow-hidden">
              {showRightPanel === "chat" && (
                <WorkflowChat
                  workflow={selectedWorkflow}
                  onWorkflowUpdate={handleWorkflowUpdate}
                  onClose={() => setShowRightPanel(null)}
                />
              )}

              {showRightPanel === "scheduler" && (
                <WorkflowScheduler
                  workflow={selectedWorkflow}
                  onClose={() => setShowRightPanel(null)}
                />
              )}

              {showRightPanel === "history" && (
                <ScrollArea className="h-full p-4">
                  {!runHistory || runHistory.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <PlayCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No runs yet</p>
                      <p className="text-xs mt-1">Run your workflow to see history</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {runHistory.map((run) => (
                        <div
                          key={run.id}
                          className="p-3 rounded-lg border border-border bg-muted/30"
                          data-testid={`run-history-item-${run.id}`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {run.status === "completed" && (
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              )}
                              {run.status === "failed" && (
                                <XCircle className="w-4 h-4 text-red-500" />
                              )}
                              {run.status === "running" && (
                                <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                              )}
                              {run.status === "pending" && (
                                <Clock className="w-4 h-4 text-yellow-500" />
                              )}
                              <span className="font-medium text-sm capitalize">
                                {run.status}
                              </span>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {run.triggeredBy}
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground space-y-1">
                            <div className="flex justify-between">
                              <span>Started:</span>
                              <span>
                                {run.startedAt
                                  ? new Date(run.startedAt).toLocaleString()
                                  : "Not started"}
                              </span>
                            </div>
                            {run.completedAt && (
                              <div className="flex justify-between">
                                <span>Completed:</span>
                                <span>{new Date(run.completedAt).toLocaleString()}</span>
                              </div>
                            )}
                            <Separator className="my-2" />
                            <div className="grid grid-cols-2 gap-2">
                              {run.emailsSent !== null && run.emailsSent > 0 && (
                                <div className="flex items-center gap-1">
                                  <Mail className="w-3 h-3" />
                                  <span>{run.emailsSent} emails</span>
                                </div>
                              )}
                              {run.smsSent !== null && run.smsSent > 0 && (
                                <div className="flex items-center gap-1">
                                  <MessageSquare className="w-3 h-3" />
                                  <span>{run.smsSent} SMS</span>
                                </div>
                              )}
                              {run.linkedinSent !== null && run.linkedinSent > 0 && (
                                <div className="flex items-center gap-1">
                                  <Linkedin className="w-3 h-3" />
                                  <span>{run.linkedinSent} LinkedIn</span>
                                </div>
                              )}
                              {run.leadsFound !== null && run.leadsFound > 0 && (
                                <div className="flex items-center gap-1">
                                  <Users className="w-3 h-3" />
                                  <span>{run.leadsFound} leads</span>
                                </div>
                              )}
                            </div>
                            {run.errorMessage && (
                              <div className="mt-2 p-2 bg-red-500/10 rounded text-red-400 text-xs">
                                {run.errorMessage}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
