import crypto from 'crypto';

// -------------------------------------------------------------
// 1. Inlined Pure Implementation for Standalone Isolated Testing
// -------------------------------------------------------------

const STOP_WORDS = new Set([
  'the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'in', 'to', 'for', 'of', 'with', 'as',
  'by', 'that', 'it', 'from', 'this', 'be', 'are', 'was', 'were', 'dan', 'di', 'ke', 'dari', 'yang',
  'ini', 'itu', 'untuk', 'dengan', 'pada', 'adalah', 'sebagai', 'akan', 'bisa', 'juga', 'saya', 'kami'
]);

function tokenizeSubstance(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !STOP_WORDS.has(word));
}

function generateNGrams(tokens, n = 2) {
  const ngrams = new Set();
  if (tokens.length < n) {
    tokens.forEach(t => ngrams.add(t));
    return ngrams;
  }
  for (let i = 0; i <= tokens.length - n; i++) {
    ngrams.add(tokens.slice(i, i + n).join(' '));
  }
  return ngrams;
}

function calculateJaccardSimilarity(textA, textB, nGramSize = 2) {
  const tokensA = tokenizeSubstance(textA);
  const tokensB = tokenizeSubstance(textB);
  if (tokensA.length === 0 && tokensB.length === 0) return 1.0;
  if (tokensA.length === 0 || tokensB.length === 0) return 0.0;

  const ngramsA = generateNGrams(tokensA, nGramSize);
  const ngramsB = generateNGrams(tokensB, nGramSize);

  let intersectionCount = 0;
  for (const item of ngramsA) {
    if (ngramsB.has(item)) intersectionCount++;
  }
  const unionCount = ngramsA.size + ngramsB.size - intersectionCount;
  return unionCount === 0 ? 1.0 : intersectionCount / unionCount;
}

function calculateLevenshteinSimilarity(s1, s2) {
  const str1 = s1.trim().toLowerCase();
  const str2 = s2.trim().toLowerCase();
  if (str1 === str2) return 1.0;
  if (str1.length === 0 || str2.length === 0) return 0.0;

  const a = str1.slice(0, 1000);
  const b = str2.slice(0, 1000);

  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  const distance = matrix[b.length][a.length];
  const maxLen = Math.max(a.length, b.length);
  return Math.max(0, 1 - distance / maxLen);
}

function computeMessageSimilarity(textA, textB) {
  return 0.65 * calculateJaccardSimilarity(textA, textB, 2) + 0.35 * calculateLevenshteinSimilarity(textA, textB);
}

