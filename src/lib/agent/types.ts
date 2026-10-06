// France Justice AI Agent System - Core Architecture Types

export const AGENT_TYPES_VERSION = '1.0';

export type LLMProvider = 'google' | 'openai' | 'anthropic' | 'deepseek' | 'francejustice';

export interface LLMModelConfig {
  id: string;
  name: string;
  provider: LLMProvider;
  contextWindow: string;
  description: string;
  badge: string;
  requiresCustomApiKey: boolean;
  endpoint?: string;
  defaultModelName: string;
}

export interface AgentPersona {
  id: string;
  name: string;
  roleTitle: string;
  icon: string;
  shortDesc: string;
  systemPrompt: string;
  suggestedPrompts: { title: string; prompt: string; iconName?: string }[];
  defaultTools: string[];
}

export interface ToolParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description: string;
  required: boolean;
}

export interface ToolDefinition {
  id: string;
  name: string;
  category: 'code' | 'calcul' | 'delai' | 'jurisprudence' | 'dossier' | 'redaction';
  description: string;
  parameters: ToolParameter[];
}

export interface ToolCall {
  id: string;
  toolId: string;
  toolName: string;
  input: Record<string, any>;
  output?: any;
  status: 'pending' | 'success' | 'failed';
  durationMs?: number;
  timestamp: string;
  error?: string;
}

export type RunStatus = 'queued' | 'analyzing' | 'calling_tool' | 'reasoning' | 'generating' | 'completed' | 'failed';

export interface AgentRunStep {
  id: string;
  status: RunStatus;
  label: string;
  detail?: string;
  toolCall?: ToolCall;
  timestamp: string;
}

export interface AgentRun {
  id: string;
  threadId: string;
  modelId: string;
  personaId: string;
  status: RunStatus;
  startedAt: string;
  completedAt?: string;
  steps: AgentRunStep[];
  toolsCalled: ToolCall[];
  error?: string;
}

export interface LegalPrognosis {
  score: number; // 0 à 100%
  label: string; // ex: "Chances favorables (85%)"
  riskLevel: 'faible' | 'modéré' | 'élevé';
  strengthText: string; // Évaluation de la force probante
  prescriptionStatus: 'respecté' | 'urgent' | 'vigilance';
}

export interface ProceduralStep {
  stepNumber: number;
  timeframe: string; // ex: "J+0 à J+15"
  title: string;
  description: string;
  badge?: string;
}

export interface AgentMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  files?: string[];
  run?: AgentRun;
  toolCalls?: ToolCall[];
  sources?: {
    title: string;
    uri: string;
    category: 'officiel' | 'externe' | 'juridiction';
    badge: string;
    description: string;
  }[];
  suggestions?: string[];
  automations?: {
    id: string;
    label: string;
    description: string;
    actionPrompt: string;
  }[];
  diagnosticData?: any;
  thinking?: string; // Raisonnement profond dépliable (comme Claude 3.7 Sonnet / OpenAI o1/o3)
  thinkingDurationMs?: number; // Durée de réflexion en millisecondes
  prognosis?: LegalPrognosis; // Score d'évaluation du litige et chances de succès
  timelineRoadmap?: ProceduralStep[]; // Frise chronologique d'action étape par étape
  isEdited?: boolean;
}

export interface AgentThread {
  id: string;
  title: string;
  userId?: string;
  modelId: string;
  personaId: string;
  jurisdictionId?: string;
  customSystemPrompt?: string;
  createdAt: string;
  updatedAt: string;
  messages: AgentMessage[];
  uploadedFiles: string[];
  extractedText?: string;
  lastRunStatus?: RunStatus;
}

export interface UserApiKeys {
  gemini?: string;
  openai?: string;
  anthropic?: string;
  deepseek?: string;
}
