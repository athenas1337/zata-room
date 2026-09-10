import { db } from './db';
import { RoomStatus, SafetyEventType, ProviderType, SafetyConfig } from '@/types';
import { encryptApiKey, maskApiKey } from './encryption';

// In-memory fallback database for instant local development without pre-configuring PostgreSQL
class MemoryStore {
  users = new Map<string, any>();
  rooms = new Map<string, any>();
  participants = new Map<string, any[]>();
  messages = new Map<string, any[]>();
  workspaceItems = new Map<string, Map<string, any>>();
  virtualFiles = new Map<string, Map<string, any>>();
  terminalLogs = new Map<string, any[]>();
  safetyEvents = new Map<string, any[]>();

  constructor() {
    const defaultUser = {
      id: 'usr-default',
      name: 'Human Director (Host)',
      email: 'director@zata.ai',
      createdAt: new Date(),
    };
    this.users.set(defaultUser.id, defaultUser);
    this.seedDemoRooms();
  }

  private seedDemoRooms() {
    const enc = encryptApiKey('demo-mock-key-123456');

    // 1. High-Concurrency Payment Gateway Room
    const r1Id = 'room-payment-gateway';
    const r1 = {
      id: r1Id,
      name: 'High-Concurrency Payment Gateway Architecture',
      goal: 'Architect an ultra-reliable, multi-region payment routing gateway with idempotency keys, token buckets, and sub-second failover mechanics.',
      status: 'ACTIVE',
      isPublic: true,
      inviteCode: 'ZATA-8X1A',
      hostSecret: 'host-sec-default-1',
      currentTurn: 3,
      maxTurns: 50,
      turnDelaySec: 5,
      activeAgentIdx: 1,
      isProcessing: false,
      lockVersion: 3,
      safetyConfig: { repetitionThreshold: 0.85, maxTurns: 50, maxBudgetUsd: 2.0, echoThreshold: 0.8 },
      totalTokens: 1420,
      estimatedCost: 0.0058,
      createdById: 'usr-default',
      createdAt: new Date(Date.now() - 3600000),
      updatedAt: new Date(),
    };
    this.rooms.set(r1Id, r1);

    const r1Parts = [
      {
        id: 'part-r1-1',
        roomId: r1Id,
        userId: 'usr-default',
        agentName: 'Architect Alpha',
        roleLabel: 'Lead Architect',
        avatarColor: '#3b82f6',
        systemPrompt: 'Focus on distributed system scalability, database partitioning, and idempotency.',
        provider: 'SIMULATED',
        modelName: 'zata-simulation-v1',
        encryptedApiKey: enc.encryptedApiKey,
        apiKeyIv: enc.apiKeyIv,
        apiKeyTag: enc.apiKeyTag,
        keyMask: 'sim-...demo',
        turnOrder: 0,
        createdAt: new Date(),
      },
      {
        id: 'part-r1-2',
        roomId: r1Id,
        userId: 'usr-default',
        agentName: 'Coder Beta',
        roleLabel: 'Senior Backend Engineer',
        avatarColor: '#10b981',
        systemPrompt: 'Implement concrete schemas, rate limiting algorithms, and resilient retry logic.',
        provider: 'SIMULATED',
        modelName: 'zata-simulation-v1',
        encryptedApiKey: enc.encryptedApiKey,
        apiKeyIv: enc.apiKeyIv,
        apiKeyTag: enc.apiKeyTag,
        keyMask: 'sim-...demo',
        turnOrder: 1,
        createdAt: new Date(),
      },
    ];
    this.participants.set(r1Id, r1Parts);

    const r1Msgs = [
      {
        id: 'msg-r1-1',
        roomId: r1Id,
        senderRole: 'Architect Alpha',
        senderName: 'Architect Alpha',
        content: 'I have broken down our payment gateway project goal. We must implement an idempotency layer using Redis with a 24-hour TTL and dual-region active-active database replication. I am updating our task board with initial assignments.',
        tokenCount: 420,
        turnNumber: 1,
        isCheckpoint: false,
        toolCalls: [{ name: 'update_task_list', args: { tasks: [
          { id: 'task-1', title: 'Design idempotency key hashing & Redis lock mechanism', status: 'done', assignedTo: 'Architect Alpha' },
          { id: 'task-2', title: 'Implement token bucket algorithm for Stripe/PayPal webhooks', status: 'in_progress', assignedTo: 'Coder Beta' },
          { id: 'task-3', title: 'Setup automated circuit breaker and failover alerts', status: 'todo', assignedTo: 'Coder Beta' }
        ]}}],
        createdAt: new Date(Date.now() - 2400000),
      },
      {
        id: 'msg-r1-2',
        roomId: r1Id,
        senderRole: 'Coder Beta',
        senderName: 'Coder Beta',
        content: 'I reviewed the idempotency specification. I recommend using SHA-256 hashes combining `Idempotency-Key` + `UserId` + `Amount` to protect against payload tampering. I have drafted the technical spec in our scratchpad, generated `src/server.ts`, and verified via `npm test`.',
        tokenCount: 480,
        turnNumber: 2,
        isCheckpoint: false,
        toolCalls: [
          { name: 'record_decision', args: { decisionTitle: 'Enforce SHA-256 Composite Idempotency Keys', rationale: 'Guarantees requests cannot be forged or replayed with altered amounts.' } },
          { name: 'write_scratchpad', args: { key: 'gateway_spec', title: 'Payment Gateway Technical Spec', content: '## Core System Design\n- **Idempotency Strategy**: SHA-256(Key + UserID + Payload)\n- **Rate Limiting**: Sliding window counter (100 req/sec per merchant)\n- **Fallback**: Auto-routing to secondary gateway if latency > 800ms', itemType: 'scratchpad' } },
          { name: 'execute_terminal_command', args: { command: 'npm test -- --runInBand' } }
        ],
        createdAt: new Date(Date.now() - 1200000),
      },
      {
        id: 'msg-r1-3',
        roomId: r1Id,
        senderRole: 'Architect Alpha',
        senderName: 'Architect Alpha',
        content: 'The composite key design looks solid. Next, let us focus on the circuit breaker threshold. If gateway error rate exceeds 5% in a 30-second sliding window, traffic should divert to the standby provider within 200ms.',
        tokenCount: 520,
        turnNumber: 3,
        isCheckpoint: false,
        createdAt: new Date(Date.now() - 300000),
      }
    ];
    this.messages.set(r1Id, r1Msgs);

    // Workspace Items
    const r1Workspace = new Map<string, any>();
    r1Workspace.set('task_list', {
      id: 'art-r1-tasks',
      roomId: r1Id,
      key: 'task_list',
      title: 'Project Task Board',
      itemType: 'task_list',
      value: [
        { id: 'task-1', title: 'Design idempotency key hashing & Redis lock mechanism', status: 'done', assignedTo: 'Architect Alpha' },
        { id: 'task-2', title: 'Implement token bucket algorithm for Stripe/PayPal webhooks', status: 'in_progress', assignedTo: 'Coder Beta' },
        { id: 'task-3', title: 'Setup automated circuit breaker and failover alerts', status: 'todo', assignedTo: 'Coder Beta' }
      ],
      updatedBy: 'Architect Alpha',
      updatedAt: new Date(),
    });
    r1Workspace.set('gateway_spec', {
      id: 'art-r1-spec',
      roomId: r1Id,
      key: 'gateway_spec',
      title: 'Payment Gateway Technical Spec',
      itemType: 'scratchpad',
      value: '## Core System Design\n- **Idempotency Strategy**: SHA-256(Key + UserID + Payload)\n- **Rate Limiting**: Sliding window counter (100 req/sec per merchant)\n- **Fallback**: Auto-routing to secondary gateway if latency > 800ms',
      updatedBy: 'Coder Beta',
      updatedAt: new Date(),
    });
    r1Workspace.set('decision_log', {
      id: 'art-r1-dec',
      roomId: r1Id,
      key: 'decision_log',
      title: 'Consensus & Decision Log',
      itemType: 'decision_log',
      value: [
        { id: 'dec-1', title: 'Enforce SHA-256 Composite Idempotency Keys', rationale: 'Guarantees requests cannot be forged or replayed with altered amounts.', by: 'Coder Beta', timestamp: new Date().toISOString() }
      ],
      updatedBy: 'Coder Beta',
      updatedAt: new Date(),
    });
    this.workspaceItems.set(r1Id, r1Workspace);

    // Pre-seed Virtual Files (Antigravity VFS)
    const r1Files = new Map<string, any>();
    r1Files.set('src/server.ts', {
      id: 'vf-r1-1',
      roomId: r1Id,
      path: 'src/server.ts',
      name: 'server.ts',
      language: 'typescript',
      sizeBytes: 1240,
      content: `import express from 'express';\nimport crypto from 'crypto';\n\nconst app = express();\napp.use(express.json());\n\n// Idempotency Store (Redis in-memory simulated)\nconst idempotencyStore = new Map<string, { status: number; body: any }>();\n\napp.post('/api/v1/charge', (req, res) => {\n  const idempotencyKey = req.header('X-Idempotency-Key');\n  if (!idempotencyKey) {\n    return res.status(400).json({ error: 'Missing X-Idempotency-Key header' });\n  }\n\n  // Check existing cached response\n  if (idempotencyStore.has(idempotencyKey)) {\n    const cached = idempotencyStore.get(idempotencyKey)!;\n    return res.status(cached.status).json({ ...cached.body, cached: true });\n  }\n\n  // Execute transaction\n  const transaction = {\n    id: 'txn_' + crypto.randomBytes(8).toString('hex'),\n    amount: req.body.amount,\n    currency: req.body.currency || 'USD',\n    status: 'succeeded',\n    timestamp: new Date().toISOString(),\n  };\n\n  idempotencyStore.set(idempotencyKey, { status: 201, body: transaction });\n  return res.status(201).json(transaction);\n});\n\nexport default app;`,
      updatedBy: 'Coder Beta',
      updatedAt: new Date(),
    });

    r1Files.set('package.json', {
      id: 'vf-r1-2',
      roomId: r1Id,
      path: 'package.json',
      name: 'package.json',
      language: 'json',
      sizeBytes: 380,
      content: `{\n  "name": "payment-gateway-service",\n  "version": "1.0.0",\n  "main": "dist/server.js",\n  "scripts": {\n    "build": "tsc",\n    "start": "node dist/server.js",\n    "test": "jest --passWithNoTests"\n  },\n  "dependencies": {\n    "express": "^4.19.2",\n    "ioredis": "^5.4.1"\n  },\n  "devDependencies": {\n    "typescript": "^5.4.5",\n    "jest": "^29.7.0"\n  }\n}`,
      updatedBy: 'Coder Beta',
      updatedAt: new Date(),
    });

    r1Files.set('tests/gateway.test.ts', {
      id: 'vf-r1-3',
      roomId: r1Id,
      path: 'tests/gateway.test.ts',
      name: 'gateway.test.ts',
      language: 'typescript',
      sizeBytes: 680,
      content: `describe('Payment Gateway Idempotency', () => {\n  it('should return the identical transaction on duplicated request', async () => {\n    const key = 'test-idem-key-999';\n    const payload = { amount: 5000, currency: 'USD' };\n    // Test simulation verified in terminal\n    expect(true).toBe(true);\n  });\n});`,
      updatedBy: 'Coder Beta',
      updatedAt: new Date(),
    });
    this.virtualFiles.set(r1Id, r1Files);

    // Pre-seed Web Terminal logs
    this.terminalLogs.set(r1Id, [
      {
        id: 'tlog-1',
        roomId: r1Id,
        command: 'npm test -- --runInBand',
        output: 'PASS tests/gateway.test.ts\n  Payment Gateway Idempotency\n    ✓ should return the identical transaction on duplicated request (38ms)\n\nTest Suites: 1 passed, 1 total\nTests:       1 passed, 1 total\nSnapshots:   0 total\nTime:        0.842s\nRan all test suites.',
        exitCode: 0,
        executedBy: 'Coder Beta',
        createdAt: new Date(Date.now() - 1100000),
      },
      {
        id: 'tlog-2',
        roomId: r1Id,
        command: 'ls -la src',
        output: 'total 16\ndrwxr-xr-x 2 zata zata 4096 Sep 08 22:45 .\ndrwxr-xr-x 4 zata zata 4096 Sep 08 22:44 ..\n-rw-r--r-- 1 zata zata 1240 Sep 08 22:45 server.ts',
        exitCode: 0,
        executedBy: 'Human Director',
        createdAt: new Date(Date.now() - 600000),
      }
    ]);

    this.safetyEvents.set(r1Id, []);

    // 2. Zero-Trust Security Audit Room
    const r2Id = 'room-security-audit';
    this.rooms.set(r2Id, {
      id: r2Id,
      name: 'Zero-Trust Cloud Infrastructure & Security Audit',
      goal: 'Audit IAM permissions, verify AES-256-GCM encryption at-rest, and test network egress boundaries for compliance.',
      status: 'PAUSED',
      isPublic: true,
      inviteCode: 'ZATA-3N2K',
      hostSecret: 'host-sec-default-2',
      currentTurn: 2,
      maxTurns: 40,
      turnDelaySec: 4,
      activeAgentIdx: 0,
      isProcessing: false,
      lockVersion: 2,
      safetyConfig: { repetitionThreshold: 0.85, maxTurns: 40, maxBudgetUsd: 2.0, echoThreshold: 0.8 },
      totalTokens: 890,
      estimatedCost: 0.0035,
      createdById: 'usr-default',
      createdAt: new Date(Date.now() - 7200000),
      updatedAt: new Date(),
    });

    this.participants.set(r2Id, [
      {
        id: 'part-r2-1',
        roomId: r2Id,
        userId: 'usr-default',
        agentName: 'Auditor Gamma',
        roleLabel: 'Security Auditor & Critic',
        avatarColor: '#f43f5e',
        systemPrompt: 'Audit all access controls and identify single points of failure.',
        provider: 'SIMULATED',
        modelName: 'zata-simulation-v1',
        encryptedApiKey: enc.encryptedApiKey,
        apiKeyIv: enc.apiKeyIv,
        apiKeyTag: enc.apiKeyTag,
        keyMask: 'sim-...demo',
        turnOrder: 0,
        createdAt: new Date(),
      },
      {
        id: 'part-r2-2',
        roomId: r2Id,
        userId: 'usr-default',
        agentName: 'DevOps Delta',
        roleLabel: 'Cloud Platform Engineer',
        avatarColor: '#8b5cf6',
        systemPrompt: 'Enforce least privilege IAM policies and Terraform drift detection.',
        provider: 'SIMULATED',
        modelName: 'zata-simulation-v1',
        encryptedApiKey: enc.encryptedApiKey,
        apiKeyIv: enc.apiKeyIv,
        apiKeyTag: enc.apiKeyTag,
        keyMask: 'sim-...demo',
        turnOrder: 1,
        createdAt: new Date(),
      },
    ]);

    this.messages.set(r2Id, [
      {
        id: 'msg-r2-1',
        roomId: r2Id,
        senderRole: 'Auditor Gamma',
        senderName: 'Auditor Gamma',
        content: 'Initiating security audit. All user API keys are encrypted at-rest with AES-256-GCM using 96-bit initialization vectors. No plaintext leaks detected.',
        tokenCount: 410,
        turnNumber: 1,
        isCheckpoint: false,
        createdAt: new Date(Date.now() - 3600000),
      },
      {
        id: 'msg-r2-2',
        roomId: r2Id,
        senderRole: 'DevOps Delta',
        senderName: 'DevOps Delta',
        content: 'Confirmed. Database connections are restricted to SSL-required endpoints. Session paused waiting for Human Director confirmation.',
        tokenCount: 480,
        turnNumber: 2,
        isCheckpoint: true,
        createdAt: new Date(Date.now() - 1800000),
      }
    ]);

    const r2Workspace = new Map<string, any>();
    r2Workspace.set('task_list', {
      id: 'art-r2-tasks',
      roomId: r2Id,
      key: 'task_list',
      title: 'Security Audit Checkpoints',
      itemType: 'task_list',
      value: [
        { id: 'sec-1', title: 'Verify AES-256-GCM encryption at-rest', status: 'done', assignedTo: 'Auditor Gamma' },
        { id: 'sec-2', title: 'Audit SSL connection certificates & DNS routing', status: 'done', assignedTo: 'DevOps Delta' },
        { id: 'sec-3', title: 'Simulate packet injection and DDoS attack surface', status: 'todo', assignedTo: 'Auditor Gamma' }
      ],
      updatedBy: 'DevOps Delta',
      updatedAt: new Date(),
    });
    this.workspaceItems.set(r2Id, r2Workspace);

    const r2Files = new Map<string, any>();
    r2Files.set('infra/security-policy.json', {
      id: 'vf-r2-1',
      roomId: r2Id,
      path: 'infra/security-policy.json',
      name: 'security-policy.json',
      language: 'json',
      sizeBytes: 420,
      content: `{\n  "Version": "2026-10-17",\n  "Statement": [\n    {\n      "Effect": "Deny",\n      "Action": "*",\n      "Resource": "*",\n      "Condition": {\n        "Bool": { "aws:SecureTransport": "false" }\n      }\n    }\n  ]\n}`,
      updatedBy: 'Auditor Gamma',
      updatedAt: new Date(),
    });
    this.virtualFiles.set(r2Id, r2Files);

    this.safetyEvents.set(r2Id, [
      {
        id: 'safe-r2-1',
        roomId: r2Id,
        type: 'CHECKPOINT_WAITING',
        detail: 'Checkpoint reached: Waiting for Human Director to review security audit checklist before proceeding.',
        turn: 2,
        createdAt: new Date(Date.now() - 1800000),
      }
    ]);

    // 3. Autonomous AI Research Suite (Private Invite-Only)
    const r3Id = 'room-ai-research';
    this.rooms.set(r3Id, {
      id: r3Id,
      name: 'Autonomous AI Multi-Agent Benchmark Suite',
      goal: 'Benchmark latency and token consumption across Anthropic Claude, OpenAI GPT-4o, and Google Gemini in complex agentic swarms.',
      status: 'DRAFT',
      isPublic: false,
      inviteCode: 'ZATA-AI99',
      hostSecret: 'host-sec-default-3',
      currentTurn: 0,
      maxTurns: 30,
      turnDelaySec: 3,
      activeAgentIdx: 0,
      isProcessing: false,
      lockVersion: 0,
      safetyConfig: { repetitionThreshold: 0.85, maxTurns: 30, maxBudgetUsd: 1.5, echoThreshold: 0.8 },
      totalTokens: 0,
      estimatedCost: 0.0,
      createdById: 'usr-default',
      createdAt: new Date(Date.now() - 10800000),
      updatedAt: new Date(),
    });
    this.participants.set(r3Id, []);
    this.messages.set(r3Id, []);
    this.workspaceItems.set(r3Id, new Map());
    this.virtualFiles.set(r3Id, new Map());
    this.terminalLogs.set(r3Id, []);
    this.safetyEvents.set(r3Id, []);
  }
}

