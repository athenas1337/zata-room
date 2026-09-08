export type RoomStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'ARCHIVED';

export type SafetyEventType =
  | 'MANUAL_STOP'
  | 'HARD_CAP_REACHED'
  | 'REPETITION_DETECTED'
  | 'BUDGET_EXCEEDED'
  | 'CHECKPOINT_WAITING'
  | 'API_KEY_REVOKED'
  | 'ERROR_HALT';

export type ProviderType = 'OPENAI' | 'ANTHROPIC' | 'GOOGLE' | 'CUSTOM_GATEWAY';

export interface SafetyConfig {
  repetitionThreshold: number; // e.g. 0.85 (85%)
  maxTurns: number;            // default 50
  maxBudgetUsd: number;        // e.g. 2.00
  echoThreshold: number;       // e.g. 0.80
  requireApprovalOnAction?: boolean;
}

export interface ParticipantDTO {
  id: string;
  roomId: string;
  userId: string;
  agentName: string;
  roleLabel: string;
  avatarColor: string;
  systemPrompt: string;
  provider: ProviderType;
  modelName: string;
  keyMask: string;
  baseUrl?: string | null;
  turnOrder: number;
  createdAt: string;
}

export interface MessageDTO {
  id: string;
  roomId: string;
  participantId?: string | null;
  senderRole: string;
  senderName: string;
  content: string;
  tokenCount: number;
  turnNumber: number;
  isCheckpoint: boolean;
  toolCalls?: any;
  createdAt: string;
}

export interface WorkspaceItemDTO {
  id: string;
  roomId: string;
  key: string;
  title: string;
  itemType: 'task_list' | 'scratchpad' | 'code_snippet' | 'decision_log';
  value: unknown;
  updatedBy: string;
  updatedAt: string;
}

export interface SafetyEventDTO {
  id: string;
  roomId: string;
  type: SafetyEventType;
  detail: string;
  turn: number;
  createdAt: string;
}

export interface RoomDetailDTO {
  id: string;
  name: string;
  goal: string;
  status: RoomStatus;
  currentTurn: number;
  maxTurns: number;
  turnDelaySec: number;
  activeAgentIdx: number;
  isProcessing: boolean;
  safetyConfig: SafetyConfig;
  totalTokens: number;
  estimatedCost: number;
  createdById: string;
  participants: ParticipantDTO[];
  messages: MessageDTO[];
  workspaceItems: WorkspaceItemDTO[];
  safetyEvents: SafetyEventDTO[];
  createdAt: string;
  updatedAt: string;
}

export interface SSEPayload {
  type:
    | 'STATUS_UPDATE'
    | 'AGENT_THINKING'
    | 'AGENT_MESSAGE'
    | 'COUNTDOWN'
    | 'SAFETY_EVENT'
    | 'WORKSPACE_UPDATE'
    | 'TURN_START'
    | 'ERROR';
  data: unknown;
  timestamp: number;
}

export interface TurnExecutionResult {
  success: boolean;
  haltReason?: SafetyEventType;
  message?: MessageDTO;
  tokensUsed?: number;
  costUsd?: number;
  nextTurnIndex?: number;
  delayRemainingSec?: number;
  error?: string;
}
