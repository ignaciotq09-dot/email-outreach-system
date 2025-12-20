import { openai, callOpenAIWithTimeout } from "../ai/openai-client";
import type { WorkflowNode, WorkflowEdge, WorkflowConversationMessage } from "@shared/schema";

const WORKFLOW_SYSTEM_PROMPT = `You are an expert workflow automation designer. Your job is to convert natural language descriptions into structured workflow graphs for an outreach automation system.

AVAILABLE NODE TYPES:
1. TRIGGER NODES (starting points):
   - "find_leads" - Search for leads using Apollo.io with filters (job title, industry, company size, location)
   - "manual_start" - Manually triggered workflow

2. ACTION NODES:
   - "send_email" - Send personalized email (requires subject, body template)
   - "send_sms" - Send SMS message (requires message template, max 160 chars)
   - "send_linkedin_connection" - Send LinkedIn connection request (requires message)
   - "send_linkedin_message" - Send LinkedIn direct message (requires message)
   - "ai_personalize" - Use AI to personalize message content
   - "add_to_campaign" - Add contact to an existing campaign
   - "update_contact" - Update contact properties
   - "webhook" - Call external webhook

3. CONDITION NODES (branching logic):
   - "check_reply" - Check if contact replied (branches: replied/no_reply)
   - "check_open" - Check if email was opened (branches: opened/not_opened)
   - "check_click" - Check if link was clicked (branches: clicked/not_clicked)
   - "check_connection" - Check if LinkedIn connection was accepted

4. DELAY NODES:
   - "wait" - Wait for a specified duration (hours, days, weeks)

5. END NODES:
   - "end" - End the workflow for this contact

VISUAL DESIGN:
Each node should have:
- Unique ID (e.g., "node_1", "node_2")
- Position (x, y coordinates) - arrange nodes in a clear flow
- Color based on type:
  - Trigger: "#3B82F6" (blue)
  - Email: "#8B5CF6" (purple)
  - SMS: "#10B981" (green)
  - LinkedIn: "#0A66C2" (linkedin blue)
  - Condition: "#F59E0B" (amber)
  - Delay: "#6B7280" (gray)
  - End: "#EF4444" (red)

LAYOUT RULES:
1. Start nodes at the top (y: 0)
2. Flow downward, increasing y by 150 for each step
3. When branching (conditions), spread x coordinates horizontally (±200)
4. Group related actions in containers when applicable
5. Maintain clear spacing between nodes

OUTPUT FORMAT:
Return a JSON object with:
{
  "nodes": [array of WorkflowNode objects],
  "edges": [array of WorkflowEdge objects],
  "summary": "Brief description of what this workflow does"
}

WorkflowNode format:
{
  "id": "node_1",
  "type": "trigger" | "action" | "condition" | "delay" | "end",
  "actionType": "specific action type from list above",
  "position": { "x": number, "y": number },
  "data": {
    "label": "Display name for the node",
    "description": "What this step does",
    "icon": "icon name",
    "color": "hex color",
    "config": { ...step-specific configuration }
  }
}

WorkflowEdge format:
{
  "id": "edge_1",
  "source": "node_1",
  "target": "node_2",
  "sourceHandle": "bottom" (or "right" for yes, "left" for no),
  "targetHandle": "top",
  "label": "Optional label for condition branches",
  "condition": { "type": "reply" | "no_reply" | "open" | "always" }
}

IMPORTANT:
- Always start with a trigger node
- Always end branches with an end node
- Connect all nodes with edges
- Position nodes logically for visual clarity
- Include realistic placeholder content for messages
- Make workflows practical and following outreach best practices`;

export interface GenerateWorkflowResult {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  summary: string;
}

export interface RefineWorkflowResult extends GenerateWorkflowResult {
  changes: string;
}

