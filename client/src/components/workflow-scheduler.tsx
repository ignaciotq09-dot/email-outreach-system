import { useState, useEffect, useMemo } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Clock, Calendar, Loader2, CheckCircle, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Workflow } from "@shared/schema";

interface WorkflowSchedulerProps {
  workflow: Workflow;
  onClose: () => void;
}

const INTERVALS = [
  { value: "1-week", label: "Every week", unit: "week", multiplier: 1 },
  { value: "2-weeks", label: "Every 2 weeks", unit: "week", multiplier: 2 },
  { value: "1-month", label: "Every month", unit: "month", multiplier: 1 },
  { value: "2-months", label: "Every 2 months", unit: "month", multiplier: 2 },
  { value: "4-months", label: "Every 4 months", unit: "month", multiplier: 4 },
  { value: "6-months", label: "Every 6 months", unit: "month", multiplier: 6 },
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

const TIMEZONES = [
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "America/Chicago", label: "Central Time (CT)" },
  { value: "America/Denver", label: "Mountain Time (MT)" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "UTC", label: "UTC" },
  { value: "Europe/London", label: "London (GMT)" },
];

export default function WorkflowScheduler({ workflow, onClose }: WorkflowSchedulerProps) {
  const { toast } = useToast();
  
  const parseExistingSchedule = () => {
    if (workflow.scheduleType && workflow.scheduleInterval) {
      return `${workflow.scheduleInterval}-${workflow.scheduleType}${workflow.scheduleInterval > 1 ? 's' : ''}`;
    }
    return "";
  };
  
  const [enabled, setEnabled] = useState(workflow.scheduleEnabled || false);
  const [selectedInterval, setSelectedInterval] = useState<string>(parseExistingSchedule());
  const [selectedDay, setSelectedDay] = useState<number>(
    (workflow.scheduleDays as number[])?.[0] ?? 1
  );
  const [time, setTime] = useState(workflow.scheduleTime || "09:00");
  const [timezone, setTimezone] = useState(workflow.scheduleTimezone || "America/New_York");

  const selectedIntervalData = useMemo(() => {
    return INTERVALS.find(i => i.value === selectedInterval);
  }, [selectedInterval]);

  const scheduleMutation = useMutation({
    mutationFn: async () => {
      const intervalData = selectedIntervalData;
      return apiRequest("POST", `/api/workflows/${workflow.id}/schedule`, {
        enabled,
        intervalUnit: intervalData?.unit || "week",
        intervalMultiplier: intervalData?.multiplier || 1,
        day: selectedDay,
        time,
        timezone,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workflows"] });
      toast({
        title: enabled ? "Schedule activated" : "Schedule disabled",
        description: enabled
          ? `Workflow will run ${selectedIntervalData?.label?.toLowerCase()} on ${DAYS_OF_WEEK[selectedDay].label}s at ${time}`
          : "Workflow will not run automatically",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update schedule",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const calculateNextRun = () => {
    if (!enabled || !selectedInterval || !selectedIntervalData) return null;
    
    const now = new Date();
    const [hours, minutes] = time.split(":").map(Number);
    
    let nextRun = new Date(now);
    nextRun.setHours(hours, minutes, 0, 0);
    
    const currentDay = now.getDay();
    let daysUntilNext = selectedDay - currentDay;
    
    if (daysUntilNext < 0 || (daysUntilNext === 0 && now >= nextRun)) {
      daysUntilNext += 7;
    }
    
    nextRun.setDate(nextRun.getDate() + daysUntilNext);
    
    return nextRun;
  };

  const calculateSubsequentRun = () => {
    const firstRun = calculateNextRun();
    if (!firstRun || !selectedIntervalData) return null;
    
    const subsequentRun = new Date(firstRun);
    
    if (selectedIntervalData.unit === "week") {
      subsequentRun.setDate(subsequentRun.getDate() + (selectedIntervalData.multiplier * 7));
    } else if (selectedIntervalData.unit === "month") {
      subsequentRun.setMonth(subsequentRun.getMonth() + selectedIntervalData.multiplier);
      while (subsequentRun.getDay() !== selectedDay) {
        subsequentRun.setDate(subsequentRun.getDate() + 1);
      }
    }
    
    return subsequentRun;
  };

  const formatNextRun = () => {
    const nextRun = calculateNextRun();
    if (!nextRun) return "Select an interval to see next run";
    
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    };
    
    return nextRun.toLocaleDateString('en-US', options);
  };

  const formatSubsequentRun = () => {
    const subsequentRun = calculateSubsequentRun();
    if (!subsequentRun) return null;
    
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    };
    
    return subsequentRun.toLocaleDateString('en-US', options);
  };

  const getIntervalDescription = () => {
    if (!selectedIntervalData) return "";
    const dayName = DAYS_OF_WEEK[selectedDay].label;
    return `Runs ${selectedIntervalData.label.toLowerCase()} on ${dayName} at ${time}`;
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 p-4 space-y-6 overflow-y-auto">
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-sm font-medium">Enable Schedule</Label>
            <p className="text-xs text-muted-foreground mt-0.5">
              Run this workflow automatically
            </p>
          </div>
          <Switch
            checked={enabled}
            onCheckedChange={setEnabled}
            data-testid="switch-schedule-enabled"
          />
        </div>

        {enabled && (
          <>
            <div className="space-y-3">
              <Label className="text-sm font-medium">How often?</Label>
              <div className="grid grid-cols-2 gap-2">
                {INTERVALS.map((interval) => (
                  <button
                    key={interval.value}
                    onClick={() => setSelectedInterval(interval.value)}
                    className={`p-3 rounded-lg border text-sm font-medium transition-all ${
                      selectedInterval === interval.value
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-card hover:border-primary/50"
                    }`}
                    data-testid={`interval-${interval.value}`}
                  >
                    {interval.label}
                  </button>
                ))}
              </div>
            </div>

            {selectedInterval && (
              <>
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Which day?</Label>
                  <div className="flex flex-wrap gap-1">
                    {DAYS_OF_WEEK.map((day) => (
                      <button
                        key={day.value}
                        onClick={() => setSelectedDay(day.value)}
                        className={`flex-1 min-w-[40px] py-2 rounded-lg text-xs font-medium transition-all ${
                          selectedDay === day.value
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted hover:bg-muted/80"
                        }`}
                        data-testid={`day-${day.short.toLowerCase()}`}
                      >
                        {day.short}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-medium">What time?</Label>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <Input
                      type="time"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="w-32"
                      data-testid="input-schedule-time"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Timezone</Label>
                  <Select value={timezone} onValueChange={setTimezone}>
                    <SelectTrigger data-testid="select-timezone">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIMEZONES.map((tz) => (
                        <SelectItem key={tz.value} value={tz.value}>
                          {tz.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg space-y-3">
                  <div className="flex items-start gap-2">
                    <Calendar className="w-4 h-4 text-primary mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-primary">First run:</p>
                      <p className="text-sm mt-0.5">{formatNextRun()}</p>
                    </div>
                  </div>
                  {formatSubsequentRun() && (
                    <div className="flex items-start gap-2 pl-6">
                      <div>
                        <p className="text-xs text-muted-foreground">Then again on:</p>
                        <p className="text-sm">{formatSubsequentRun()}</p>
                      </div>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground pt-1 border-t border-primary/10">
                    {getIntervalDescription()}
                  </p>
                </div>

                <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
                  <Info className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                  <p className="text-xs text-muted-foreground">
                    If today is past the selected day, the workflow will run on the next occurrence 
                    of that day, then repeat according to your chosen interval.
                  </p>
                </div>
              </>
            )}
          </>
        )}
      </div>

      <div className="p-4 border-t border-border">
        <Button
          className="w-full"
          onClick={() => scheduleMutation.mutate()}
          disabled={scheduleMutation.isPending || (enabled && !selectedInterval)}
          data-testid="button-save-schedule"
        >
          {scheduleMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <CheckCircle className="w-4 h-4 mr-2" />
          )}
          Save Schedule
        </Button>
      </div>
    </div>
  );
}
