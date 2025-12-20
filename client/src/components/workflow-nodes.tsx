import { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { 
  Search, Mail, MessageSquare, Linkedin, Clock, 
  GitBranch, CheckCircle, XCircle, Play, Square,
  Users, Sparkles, Webhook, ArrowRight
} from "lucide-react";

const nodeBaseStyle = "rounded-lg shadow-lg border-2 min-w-[180px] text-white";

const getActionIcon = (actionType?: string) => {
  switch (actionType) {
    case "find_leads": return <Search className="w-4 h-4" />;
    case "send_email": return <Mail className="w-4 h-4" />;
    case "send_sms": return <MessageSquare className="w-4 h-4" />;
    case "send_linkedin_connection":
    case "send_linkedin_message": return <Linkedin className="w-4 h-4" />;
    case "wait": return <Clock className="w-4 h-4" />;
    case "check_reply":
    case "check_open":
    case "check_click": return <GitBranch className="w-4 h-4" />;
    case "ai_personalize": return <Sparkles className="w-4 h-4" />;
    case "webhook": return <Webhook className="w-4 h-4" />;
    case "add_to_campaign": return <Users className="w-4 h-4" />;
    default: return <ArrowRight className="w-4 h-4" />;
  }
};

export const TriggerNode = memo(({ data }: NodeProps) => {
  return (
    <div className={`${nodeBaseStyle} bg-[#1e40af] border-[#3b82f6]`}>
      <Handle type="target" position={Position.Top} className="w-3 h-3" />
      <div className="p-4">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-6 h-6 rounded bg-blue-400/30 flex items-center justify-center">
            <Play className="w-3.5 h-3.5" />
          </div>
          <span className="font-semibold text-sm">{data.label || "Start"}</span>
        </div>
        {data.description && (
          <p className="text-xs text-blue-200 mt-1">{data.description}</p>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </div>
  );
});

export const ActionNode = memo(({ data }: NodeProps) => {
  const actionType = data.actionType as string;
  let bgColor = "bg-[#5b21b6]";
  let borderColor = "border-[#8b5cf6]";
  let iconBgColor = "bg-purple-400/30";
  
  if (actionType === "send_email") {
    bgColor = "bg-[#7e22ce]";
    borderColor = "border-[#a855f7]";
    iconBgColor = "bg-purple-400/30";
  } else if (actionType === "send_sms") {
    bgColor = "bg-[#047857]";
    borderColor = "border-[#10b981]";
    iconBgColor = "bg-emerald-400/30";
  } else if (actionType?.includes("linkedin")) {
    bgColor = "bg-[#0a4a8c]";
    borderColor = "border-[#0a66c2]";
    iconBgColor = "bg-blue-400/30";
  } else if (actionType === "find_leads") {
    bgColor = "bg-[#0e7490]";
    borderColor = "border-[#22d3ee]";
    iconBgColor = "bg-cyan-400/30";
  }

  return (
    <div className={`${nodeBaseStyle} ${bgColor} ${borderColor}`}>
      <Handle type="target" position={Position.Top} className="w-3 h-3" />
      <div className="p-4">
        <div className="flex items-center gap-2 mb-1">
          <div className={`w-6 h-6 rounded ${iconBgColor} flex items-center justify-center`}>
            {getActionIcon(actionType)}
          </div>
          <span className="font-semibold text-sm">{data.label || "Action"}</span>
        </div>
        {data.description && (
          <p className="text-xs text-white/70 mt-1">{data.description}</p>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </div>
  );
});

export const ConditionNode = memo(({ data }: NodeProps) => {
  return (
    <div className={`${nodeBaseStyle} bg-[#92400e] border-[#f59e0b]`}>
      <Handle type="target" position={Position.Top} className="w-3 h-3" />
      <div className="p-4">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-6 h-6 rounded bg-amber-400/30 flex items-center justify-center">
            <GitBranch className="w-3.5 h-3.5" />
          </div>
          <span className="font-semibold text-sm">{data.label || "Condition"}</span>
        </div>
        {data.description && (
          <p className="text-xs text-amber-200 mt-1">{data.description}</p>
        )}
        <div className="flex justify-between mt-3 text-xs">
          <span className="flex items-center gap-1 text-green-300">
            <CheckCircle className="w-3 h-3" /> Yes
          </span>
          <span className="flex items-center gap-1 text-red-300">
            <XCircle className="w-3 h-3" /> No
          </span>
        </div>
      </div>
      <Handle 
        type="source" 
        position={Position.Bottom} 
        id="yes"
        className="w-3 h-3"
        style={{ left: "30%" }}
      />
      <Handle 
        type="source" 
        position={Position.Bottom} 
        id="no"
        className="w-3 h-3"
        style={{ left: "70%" }}
      />
    </div>
  );
});

export const DelayNode = memo(({ data }: NodeProps) => {
  return (
    <div className={`${nodeBaseStyle} bg-[#374151] border-[#6b7280]`}>
      <Handle type="target" position={Position.Top} className="w-3 h-3" />
      <div className="p-4">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-6 h-6 rounded bg-gray-400/30 flex items-center justify-center">
            <Clock className="w-3.5 h-3.5" />
          </div>
          <span className="font-semibold text-sm">{data.label || "Wait"}</span>
        </div>
        {data.description && (
          <p className="text-xs text-gray-300 mt-1">{data.description}</p>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </div>
  );
});

export const EndNode = memo(({ data }: NodeProps) => {
  return (
    <div className={`${nodeBaseStyle} bg-[#991b1b] border-[#ef4444]`}>
      <Handle type="target" position={Position.Top} className="w-3 h-3" />
      <div className="p-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-red-400/30 flex items-center justify-center">
            <Square className="w-3.5 h-3.5" />
          </div>
          <span className="font-semibold text-sm">{data.label || "End"}</span>
        </div>
      </div>
    </div>
  );
});

TriggerNode.displayName = "TriggerNode";
ActionNode.displayName = "ActionNode";
ConditionNode.displayName = "ConditionNode";
DelayNode.displayName = "DelayNode";
EndNode.displayName = "EndNode";