export async function generateWorkflowFromDescription(
  description: string,
  conversationHistory: WorkflowConversationMessage[] = []
): Promise<GenerateWorkflowResult> {
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: WORKFLOW_SYSTEM_PROMPT },
  ];

  for (const msg of conversationHistory) {
    messages.push({
      role: msg.role,
      content: msg.content,
    });
  }

  messages.push({
    role: "user",
    content: `Create a workflow based on this description:\n\n"${description}"\n\nReturn ONLY valid JSON with nodes, edges, and summary.`,
  });

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages,
    response_format: { type: "json_object" },
    temperature: 0.7,
  });

  const content = response.choices[0].message.content;
  if (!content) {
    throw new Error("No response from AI");
  }

  const result = JSON.parse(content);
  return {
    nodes: result.nodes || [],
    edges: result.edges || [],
    summary: result.summary || "",
  };
}

export async function refineWorkflow(
  currentNodes: WorkflowNode[],
  currentEdges: WorkflowEdge[],
  refinementRequest: string,
  conversationHistory: WorkflowConversationMessage[] = []
): Promise<RefineWorkflowResult> {
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: WORKFLOW_SYSTEM_PROMPT },
  ];

  for (const msg of conversationHistory) {
    messages.push({
      role: msg.role,
      content: msg.content,
    });
  }

  messages.push({
    role: "user",
    content: `Here is the current workflow:

NODES:
${JSON.stringify(currentNodes, null, 2)}

EDGES:
${JSON.stringify(currentEdges, null, 2)}

USER REQUEST:
"${refinementRequest}"

Modify the workflow according to the request. Return ONLY valid JSON with:
- nodes: updated array of all nodes
- edges: updated array of all edges  
- summary: what the workflow now does
- changes: brief description of what you changed`,
  });

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages,
    response_format: { type: "json_object" },
    temperature: 0.7,
  });

  const content = response.choices[0].message.content;
  if (!content) {
    throw new Error("No response from AI");
  }

  const result = JSON.parse(content);
  return {
    nodes: result.nodes || [],
    edges: result.edges || [],
    summary: result.summary || "",
    changes: result.changes || "",
  };
}

export async function suggestWorkflowImprovements(
  nodes: WorkflowNode[],
  edges: WorkflowEdge[]
): Promise<string[]> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `You are an expert in outreach automation. Analyze workflows and suggest improvements for better engagement and conversion rates. Return a JSON array of suggestion strings.`,
      },
      {
        role: "user",
        content: `Analyze this workflow and suggest up to 5 improvements:

NODES:
${JSON.stringify(nodes, null, 2)}

EDGES:
${JSON.stringify(edges, null, 2)}

Return JSON: { "suggestions": ["suggestion 1", "suggestion 2", ...] }`,
      },
    ],
    response_format: { type: "json_object" },
    temperature: 0.7,
  });

  const content = response.choices[0].message.content;
  if (!content) return [];

  const result = JSON.parse(content);
  return result.suggestions || [];
}

export function validateWorkflow(nodes: WorkflowNode[], edges: WorkflowEdge[]): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (nodes.length === 0) {
    errors.push("Workflow must have at least one node");
    return { valid: false, errors, warnings };
  }

  const triggerNodes = nodes.filter(n => n.type === "trigger");
  if (triggerNodes.length === 0) {
    errors.push("Workflow must have a trigger node");
  } else if (triggerNodes.length > 1) {
    warnings.push("Multiple trigger nodes found - only the first will be used");
  }

  const endNodes = nodes.filter(n => n.type === "end");
  if (endNodes.length === 0) {
    warnings.push("No end nodes found - workflow may run indefinitely");
  }

  const nodeIds = new Set(nodes.map(n => n.id));
  for (const edge of edges) {
    if (!nodeIds.has(edge.source)) {
      errors.push(`Edge references non-existent source node: ${edge.source}`);
    }
    if (!nodeIds.has(edge.target)) {
      errors.push(`Edge references non-existent target node: ${edge.target}`);
    }
  }

  const connectedNodes = new Set<string>();
  for (const edge of edges) {
    connectedNodes.add(edge.source);
    connectedNodes.add(edge.target);
  }
  
  for (const node of nodes) {
    if (node.type !== "trigger" && !connectedNodes.has(node.id)) {
      warnings.push(`Node "${node.data.label}" is not connected to the workflow`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
