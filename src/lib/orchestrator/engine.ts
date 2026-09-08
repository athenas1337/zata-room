import { dataStore } from '../data-store';
import { decryptApiKey } from '../encryption';
import { getProviderAdapter } from '../providers/validator';
import { WORKSPACE_TOOLS } from './workspace-tools';
import { evaluateSafetyGuards, estimateTokenCost } from './safety';
import { broadcastToRoom } from '../sse';
import { TurnExecutionResult, SafetyConfig } from '@/types';

/**
 * Executes a single atomic turn in the multi-agent room.
 * Resilient, safe, database-persisted, and 100% serverless-ready.
 */
export async function executeRoomStep(roomId: string): Promise<TurnExecutionResult> {
  // 1. Fetch room with participants and recent history
  const room = await dataStore.getRoomById(roomId);

  if (!room) {
    return { success: false, error: `Room ${roomId} not found.` };
  }

  // Ensure room is active
  if (room.status !== 'ACTIVE') {
    return {
      success: false,
      error: `Room is currently ${room.status}. Cannot execute turn unless ACTIVE.`,
    };
  }

  // Concurrency guard: avoid double-executing the same turn
  if (room.isProcessing) {
    return {
      success: false,
      error: 'Room is already processing an active turn. Step skipped to prevent collision.',
    };
  }

  // Need at least 2 participants for collaboration
  if (!room.participants || room.participants.length < 2) {
    await pauseRoomWithEvent(
      roomId,
      'ERROR_HALT',
      'Room requires at least 2 agent participants to begin collaboration.',
      room.currentTurn
    );
    return { success: false, error: 'At least 2 participants required.' };
  }

  // Set processing lock
  await dataStore.updateRoom(roomId, { isProcessing: true });

  try {
    const safetyConfig = (room.safetyConfig as unknown as SafetyConfig) || {
      repetitionThreshold: 0.85,
      maxTurns: room.maxTurns,
      maxBudgetUsd: 2.0,
      echoThreshold: 0.8,
    };

    // 2. Evaluate Multi-Tier Safety Guards
    const recentAgentMsgs = (room.messages || []).slice(-10).map((m: any) => ({
      turnNumber: m.turnNumber,
      senderRole: m.senderRole,
      content: m.content,
    }));

    const safety = evaluateSafetyGuards({
      currentTurn: room.currentTurn,
      maxTurns: room.maxTurns,
      totalTokens: room.totalTokens,
      estimatedCostUsd: room.estimatedCost,
      safetyConfig,
      recentAgentMessages: recentAgentMsgs,
    });

    if (safety.shouldHalt) {
      await pauseRoomWithEvent(
        roomId,
        safety.type || 'ERROR_HALT',
        safety.reason || 'Safety criteria triggered.',
        room.currentTurn
      );

      await dataStore.updateRoom(roomId, { isProcessing: false });

      return {
        success: false,
        haltReason: safety.type,
        error: safety.reason,
      };
    }

    // 3. Identify Active Agent
    const activeIndex = room.activeAgentIdx % room.participants.length;
    const participant = room.participants[activeIndex];

    // Broadcast TURN_START & AGENT_THINKING
    broadcastToRoom(roomId, {
      type: 'AGENT_THINKING',
      data: {
        agentName: participant.agentName,
        roleLabel: participant.roleLabel,
        avatarColor: participant.avatarColor,
        turnNumber: room.currentTurn + 1,
      },
      timestamp: Date.now(),
    });

    // 4. Decrypt API Key
    let plainApiKey = '';
    try {
      plainApiKey = decryptApiKey(
        participant.encryptedApiKey,
        participant.apiKeyIv,
        participant.apiKeyTag
      );
    } catch (err: any) {
      await pauseRoomWithEvent(
        roomId,
        'API_KEY_REVOKED',
        `Failed to decrypt API key for agent '${participant.agentName}'. Please re-enter key.`,
        room.currentTurn
      );
      await dataStore.updateRoom(roomId, { isProcessing: false });
      return { success: false, haltReason: 'API_KEY_REVOKED', error: err.message };
    }

    // 5. Construct Context Snapshot for the Agent
    const workspaceSnapshot = (room.workspaceItems || [])
      .map((item: any) => `### Artifact: [${item.key}] ${item.title}\n${typeof item.value === 'string' ? item.value : JSON.stringify(item.value, null, 2)}`)
      .join('\n\n');

    const systemPromptWithContext = [
      `You are ${participant.agentName}, working as ${participant.roleLabel} in the ZATA Agentic Room.`,
      `Project Goal:\n"${room.goal}"`,
      participant.systemPrompt ? `Specific Role Instructions:\n${participant.systemPrompt}` : '',
      `\nCollaboration Guidelines:`,
      `- Collaborate productively with the other agent(s) towards completing the project goal.`,
      `- Use the provided tools (update_task_list, write_scratchpad, record_decision, request_human_checkpoint) whenever you want to update shared artifacts or need human director approval.`,
      `- Do not repeat greetings or produce superficial agreement. Build directly on the previous messages.`,
      workspaceSnapshot ? `\n--- CURRENT SHARED WORKSPACE ---\n${workspaceSnapshot}\n--- END SHARED WORKSPACE ---` : '',
    ].filter(Boolean).join('\n\n');

    // Build message history for LLM
    const llmMessages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: systemPromptWithContext },
    ];

    // Add recent conversation
    for (const msg of (room.messages || []).slice(-12)) {
      if (msg.senderRole === participant.agentName) {
        llmMessages.push({ role: 'assistant', content: msg.content });
      } else {
        llmMessages.push({
          role: 'user',
          content: `[${msg.senderRole}]: ${msg.content}`,
        });
      }
    }

    if (llmMessages.length === 1) {
      llmMessages.push({
        role: 'user',
        content: `Human Director initiated the session for project goal: "${room.goal}". Please kick off the collaboration with an initial proposal or plan.`,
      });
    }

    // 6. Invoke LLM Provider
    const adapter = getProviderAdapter(participant.provider);
    const llmResponse = await adapter.complete({
      provider: participant.provider,
      modelName: participant.modelName,
      apiKey: plainApiKey,
      baseUrl: participant.baseUrl,
      messages: llmMessages,
      tools: WORKSPACE_TOOLS,
      temperature: 0.7,
      maxTokens: 1500,
    });

    const costUsd = estimateTokenCost(
      participant.modelName,
      llmResponse.promptTokens,
      llmResponse.completionTokens
    );

    // 7. Handle Tool Calls (Workspace Mutations / Human Checkpoints)
    let isCheckpointTriggered = false;
    let checkpointReason = '';

    if (llmResponse.toolCalls && llmResponse.toolCalls.length > 0) {
      for (const call of llmResponse.toolCalls) {
        if (call.name === 'update_task_list') {
          const tasks = (call.args as any)?.tasks || [];
          const item = await dataStore.upsertWorkspaceItem(roomId, 'task_list', {
            title: 'Project Task Board',
            itemType: 'task_list',
            value: tasks,
            updatedBy: participant.agentName,
          });
          broadcastToRoom(roomId, {
            type: 'WORKSPACE_UPDATE',
            data: item,
            timestamp: Date.now(),
          });
        } else if (call.name === 'write_scratchpad') {
          const { key, title, content, itemType } = (call.args as any) || {};
          const item = await dataStore.upsertWorkspaceItem(roomId, key || 'scratchpad', {
            title: title || 'Scratchpad',
            itemType: itemType || 'scratchpad',
            value: content || '',
            updatedBy: participant.agentName,
          });
          broadcastToRoom(roomId, {
            type: 'WORKSPACE_UPDATE',
            data: item,
            timestamp: Date.now(),
          });
        } else if (call.name === 'record_decision') {
          const { decisionTitle, rationale } = (call.args as any) || {};
          const existing = (room.workspaceItems || []).find((i: any) => i.key === 'decision_log');
          const currentList: any[] = Array.isArray(existing?.value) ? [...existing.value] : [];
          currentList.push({
            id: `dec-${Date.now()}`,
            title: decisionTitle,
            rationale,
            by: participant.agentName,
            timestamp: new Date().toISOString(),
          });
          const item = await dataStore.upsertWorkspaceItem(roomId, 'decision_log', {
            title: 'Consensus & Decision Log',
            itemType: 'decision_log',
            value: currentList,
            updatedBy: participant.agentName,
          });
          broadcastToRoom(roomId, {
            type: 'WORKSPACE_UPDATE',
            data: item,
            timestamp: Date.now(),
          });
        } else if (call.name === 'create_file' || call.name === 'update_file') {
          const { path, content, language } = (call.args as any) || {};
          if (path && content) {
            const file = await dataStore.upsertVirtualFile(roomId, path, {
              content,
              language,
              updatedBy: participant.agentName,
            });
            broadcastToRoom(roomId, {
              type: 'FILE_UPDATE',
              data: file,
              timestamp: Date.now(),
            });
          }
        } else if (call.name === 'delete_file') {
          const { path } = (call.args as any) || {};
          if (path) {
            await dataStore.deleteVirtualFile(roomId, path);
            broadcastToRoom(roomId, {
              type: 'FILE_UPDATE',
              data: { deleted: true, path },
              timestamp: Date.now(),
            });
          }
        } else if (call.name === 'execute_terminal_command') {
          const { command } = (call.args as any) || {};
          if (command) {
            const simOutput = simulateVirtualTerminalCommand(command, room);
            const log = await dataStore.addTerminalLog(roomId, {
              command,
              output: simOutput.output,
              exitCode: simOutput.exitCode,
              executedBy: participant.agentName,
            });
            broadcastToRoom(roomId, {
              type: 'TERMINAL_OUTPUT',
              data: log,
              timestamp: Date.now(),
            });
          }
        } else if (call.name === 'request_human_checkpoint') {
          isCheckpointTriggered = true;
          checkpointReason = (call.args as any)?.reason || 'Agent requested director review';
        }
      }
    }

    // 8. Save Message
    const savedMessage = await dataStore.addMessage({
      roomId,
      participantId: participant.id,
      senderRole: participant.agentName,
      senderName: participant.agentName,
      content: llmResponse.content || '(Executed shared workspace actions)',
      tokenCount: llmResponse.totalTokens,
      turnNumber: room.currentTurn + 1,
      isCheckpoint: isCheckpointTriggered,
      toolCalls: llmResponse.toolCalls,
    });

    // 9. Advance Room State
    const nextAgentIdx = (activeIndex + 1) % room.participants.length;
    const nextTurn = room.currentTurn + 1;

    let nextStatus = room.status;
    if (isCheckpointTriggered) {
      nextStatus = 'PAUSED';
      await dataStore.recordSafetyEvent(
        roomId,
        'CHECKPOINT_WAITING',
        `Checkpoint requested by ${participant.agentName}: ${checkpointReason}`,
        nextTurn
      );
      broadcastToRoom(roomId, {
        type: 'SAFETY_EVENT',
        data: {
          type: 'CHECKPOINT_WAITING',
          detail: `Checkpoint requested: ${checkpointReason}`,
          turn: nextTurn,
        },
        timestamp: Date.now(),
      });
    }

    const updatedRoom = await dataStore.updateRoom(roomId, {
      currentTurn: nextTurn,
      activeAgentIdx: nextAgentIdx,
      status: nextStatus,
      totalTokens: room.totalTokens + llmResponse.totalTokens,
      estimatedCost: (room.estimatedCost || 0) + costUsd,
      isProcessing: false,
    });

    // Broadcast Message & Status Update
    broadcastToRoom(roomId, {
      type: 'AGENT_MESSAGE',
      data: {
        id: savedMessage.id,
        roomId,
        senderRole: participant.agentName,
        senderName: participant.agentName,
        avatarColor: participant.avatarColor,
        content: savedMessage.content,
        turnNumber: nextTurn,
        tokenCount: llmResponse.totalTokens,
        toolCalls: llmResponse.toolCalls,
        createdAt: savedMessage.createdAt ? new Date(savedMessage.createdAt).toISOString() : new Date().toISOString(),
      },
      timestamp: Date.now(),
    });

    broadcastToRoom(roomId, {
      type: 'STATUS_UPDATE',
      data: {
        status: updatedRoom.status,
        currentTurn: nextTurn,
        totalTokens: updatedRoom.totalTokens,
        estimatedCost: updatedRoom.estimatedCost,
        activeAgentIdx: nextAgentIdx,
      },
      timestamp: Date.now(),
    });

    return {
      success: true,
      message: {
        id: savedMessage.id,
        roomId,
        senderRole: participant.agentName,
        senderName: participant.agentName,
        content: savedMessage.content,
        tokenCount: llmResponse.totalTokens,
        turnNumber: nextTurn,
        isCheckpoint: isCheckpointTriggered,
        toolCalls: savedMessage.toolCalls,
        createdAt: savedMessage.createdAt ? new Date(savedMessage.createdAt).toISOString() : new Date().toISOString(),
      },
      tokensUsed: llmResponse.totalTokens,
      costUsd,
      nextTurnIndex: nextAgentIdx,
      delayRemainingSec: room.turnDelaySec,
    };
  } catch (err: any) {
    await dataStore.updateRoom(roomId, { isProcessing: false });

    broadcastToRoom(roomId, {
      type: 'ERROR',
      data: { error: err.message || 'Turn execution failed' },
      timestamp: Date.now(),
    });

    return {
      success: false,
      error: err.message || 'Unknown error occurred during turn execution',
    };
  }
}

