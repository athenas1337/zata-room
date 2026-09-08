import { SafetyConfig, SafetyEventType } from '@/types';
import { computeMessageSimilarity, detectHollowEcho } from './similarity';

export interface SafetyCheckContext {
  currentTurn: number;
  maxTurns: number;
  totalTokens: number;
  estimatedCostUsd: number;
  safetyConfig: SafetyConfig;
  recentAgentMessages: Array<{
    turnNumber: number;
    senderRole: string;
    content: string;
  }>;
  isStopRequested?: boolean;
}

export interface SafetyEvaluation {
  shouldHalt: boolean;
  type?: SafetyEventType;
  reason?: string;
  repetitionScore?: number;
  echoCount?: number;
}

/**
 * Anti-Infinite-Loop Safety Evaluator.
 * Checks:
 * 1. Manual Stop flag (instant halt)
 * 2. Hard Cap Turn Limit (e.g. >= 50 turns)
 * 3. Budget / Token Guard (cost threshold)
 * 4. Repetition Detector (semantic / N-gram similarity on consecutive turns)
 * 5. Hollow Echo / False Agreement Loop (agents politely agreeing in a dead-end circle)
 */
export function evaluateSafetyGuards(context: SafetyCheckContext): SafetyEvaluation {
  const {
    currentTurn,
    maxTurns,
    estimatedCostUsd,
    safetyConfig,
    recentAgentMessages,
    isStopRequested,
  } = context;

  // 1. Manual Stop has occurred
  if (isStopRequested) {
    return {
      shouldHalt: true,
      type: 'MANUAL_STOP',
      reason: 'Loop manually stopped by the human director.',
    };
  }

  // 2. Hard Cap Auto-Pause
  const effectiveMaxTurns = maxTurns || safetyConfig.maxTurns || 50;
  if (currentTurn >= effectiveMaxTurns) {
    return {
      shouldHalt: true,
      type: 'HARD_CAP_REACHED',
      reason: `Hard cap limit reached (${currentTurn}/${effectiveMaxTurns} turns) without human confirmation. Room auto-paused for safety.`,
    };
  }

  // 3. Token & Budget Guard
  if (safetyConfig.maxBudgetUsd > 0 && estimatedCostUsd >= safetyConfig.maxBudgetUsd) {
    return {
      shouldHalt: true,
      type: 'BUDGET_EXCEEDED',
      reason: `Estimated session cost ($${estimatedCostUsd.toFixed(4)}) reached or exceeded the configured budget cap ($${safetyConfig.maxBudgetUsd.toFixed(2)}).`,
    };
  }

  // 4. Repetition & Semantic Looping Detector
  if (recentAgentMessages.length >= 3) {
    const threshold = safetyConfig.repetitionThreshold || 0.85;

    // Group messages by sender to check if any individual agent is repeating itself
    const messagesBySender = new Map<string, string[]>();
    for (const msg of recentAgentMessages) {
      const list = messagesBySender.get(msg.senderRole) || [];
      list.push(msg.content);
      messagesBySender.set(msg.senderRole, list);
    }

    // Check each agent's consecutive messages
    for (const [sender, history] of messagesBySender.entries()) {
      if (history.length >= 3) {
        // Compare last 3 messages: msg[N] vs msg[N-1], msg[N-1] vs msg[N-2]
        const last = history[history.length - 1];
        const prev1 = history[history.length - 2];
        const prev2 = history[history.length - 3];

        const sim1 = computeMessageSimilarity(last, prev1);
        const sim2 = computeMessageSimilarity(prev1, prev2);

        if (sim1 >= threshold && sim2 >= threshold) {
          return {
            shouldHalt: true,
            type: 'REPETITION_DETECTED',
            reason: `Agent '${sender}' repeated similar responses across 3 consecutive turns (similarity: ${(Math.max(sim1, sim2) * 100).toFixed(1)}% >= ${(threshold * 100).toFixed(1)}%). Auto-paused to prevent infinite loop.`,
            repetitionScore: Math.max(sim1, sim2),
          };
        }
      }
    }

    // 5. Hollow Agreement / False Consensus Echo Loop
    // Detects when agents bounce polite empty confirmations back and forth
    const echoThreshold = safetyConfig.echoThreshold || 0.8;
    const last3Overall = recentAgentMessages.slice(-3);
    const echoCount = last3Overall.filter(m => detectHollowEcho(m.content)).length;

    if (echoCount >= 3) {
      return {
        shouldHalt: true,
        type: 'REPETITION_DETECTED',
        reason: `Hollow consensus detected: agents have exchanged 3 consecutive turns of repetitive agreement without substantial task progression. Auto-paused.`,
        echoCount,
      };
    }
  }

  return { shouldHalt: false };
}

/**
 * Calculate estimated token cost based on model families.
 * Standard rough estimates per 1k tokens.
 */
export function estimateTokenCost(
  modelName: string,
  promptTokens: number,
  completionTokens: number
): number {
  const model = modelName.toLowerCase();

  let promptRatePer1k = 0.0025; // Default ~$2.50 per 1M tokens ($0.0025/1k)
  let completionRatePer1k = 0.01; // Default ~$10 per 1M tokens ($0.01/1k)

  if (model.includes('gpt-4o-mini') || model.includes('gemini-1.5-flash') || model.includes('gemini-2.5-flash') || model.includes('haiku')) {
    promptRatePer1k = 0.00015;
    completionRatePer1k = 0.0006;
  } else if (model.includes('gpt-4o') || model.includes('sonnet') || model.includes('gemini-1.5-pro') || model.includes('gemini-2.5-pro')) {
    promptRatePer1k = 0.003;
    completionRatePer1k = 0.015;
  } else if (model.includes('o1') || model.includes('opus')) {
    promptRatePer1k = 0.015;
    completionRatePer1k = 0.06;
  }

  const cost = (promptTokens / 1000) * promptRatePer1k + (completionTokens / 1000) * completionRatePer1k;
  return Number(cost.toFixed(6));
}
