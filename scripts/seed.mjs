import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

function encryptApiKey(key) {
  const encKey = Buffer.from('c4a56e9f1837b2d9a304e8d249f05a1e8c9b31d27456e792ab14d8930c1f5e27', 'hex');
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', encKey, iv);
  let enc = cipher.update(key, 'utf8', 'hex');
  enc += cipher.final('hex');
  const tag = cipher.getAuthTag();
  return {
    encryptedApiKey: enc,
    apiKeyIv: iv.toString('hex'),
    apiKeyTag: tag.toString('hex'),
    keyMask: `${key.slice(0, 3)}...${key.slice(-4)}`,
  };
}

async function main() {
  console.log('🚀 Seeding ZATA Agentic Room PostgreSQL database...');

  // 1. Ensure Default User
  const defaultUser = await prisma.user.upsert({
    where: { id: 'usr-default' },
    update: {},
    create: {
      id: 'usr-default',
      name: 'Human Director (Host)',
      email: 'director@zata.ai',
    },
  });
  console.log('✅ User ensured:', defaultUser.id);

  // 2. Demo Room: Payment Gateway
  const enc = encryptApiKey('demo-mock-key-123456');
  const r1Id = 'room-payment-gateway';

  const r1 = await prisma.room.upsert({
    where: { id: r1Id },
    update: {},
    create: {
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
      safetyConfig: { repetitionThreshold: 0.85, maxTurns: 50, maxBudgetUsd: 2.0, echoThreshold: 0.8 },
      totalTokens: 1420,
      estimatedCost: 0.0058,
      createdById: defaultUser.id,
    },
  });
  console.log('✅ Room 1 ensured:', r1.id);

  // Seed participants for Room 1
  await prisma.roomParticipant.upsert({
    where: { roomId_turnOrder: { roomId: r1Id, turnOrder: 0 } },
    update: {},
    create: {
      id: 'part-r1-1',
      roomId: r1Id,
      userId: defaultUser.id,
      agentName: 'Architect Alpha',
      roleLabel: 'Lead Architect',
      avatarColor: '#3b82f6',
      systemPrompt: 'Focus on distributed system scalability, database partitioning, and idempotency.',
      provider: 'SIMULATED',
      modelName: 'zata-simulation-v1',
      encryptedApiKey: enc.encryptedApiKey,
      apiKeyIv: enc.apiKeyIv,
      apiKeyTag: enc.apiKeyTag,
      keyMask: enc.keyMask,
      turnOrder: 0,
    },
  });

  await prisma.roomParticipant.upsert({
    where: { roomId_turnOrder: { roomId: r1Id, turnOrder: 1 } },
    update: {},
    create: {
      id: 'part-r1-2',
      roomId: r1Id,
      userId: defaultUser.id,
      agentName: 'Coder Beta',
      roleLabel: 'Senior Backend Engineer',
      avatarColor: '#10b981',
      systemPrompt: 'Implement concrete schemas, rate limiting algorithms, and resilient retry logic.',
      provider: 'SIMULATED',
      modelName: 'zata-simulation-v1',
      encryptedApiKey: enc.encryptedApiKey,
      apiKeyIv: enc.apiKeyIv,
      apiKeyTag: enc.apiKeyTag,
      keyMask: enc.keyMask,
      turnOrder: 1,
    },
  });

  // Seed Virtual Files for Room 1
  await prisma.virtualFile.upsert({
    where: { roomId_path: { roomId: r1Id, path: 'README.md' } },
    update: {},
    create: {
      id: 'vf-r1-readme',
      roomId: r1Id,
      path: 'README.md',
      name: 'README.md',
      language: 'markdown',
      sizeBytes: 420,
      content: `# High-Concurrency Payment Gateway\n\nDistributed architecture with idempotency and Redis token buckets.\nBuilt with ZATA Agentic Studio.`,
      updatedBy: 'Architect Alpha',
    },
  });

  await prisma.virtualFile.upsert({
    where: { roomId_path: { roomId: r1Id, path: 'src/server.ts' } },
    update: {},
    create: {
      id: 'vf-r1-1',
      roomId: r1Id,
      path: 'src/server.ts',
      name: 'server.ts',
      language: 'typescript',
      sizeBytes: 1240,
      content: `import express from 'express';\n\nconst app = express();\napp.use(express.json());\n\napp.post('/charge', async (req, res) => {\n  const idempotencyKey = req.headers['x-idempotency-key'];\n  if (!idempotencyKey) return res.status(400).json({ error: 'Missing Idempotency-Key' });\n  // Process payment with Redis deduplication\n  return res.json({ status: 'PAID', transactionId: 'tx_' + Date.now() });\n});\n\napp.listen(3000, () => console.log('Payment Gateway online'));`,
      updatedBy: 'Coder Beta',
    },
  });

  // Seed Room 2: Zero-Trust Security Audit
  const r2Id = 'room-security-audit';
  await prisma.room.upsert({
    where: { id: r2Id },
    update: {},
    create: {
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
      safetyConfig: { repetitionThreshold: 0.85, maxTurns: 40, maxBudgetUsd: 2.0, echoThreshold: 0.8 },
      totalTokens: 890,
      estimatedCost: 0.0035,
      createdById: defaultUser.id,
    },
  });
  console.log('✅ Room 2 ensured: room-security-audit');

  console.log('🎉 Seeding completed successfully! Database is ready.');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