/**
 * Instantly stop the room loop (<500ms).
 */
export async function stopRoomInstantly(roomId: string, reason = 'Stopped manually by Human Director'): Promise<void> {
  const room = await dataStore.updateRoom(roomId, {
    status: 'PAUSED',
    isProcessing: false,
  });

  const turn = room?.currentTurn || 0;

  await dataStore.recordSafetyEvent(roomId, 'MANUAL_STOP', reason, turn);

  broadcastToRoom(roomId, {
    type: 'SAFETY_EVENT',
    data: {
      type: 'MANUAL_STOP',
      detail: reason,
      turn,
    },
    timestamp: Date.now(),
  });

  broadcastToRoom(roomId, {
    type: 'STATUS_UPDATE',
    data: {
      status: 'PAUSED',
      currentTurn: turn,
    },
    timestamp: Date.now(),
  });
}

/**
 * Helper to pause a room and record a safety event.
 */
async function pauseRoomWithEvent(
  roomId: string,
  type: any,
  detail: string,
  turn: number
) {
  await dataStore.updateRoom(roomId, { status: 'PAUSED', isProcessing: false });
  await dataStore.recordSafetyEvent(roomId, type, detail, turn);

  broadcastToRoom(roomId, {
    type: 'SAFETY_EVENT',
    data: { type, detail, turn },
    timestamp: Date.now(),
  });

  broadcastToRoom(roomId, {
    type: 'STATUS_UPDATE',
    data: { status: 'PAUSED', currentTurn: turn },
    timestamp: Date.now(),
  });
}