const memoryDb = new MemoryStore();
let isPrismaAvailable: boolean | null = null;

export async function ensureDefaultUser() {
  try {
    await db.user.upsert({
      where: { id: 'usr-default' },
      update: {},
      create: {
        id: 'usr-default',
        name: 'Human Director (Host)',
        email: 'director@zata.ai',
      },
    });
  } catch (err) {
    console.warn('[DataStore] ensureDefaultUser warning:', err);
  }
}

async function checkPrismaAvailable(): Promise<boolean> {
  if (isPrismaAvailable === true) return true;
  if (!process.env.DATABASE_URL) return false;

  try {
    await Promise.race([
      db.$queryRaw`SELECT 1`,
      new Promise((_, reject) => setTimeout(() => reject(new Error('DB Timeout')), 6000)),
    ]);
    isPrismaAvailable = true;
    await ensureDefaultUser();
    return true;
  } catch (err) {
    console.warn('[DataStore] Prisma DB probe failed or cold-start waiting:', err);
    return false;
  }
}

export const dataStore = {
  async getRooms(filter?: { includePrivate?: boolean }) {
    if (await checkPrismaAvailable()) {
      return db.room.findMany({
        where: filter?.includePrivate ? undefined : { isPublic: true },
        orderBy: { createdAt: 'desc' },
        include: {
          participants: {
            select: {
              id: true,
              agentName: true,
              roleLabel: true,
              avatarColor: true,
              provider: true,
              modelName: true,
              keyMask: true,
              turnOrder: true,
            },
          },
          _count: {
            select: { messages: true, safetyEvents: true, virtualFiles: true },
          },
        },
      });
    }

    const all = Array.from(memoryDb.rooms.values());
    const filtered = filter?.includePrivate ? all : all.filter(r => r.isPublic);

    return filtered.map(r => ({
      ...r,
      participants: (memoryDb.participants.get(r.id) || []).map(p => ({
        id: p.id,
        agentName: p.agentName,
        roleLabel: p.roleLabel,
        avatarColor: p.avatarColor,
        provider: p.provider,
        modelName: p.modelName,
        keyMask: p.keyMask,
        turnOrder: p.turnOrder,
      })),
      _count: {
        messages: (memoryDb.messages.get(r.id) || []).length,
        safetyEvents: (memoryDb.safetyEvents.get(r.id) || []).length,
        virtualFiles: (memoryDb.virtualFiles.get(r.id) || new Map()).size,
      },
    }));
  },

  async getAllRoomsAdmin() {
    return this.getRooms({ includePrivate: true });
  },

  async getRoomById(id: string) {
    if (await checkPrismaAvailable()) {
      return db.room.findUnique({
        where: { id },
        include: {
          participants: { orderBy: { turnOrder: 'asc' } },
          messages: { orderBy: { turnNumber: 'asc' } },
          workspaceItems: true,
          virtualFiles: { orderBy: { path: 'asc' } },
          terminalLogs: { orderBy: { createdAt: 'desc' }, take: 20 },
          safetyEvents: { orderBy: { createdAt: 'desc' } },
        },
      });
    }

    const r = memoryDb.rooms.get(id);
    if (!r) return null;

    const participants = memoryDb.participants.get(id) || [];
    const messages = memoryDb.messages.get(id) || [];
    const workspaceItems = Array.from((memoryDb.workspaceItems.get(id) || new Map()).values());
    const virtualFiles = Array.from((memoryDb.virtualFiles.get(id) || new Map()).values());
    const terminalLogs = memoryDb.terminalLogs.get(id) || [];
    const safetyEvents = memoryDb.safetyEvents.get(id) || [];

    return {
      ...r,
      participants,
      messages,
      workspaceItems,
      virtualFiles,
      terminalLogs,
      safetyEvents,
    };
  },

  async createRoom(data: {
    name: string;
    goal: string;
    isPublic?: boolean;
    turnDelaySec?: number;
    maxTurns?: number;
    safetyConfig?: Partial<SafetyConfig>;
    createdById?: string;
  }) {
    const inviteCode = `ZATA-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const hostSecret = `host-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

    const defaultSafety: SafetyConfig = {
      repetitionThreshold: 0.85,
      maxTurns: data.maxTurns || 50,
      maxBudgetUsd: 2.0,
      echoThreshold: 0.8,
      requireApprovalOnAction: false,
      ...data.safetyConfig,
    };

    const roomPayload = {
      name: data.name,
      goal: data.goal,
      isPublic: data.isPublic ?? true,
      inviteCode,
      hostSecret,
      turnDelaySec: data.turnDelaySec ?? 5,
      maxTurns: data.maxTurns ?? 50,
      safetyConfig: defaultSafety as any,
      createdById: data.createdById || 'usr-default',
    };

    if (await checkPrismaAvailable()) {
      await ensureDefaultUser();
      const room = await db.room.create({ data: roomPayload });
      await db.virtualFile
        .create({
          data: {
            roomId: room.id,
            path: 'README.md',
            name: 'README.md',
            language: 'markdown',
            sizeBytes: 180,
            content: `# ${data.name}\n\n**Goal**: ${data.goal}\n\nCollaborative Antigravity Multi-Agent Environment.`,
            updatedBy: 'System',
          },
        })
        .catch(() => {});
      return room;
    }

    const id = `room-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const newRoom = {
      id,
      ...roomPayload,
      status: 'DRAFT',
      currentTurn: 0,
      activeAgentIdx: 0,
      isProcessing: false,
      lockVersion: 0,
      totalTokens: 0,
      estimatedCost: 0.0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    memoryDb.rooms.set(id, newRoom);
    memoryDb.participants.set(id, []);
    memoryDb.messages.set(id, []);
    memoryDb.workspaceItems.set(id, new Map());
    memoryDb.virtualFiles.set(id, new Map());
    memoryDb.terminalLogs.set(id, []);
    memoryDb.safetyEvents.set(id, []);

    // Default README virtual file
    const readmeFile = {
      id: `vf-${id}-readme`,
      roomId: id,
      path: 'README.md',
      name: 'README.md',
      language: 'markdown',
      sizeBytes: 150,
      content: `# ${data.name}\n\n**Goal**: ${data.goal}\n\nCollaborative Antigravity Multi-Agent Environment.`,
      updatedBy: 'System',
      updatedAt: new Date(),
    };
    memoryDb.virtualFiles.get(id)!.set('README.md', readmeFile);

    return newRoom;
  },

  async findRoomByInviteCode(inviteCode: string) {
    const code = inviteCode.trim().toUpperCase();
    if (await checkPrismaAvailable()) {
      try {
        const room = await (db.room as any).findFirst({
          where: { inviteCode: { equals: code, mode: 'insensitive' } },
          include: {
            participants: { where: { isEnabled: true } },
            _count: { select: { messages: true, safetyEvents: true } },
          },
        });
        return room;
      } catch (e) {
        // fallback
      }
    }

    for (const room of memoryDb.rooms.values()) {
      if (room.inviteCode?.toUpperCase() === code) {
        return this.getRoomById(room.id);
      }
    }
    return null;
  },

  async deleteRoom(roomId: string) {
    if (await checkPrismaAvailable()) {
      return db.room.delete({
        where: { id: roomId },
      });
    }

    memoryDb.rooms.delete(roomId);
    memoryDb.participants.delete(roomId);
    memoryDb.messages.delete(roomId);
    memoryDb.workspaceItems.delete(roomId);
    memoryDb.virtualFiles.delete(roomId);
    memoryDb.terminalLogs.delete(roomId);
    memoryDb.safetyEvents.delete(roomId);
    return { success: true, id: roomId };
  },

  async addParticipant(roomId: string, data: {
    userId?: string;
    agentName: string;
    roleLabel: string;
    avatarColor?: string;
    systemPrompt: string;
    provider: ProviderType;
    modelName: string;
    apiKey: string;
    baseUrl?: string | null;
    turnOrder?: number;
  }) {
    const encrypted = encryptApiKey(data.apiKey);

    if (await checkPrismaAvailable()) {
      await ensureDefaultUser();
      const count = await db.roomParticipant.count({ where: { roomId } });
      return db.roomParticipant.create({
        data: {
          roomId,
          userId: data.userId || 'usr-default',
          agentName: data.agentName,
          roleLabel: data.roleLabel,
          avatarColor: data.avatarColor || '#3b82f6',
          systemPrompt: data.systemPrompt,
          provider: data.provider,
          modelName: data.modelName,
          encryptedApiKey: encrypted.encryptedApiKey,
          apiKeyIv: encrypted.apiKeyIv,
          apiKeyTag: encrypted.apiKeyTag,
          keyMask: encrypted.keyMask,
          baseUrl: data.baseUrl,
          turnOrder: data.turnOrder ?? count,
        },
      });
    }

    const currentParticipants = memoryDb.participants.get(roomId) || [];
    const id = `part-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const newPart = {
      id,
      roomId,
      userId: data.userId || 'usr-default',
      agentName: data.agentName,
      roleLabel: data.roleLabel,
      avatarColor: data.avatarColor || (currentParticipants.length === 0 ? '#3b82f6' : '#10b981'),
      systemPrompt: data.systemPrompt,
      provider: data.provider,
      modelName: data.modelName,
      encryptedApiKey: encrypted.encryptedApiKey,
      apiKeyIv: encrypted.apiKeyIv,
      apiKeyTag: encrypted.apiKeyTag,
      keyMask: encrypted.keyMask,
      baseUrl: data.baseUrl,
      turnOrder: data.turnOrder ?? currentParticipants.length,
      createdAt: new Date(),
    };

    currentParticipants.push(newPart);
    memoryDb.participants.set(roomId, currentParticipants);
    return newPart;
  },

  async updateRoom(roomId: string, data: any) {
    if (await checkPrismaAvailable()) {
      return db.room.update({
        where: { id: roomId },
        data,
      });
    }

    const room = memoryDb.rooms.get(roomId);
    if (!room) return null;
    const updated = { ...room, ...data, updatedAt: new Date() };
    memoryDb.rooms.set(roomId, updated);
    return updated;
  },

  async addMessage(data: {
    roomId: string;
    participantId?: string | null;
    senderRole: string;
    senderName: string;
    content: string;
    tokenCount?: number;
    turnNumber: number;
    isCheckpoint?: boolean;
    toolCalls?: any;
  }) {
    if (await checkPrismaAvailable()) {
      return db.message.create({
        data: {
          roomId: data.roomId,
          participantId: data.participantId,
          senderRole: data.senderRole,
          senderName: data.senderName,
          content: data.content,
          tokenCount: data.tokenCount ?? 0,
          turnNumber: data.turnNumber,
          isCheckpoint: data.isCheckpoint ?? false,
          toolCalls: data.toolCalls,
        },
      });
    }

    const messages = memoryDb.messages.get(data.roomId) || [];
    const newMsg = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      ...data,
      tokenCount: data.tokenCount ?? 0,
      createdAt: new Date(),
    };
    messages.push(newMsg);
    memoryDb.messages.set(data.roomId, messages);
    return newMsg;
  },

  async recordSafetyEvent(roomId: string, type: SafetyEventType, detail: string, turn: number) {
    if (await checkPrismaAvailable()) {
      return db.safetyEvent.create({
        data: { roomId, type, detail, turn },
      });
    }

    const events = memoryDb.safetyEvents.get(roomId) || [];
    const newEvt = {
      id: `safe-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      roomId,
      type,
      detail,
      turn,
      createdAt: new Date(),
    };
    events.unshift(newEvt);
    memoryDb.safetyEvents.set(roomId, events);
    return newEvt;
  },

  async upsertWorkspaceItem(roomId: string, key: string, data: {
    title: string;
    value: any;
    itemType: string;
    updatedBy: string;
  }) {
    if (await checkPrismaAvailable()) {
      return db.sharedWorkspaceItem.upsert({
        where: { roomId_key: { roomId, key } },
        create: {
          roomId,
          key,
          title: data.title,
          value: data.value,
          itemType: data.itemType,
          updatedBy: data.updatedBy,
        },
        update: {
          title: data.title,
          value: data.value,
          updatedBy: data.updatedBy,
        },
      });
    }

    let items = memoryDb.workspaceItems.get(roomId);
    if (!items) {
      items = new Map();
      memoryDb.workspaceItems.set(roomId, items);
    }
    const item = {
      id: `art-${roomId}-${key}`,
      roomId,
      key,
      title: data.title,
      value: data.value,
      itemType: data.itemType,
      updatedBy: data.updatedBy,
      updatedAt: new Date(),
    };
    items.set(key, item);
    return item;
  },

  // Virtual File Operations (Antigravity VFS)
  async upsertVirtualFile(roomId: string, path: string, data: {
    content: string;
    language?: string;
    updatedBy?: string;
  }) {
    const fileName = path.split('/').pop() || path;
    const language = data.language || (path.endsWith('.ts') ? 'typescript' : path.endsWith('.json') ? 'json' : path.endsWith('.md') ? 'markdown' : 'javascript');
    const sizeBytes = Buffer.byteLength(data.content, 'utf8');

    if (await checkPrismaAvailable()) {
      return db.virtualFile.upsert({
        where: { roomId_path: { roomId, path } },
        create: {
          roomId,
          path,
          name: fileName,
          content: data.content,
          language,
          sizeBytes,
          updatedBy: data.updatedBy || 'Agent',
        },
        update: {
          content: data.content,
          language,
          sizeBytes,
          updatedBy: data.updatedBy || 'Agent',
        },
      });
    }

    let files = memoryDb.virtualFiles.get(roomId);
    if (!files) {
      files = new Map();
      memoryDb.virtualFiles.set(roomId, files);
    }
    const file = {
      id: `vf-${roomId}-${path.replace(/[^a-zA-Z0-9]/g, '_')}`,
      roomId,
      path,
      name: fileName,
      content: data.content,
      language,
      sizeBytes,
      updatedBy: data.updatedBy || 'Agent',
      updatedAt: new Date(),
    };
    files.set(path, file);
    return file;
  },

  async deleteVirtualFile(roomId: string, path: string) {
    if (await checkPrismaAvailable()) {
      return db.virtualFile.delete({
        where: { roomId_path: { roomId, path } },
      });
    }
    const files = memoryDb.virtualFiles.get(roomId);
    if (files) files.delete(path);
    return { success: true, path };
  },

  // Web Terminal Logging
  async addTerminalLog(roomId: string, logData: {
    command: string;
    output: string;
    exitCode?: number;
    executedBy?: string;
  }) {
    if (await checkPrismaAvailable()) {
      return db.terminalLog.create({
        data: {
          roomId,
          command: logData.command,
          output: logData.output,
          exitCode: logData.exitCode ?? 0,
          executedBy: logData.executedBy || 'agent',
        },
      });
    }

    const logs = memoryDb.terminalLogs.get(roomId) || [];
    const newLog = {
      id: `tlog-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      roomId,
      command: logData.command,
      output: logData.output,
      exitCode: logData.exitCode ?? 0,
      executedBy: logData.executedBy || 'agent',
      createdAt: new Date(),
    };
    logs.push(newLog);
    memoryDb.terminalLogs.set(roomId, logs);
    return newLog;
  },

  // Godmode Operations (Atha1337)
  async forceStopAllRooms() {
    if (await checkPrismaAvailable()) {
      await db.room.updateMany({
        where: { status: 'ACTIVE' },
        data: { status: 'PAUSED', isProcessing: false },
      });
      return { success: true };
    }

    for (const [id, r] of memoryDb.rooms.entries()) {
      if (r.status === 'ACTIVE') {
        memoryDb.rooms.set(id, { ...r, status: 'PAUSED', isProcessing: false });
      }
    }
    return { success: true };
  }
};
