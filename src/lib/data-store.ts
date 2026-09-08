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
  safetyEvents = new Map<string, any[]>();

  constructor() {
    // Seed a default demo user
    const defaultUser = {
      id: 'usr-default',
      name: 'Human Director',
      email: 'director@zata.ai',
      createdAt: new Date(),
    };
    this.users.set(defaultUser.id, defaultUser);
  }
}

const memoryDb = new MemoryStore();
let isPrismaAvailable: boolean | null = null;

async function checkPrismaAvailable(): Promise<boolean> {
  if (isPrismaAvailable !== null) return isPrismaAvailable;
  try {
    // Quick probe with timeout
    await Promise.race([
      db.$queryRaw`SELECT 1`,
      new Promise((_, reject) => setTimeout(() => reject(new Error('DB Timeout')), 1500)),
    ]);
    isPrismaAvailable = true;
    return true;
  } catch (err) {
    isPrismaAvailable = false;
    console.warn('⚠️ PostgreSQL connection not detected. Using high-performance in-memory fallback store for local development.');
    return false;
  }
}

export const dataStore = {
  async getRooms() {
    if (await checkPrismaAvailable()) {
      return db.room.findMany({
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
            select: { messages: true, safetyEvents: true },
          },
        },
      });
    }

    // Memory fallback
    return Array.from(memoryDb.rooms.values()).map(r => ({
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
      },
    }));
  },

  async getRoomById(id: string) {
    if (await checkPrismaAvailable()) {
      return db.room.findUnique({
        where: { id },
        include: {
          participants: {
            orderBy: { turnOrder: 'asc' },
          },
          messages: {
            orderBy: { turnNumber: 'asc' },
          },
          workspaceItems: true,
          safetyEvents: {
            orderBy: { createdAt: 'desc' },
          },
        },
      });
    }

    const r = memoryDb.rooms.get(id);
    if (!r) return null;

    const participants = memoryDb.participants.get(id) || [];
    const messages = memoryDb.messages.get(id) || [];
    const workspaceItems = Array.from((memoryDb.workspaceItems.get(id) || new Map()).values());
    const safetyEvents = memoryDb.safetyEvents.get(id) || [];

    return {
      ...r,
      participants,
      messages,
      workspaceItems,
      safetyEvents,
    };
  },

  async createRoom(data: {
    name: string;
    goal: string;
    turnDelaySec?: number;
    maxTurns?: number;
    safetyConfig?: Partial<SafetyConfig>;
    createdById?: string;
  }) {
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
      turnDelaySec: data.turnDelaySec ?? 5,
      maxTurns: data.maxTurns ?? 50,
      safetyConfig: defaultSafety as any,
      createdById: data.createdById || 'usr-default',
    };

    if (await checkPrismaAvailable()) {
      return db.room.create({
        data: roomPayload,
      });
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
    memoryDb.safetyEvents.set(id, []);

    // Initialize default task board artifact
    const defaultTasks = {
      id: `art-tasks-${id}`,
      roomId: id,
      key: 'task_list',
      title: 'Project Task Board',
      itemType: 'task_list',
      value: [
        { id: 'task-1', title: 'Define project architecture & responsibilities', status: 'in_progress', assignedTo: 'Agent Alpha' },
        { id: 'task-2', title: 'Synthesize solution & draft deliverable', status: 'todo', assignedTo: 'Agent Beta' },
      ],
      updatedBy: 'System',
      updatedAt: new Date(),
    };
    memoryDb.workspaceItems.get(id)!.set('task_list', defaultTasks);

    return newRoom;
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
      // determine turnOrder
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
  }
};