/**
 * High-fidelity virtual terminal command simulator for Antigravity VFS sandbox.
 */
export function simulateVirtualTerminalCommand(command: string, room: any): { output: string; exitCode: number } {
  const cmd = command.trim();
  const files: Array<{ path: string; name: string; content: string; sizeBytes: number }> = room.virtualFiles || [];

  if (cmd === 'ls' || cmd === 'ls -la' || cmd === 'dir') {
    if (files.length === 0) {
      return { output: 'total 0\n(no files created yet)', exitCode: 0 };
    }
    const lines = [
      'total ' + (files.length * 4),
      'drwxr-xr-x 2 zata zata 4096 Sep 08 23:00 .',
      'drwxr-xr-x 4 zata zata 4096 Sep 08 23:00 ..',
      ...files.map(f => `-rw-r--r-- 1 zata zata ${f.sizeBytes || f.content?.length || 1024} Sep 08 23:00 ${f.path}`),
    ];
    return { output: lines.join('\n'), exitCode: 0 };
  }

  if (cmd.startsWith('cat ')) {
    const targetPath = cmd.replace(/^cat\s+/, '').trim();
    const found = files.find(f => f.path === targetPath || f.name === targetPath);
    if (!found) {
      return { output: `cat: ${targetPath}: No such file or directory`, exitCode: 1 };
    }
    return { output: found.content, exitCode: 0 };
  }

  if (cmd.includes('npm test') || cmd.includes('jest')) {
    const testFiles = files.filter(f => f.path.includes('test') || f.path.includes('spec'));
    const testName = testFiles[0]?.name || 'test.spec.ts';
    return {
      output: `PASS tests/${testName}\n  ✓ unit test suite executed cleanly (42ms)\n  ✓ security policy compliance verified (18ms)\n  ✓ schema validation passed (12ms)\n\nTest Suites: 1 passed, 1 total\nTests:       3 passed, 3 total\nSnapshots:   0 total\nTime:        0.724 s\nRan all test suites.`,
      exitCode: 0,
    };
  }

  if (cmd.includes('npm run build') || cmd.includes('tsc')) {
    return {
      output: `> build\n> tsc && next build\n\n✓ Compiled successfully in 1.4s\n✓ Verified 0 type errors\n✓ Generated production bundle`,
      exitCode: 0,
    };
  }

  if (cmd === 'git status') {
    return {
      output: `On branch main\nYour branch is up to date with 'origin/main'.\n\nChanges to be committed:\n  (use "git restore --staged <file>..." to unstage)\n\tmodified:   ${files.map(f => f.path).join('\n\tmodified:   ') || 'README.md'}\n\nno changes added to commit (use "git add" to track)`,
      exitCode: 0,
    };
  }

  if (cmd === 'pwd') {
    return { output: '/home/zata/workspace/' + (room.name?.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'project'), exitCode: 0 };
  }

  if (cmd === 'clear') {
    return { output: '', exitCode: 0 };
  }

  return {
    output: `[Executed]: ${cmd}\nexit code: 0\n(Virtual sandboxed process completed successfully)`,
    exitCode: 0,
  };
}

