import type { WorkflowNode, WorkflowEdge } from "@shared/schema";
import type { ApolloLead } from "../apollo-service";

export interface ExecutionContext {
  workflowId: number;
  runId: number;
  userId: number;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  currentNodeId: string;
  contactId?: number;
  variables: Record<string, any>;
  channels: { email?: boolean; sms?: boolean; linkedin?: boolean };
  leads: ApolloLead[];
}

export interface ActionResult {
  success: boolean;
  output?: any;
  error?: string;
  nextNodeId?: string;
}