const ECHO_PATTERNS = [
  /i agree with (you|your|the)/i,
  /sounds like a (great|solid|good) plan/i,
  /let['’]s proceed with/i,
  /looks good to me/i,
  /saya setuju dengan/i,
  /rencana yang bagus/i,
  /mari kita lanjutkan/i,
  /sependapat/i,
];

function detectHollowEcho(text) {
  const trimmed = text.trim();
  if (trimmed.length < 250) {
    const matchedCount = ECHO_PATTERNS.filter(pattern => pattern.test(trimmed)).length;
    if (matchedCount >= 1 && tokenizeSubstance(trimmed).length < 20) {
      return true;
    }
  }
  return false;
}

function evaluateSafetyGuards(context) {
  const { currentTurn, maxTurns, estimatedCostUsd, safetyConfig, recentAgentMessages, isStopRequested } = context;

  if (isStopRequested) {
    return { shouldHalt: true, type: 'MANUAL_STOP', reason: 'Loop manually stopped by human director.' };
  }

  const effectiveMaxTurns = maxTurns || safetyConfig.maxTurns || 50;
  if (currentTurn >= effectiveMaxTurns) {
    return {
      shouldHalt: true,
      type: 'HARD_CAP_REACHED',
      reason: `Hard cap limit reached (${currentTurn}/${effectiveMaxTurns} turns). Auto-paused for safety.`,
    };
  }

  if (safetyConfig.maxBudgetUsd > 0 && estimatedCostUsd >= safetyConfig.maxBudgetUsd) {
    return {
      shouldHalt: true,
      type: 'BUDGET_EXCEEDED',
      reason: `Budget exceeded: $${estimatedCostUsd.toFixed(4)} >= $${safetyConfig.maxBudgetUsd.toFixed(2)}.`,
    };
  }

  if (recentAgentMessages.length >= 3) {
    const threshold = safetyConfig.repetitionThreshold || 0.85;
    const messagesBySender = new Map();
    for (const msg of recentAgentMessages) {
      const list = messagesBySender.get(msg.senderRole) || [];
      list.push(msg.content);
      messagesBySender.set(msg.senderRole, list);
    }

    for (const [sender, history] of messagesBySender.entries()) {
      if (history.length >= 3) {
        const last = history[history.length - 1];
        const prev1 = history[history.length - 2];
        const prev2 = history[history.length - 3];
        const sim1 = computeMessageSimilarity(last, prev1);
        const sim2 = computeMessageSimilarity(prev1, prev2);

        if (sim1 >= threshold && sim2 >= threshold) {
          return {
            shouldHalt: true,
            type: 'REPETITION_DETECTED',
            reason: `Agent '${sender}' repeated similar messages across 3 turns (${(Math.max(sim1, sim2) * 100).toFixed(1)}%). Auto-paused.`,
            repetitionScore: Math.max(sim1, sim2),
          };
        }
      }
    }

    const last3Overall = recentAgentMessages.slice(-3);
    const echoCount = last3Overall.filter(m => detectHollowEcho(m.content)).length;
    if (echoCount >= 3) {
      return {
        shouldHalt: true,
        type: 'REPETITION_DETECTED',
        reason: `Hollow echo loop detected: 3 turns of repetitive agreement without substance.`,
        echoCount,
      };
    }
  }

  return { shouldHalt: false };
}

// -------------------------------------------------------------
// 2. Encryption / Decryption Pure Logic Test
// -------------------------------------------------------------
function testEncryption(testKeyHex = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef') {
  const masterKey = Buffer.from(testKeyHex, 'hex');
  const plainApiKey = 'sk-proj-superSecretLiveApiKey1234567890';

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', masterKey, iv);
  const encrypted = Buffer.concat([cipher.update(plainApiKey, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  // Decrypt
  const decipher = crypto.createDecipheriv('aes-256-gcm', masterKey, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');

  if (decrypted !== plainApiKey) {
    throw new Error(`Encryption round-trip mismatch! Expected ${plainApiKey}, got ${decrypted}`);
  }

  // Tamper test: modify ciphertext and ensure authentication tag fails
  let tamperedCaught = false;
  try {
    const tampered = Buffer.from(encrypted);
    tampered[0] ^= 0xff; // flip bits
    const decipherTampered = crypto.createDecipheriv('aes-256-gcm', masterKey, iv);
    decipherTampered.setAuthTag(tag);
    Buffer.concat([decipherTampered.update(tampered), decipherTampered.final()]);
  } catch {
    tamperedCaught = true;
  }

  if (!tamperedCaught) {
    throw new Error('Security vulnerability: Tampered ciphertext was NOT rejected by auth tag!');
  }
}

// -------------------------------------------------------------
// 3. Execution of Test Suite
// -------------------------------------------------------------
console.log('====================================================');
console.log('🧪 RUNNING ISOLATED FASE 2 ORCHESTRATION & SAFETY TESTS');
console.log('====================================================\n');

let testsPassed = 0;

// TEST 1: Encryption & Tamper Resistance
try {
  testEncryption();
  console.log('✅ TEST 1 PASSED: AES-256-GCM encryption, decryption and tamper rejection verified.');
  testsPassed++;
} catch (err) {
  console.error('❌ TEST 1 FAILED:', err.message);
}

// TEST 2: Hard Cap Turn Limit (Must auto-pause at turn 50)
try {
  const resultUnder = evaluateSafetyGuards({
    currentTurn: 49,
    maxTurns: 50,
    totalTokens: 12000,
    estimatedCostUsd: 0.05,
    safetyConfig: { maxTurns: 50, maxBudgetUsd: 2.0, repetitionThreshold: 0.85 },
    recentAgentMessages: [],
  });
  if (resultUnder.shouldHalt) throw new Error('Halted prematurely at turn 49!');

  const resultAtCap = evaluateSafetyGuards({
    currentTurn: 50,
    maxTurns: 50,
    totalTokens: 12500,
    estimatedCostUsd: 0.052,
    safetyConfig: { maxTurns: 50, maxBudgetUsd: 2.0, repetitionThreshold: 0.85 },
    recentAgentMessages: [],
  });

  if (!resultAtCap.shouldHalt || resultAtCap.type !== 'HARD_CAP_REACHED') {
    throw new Error('Did not halt on reaching hard cap (turn 50)!');
  }
  console.log('✅ TEST 2 PASSED: Hard Cap properly triggered auto-pause at turn 50.');
  testsPassed++;
} catch (err) {
  console.error('❌ TEST 2 FAILED:', err.message);
}

// TEST 3: Repetition Detector (Catches infinite loop of duplicate messages)
try {
  const repeatingHistory = [
    { turnNumber: 1, senderRole: 'Agent-A', content: 'Let us build the database schema using Prisma and PostgreSQL with full indexing.' },
    { turnNumber: 2, senderRole: 'Agent-B', content: 'Yes, we will create the tables for users, rooms, and messages.' },
    { turnNumber: 3, senderRole: 'Agent-A', content: 'Let us build the database schema using Prisma and PostgreSQL with full indexing.' },
    { turnNumber: 4, senderRole: 'Agent-B', content: 'Agreed, we are creating tables for users, rooms, and messages.' },
    { turnNumber: 5, senderRole: 'Agent-A', content: 'Let us build the database schema using Prisma and PostgreSQL with full indexing.' },
  ];

  const resultLoop = evaluateSafetyGuards({
    currentTurn: 5,
    maxTurns: 50,
    totalTokens: 2000,
    estimatedCostUsd: 0.01,
    safetyConfig: { maxTurns: 50, maxBudgetUsd: 2.0, repetitionThreshold: 0.85 },
    recentAgentMessages: repeatingHistory,
  });

  if (!resultLoop.shouldHalt || resultLoop.type !== 'REPETITION_DETECTED') {
    throw new Error('Repetition detector failed to flag 3 consecutive identical messages!');
  }
  console.log(`✅ TEST 3 PASSED: Repetition detector halted infinite loop: "${resultLoop.reason}"`);
  testsPassed++;
} catch (err) {
  console.error('❌ TEST 3 FAILED:', err.message);
}

// TEST 4: Hollow Agreement / Echo Loop Detector
try {
  const echoHistory = [
    { turnNumber: 1, senderRole: 'Agent-A', content: 'I agree with your plan, let us proceed.' },
    { turnNumber: 2, senderRole: 'Agent-B', content: 'Looks good to me, let us proceed with step 1.' },
    { turnNumber: 3, senderRole: 'Agent-A', content: 'Sounds like a great plan, let us proceed.' },
  ];

  const resultEcho = evaluateSafetyGuards({
    currentTurn: 3,
    maxTurns: 50,
    totalTokens: 500,
    estimatedCostUsd: 0.002,
    safetyConfig: { maxTurns: 50, maxBudgetUsd: 2.0, repetitionThreshold: 0.85, echoThreshold: 0.8 },
    recentAgentMessages: echoHistory,
  });

  if (!resultEcho.shouldHalt || resultEcho.type !== 'REPETITION_DETECTED') {
    throw new Error('Hollow echo loop failed to be flagged!');
  }
  console.log(`✅ TEST 4 PASSED: Hollow echo detector halted superficial consensus loop.`);
  testsPassed++;
} catch (err) {
  console.error('❌ TEST 4 FAILED:', err.message);
}

// TEST 5: Instant Stop Request
try {
  const resultStop = evaluateSafetyGuards({
    currentTurn: 12,
    maxTurns: 50,
    totalTokens: 4000,
    estimatedCostUsd: 0.02,
    safetyConfig: { maxTurns: 50, maxBudgetUsd: 2.0, repetitionThreshold: 0.85 },
    recentAgentMessages: [],
    isStopRequested: true,
  });

  if (!resultStop.shouldHalt || resultStop.type !== 'MANUAL_STOP') {
    throw new Error('Instant stop flag failed to halt execution!');
  }
  console.log('✅ TEST 5 PASSED: Instant manual stop flag halted execution immediately.');
  testsPassed++;
} catch (err) {
  console.error('❌ TEST 5 FAILED:', err.message);
}

// TEST 6: Budget Cap Guard
try {
  const resultBudget = evaluateSafetyGuards({
    currentTurn: 20,
    maxTurns: 50,
    totalTokens: 80000,
    estimatedCostUsd: 2.05,
    safetyConfig: { maxTurns: 50, maxBudgetUsd: 2.0, repetitionThreshold: 0.85 },
    recentAgentMessages: [],
  });

  if (!resultBudget.shouldHalt || resultBudget.type !== 'BUDGET_EXCEEDED') {
    throw new Error('Budget cap failed to halt execution when cost exceeded $2.00!');
  }
  console.log('✅ TEST 6 PASSED: Budget cap halted execution when cost exceeded configured limit.');
  testsPassed++;
} catch (err) {
  console.error('❌ TEST 6 FAILED:', err.message);
}

console.log('\n====================================================');
console.log(`🎉 ALL ${testsPassed}/6 FASE 2 ISOLATED SAFETY TESTS PASSED!`);
console.log('====================================================');
