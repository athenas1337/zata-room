import { LLMRequestOptions, LLMResponse, ProviderAdapter } from './adapter';

export class SimulatedAdapter implements ProviderAdapter {
  async complete(options: LLMRequestOptions): Promise<LLMResponse> {
    // Artificial small delay to simulate network latency / reasoning (400-800ms)
    await new Promise(resolve => setTimeout(resolve, 500));

    const role = options.messages[0]?.content || '';
    const lastUserMsg = [...options.messages].reverse().find(m => m.role === 'user')?.content || '';
    const turnCount = options.messages.length;

    let content = '';
    let toolCalls: any[] | undefined = undefined;

    if (role.includes('Architect')) {
      content = `[Architectural Analysis]\nI have evaluated the current directives and system requirements. To ensure zero data loss and sub-second latency, we should decouple the state machine from the transport layer. I am updating our shared project task board to track the implementation phases.`;
      toolCalls = [
        {
          id: `sim-call-${Date.now()}-1`,
          name: 'update_task_list',
          args: {
            tasks: [
              { id: 'task-1', title: 'Define core state machine & lock mechanics', status: 'done', assignedTo: 'Architect Alpha' },
              { id: 'task-2', title: 'Implement rate-limiting and token cost guard', status: 'in_progress', assignedTo: 'Coder Beta' },
              { id: 'task-3', title: 'Review memory bounds & zero-trust API sanitization', status: 'todo', assignedTo: 'Auditor Gamma' },
            ],
          },
        },
        {
          id: `sim-call-${Date.now()}-2`,
          name: 'write_scratchpad',
          args: {
            key: 'system_spec',
            title: 'Technical Specification Draft',
            content: `## Architecture Overview\n- Transport: SSE (Server-Sent Events) with keepalive heartbeat\n- State Store: Neon PostgreSQL / In-Memory Fallback\n- Encryption: AES-256-GCM at-rest\n- Turn Coordination: Atomic step coordinator with visual delay countdown`,
            itemType: 'scratchpad',
          },
        },
      ];
    } else if (role.includes('Coder') || role.includes('Engineer')) {
      content = `[Engineering Implementation]\nI have reviewed the architecture spec. I agree with the decoupling strategy. I'm now drafting the core step executor and verifying our optimistic locking mechanism with lockVersion increment to prevent race conditions.`;
      toolCalls = [
        {
          id: `sim-call-${Date.now()}-3`,
          name: 'record_decision',
          args: {
            decisionTitle: 'Adopt Optimistic Concurrency with lockVersion',
            rationale: 'Prevents double-execution of turns in serverless environments when multiple webhooks or clients pulse.',
          },
        },
      ];
    } else if (role.includes('Critic') || role.includes('Auditor')) {
      content = `[Security & Quality Audit]\nAudited the proposed pipeline. Key takeaways:\n1. AES-256-GCM encryption with 96-bit IV provides sufficient cryptographic protection.\n2. Recommend testing edge cases where client disconnects mid-turn. Safety guards must maintain state in DB.`;
    } else {
      content = `[Collaboration Update - Turn #${Math.floor(turnCount / 2) + 1}]\nContinuing collaborative execution towards our goal. Cross-referencing current workspace tasks and advancing implementation.`;
    }

    const promptTokens = 180 + Math.floor(Math.random() * 50);
    const completionTokens = 120 + Math.floor(Math.random() * 60);

    return {
      content,
      promptTokens,
      completionTokens,
      totalTokens: promptTokens + completionTokens,
      toolCalls,
      modelUsed: 'zata-simulation-engine-v1',
    };
  }

  async validateKey(_apiKey: string): Promise<{ valid: boolean; error?: string }> {
    return { valid: true };
  }
}
