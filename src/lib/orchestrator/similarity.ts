/**
 * Text and Semantic Similarity Utilities for Anti-Infinite-Loop Repetition Detector.
 * Designed for high performance and zero external dependencies.
 */

// Common English & Indonesian conversational filler/stop words to ignore when comparing substance
const STOP_WORDS = new Set([
  'the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'in', 'to', 'for', 'of', 'with', 'as',
  'by', 'that', 'it', 'from', 'this', 'be', 'are', 'was', 'were', 'dan', 'di', 'ke', 'dari', 'yang',
  'ini', 'itu', 'untuk', 'dengan', 'pada', 'adalah', 'sebagai', 'akan', 'bisa', 'juga', 'saya', 'kami'
]);

/**
 * Clean and tokenize a text string into normalized substantive words.
 */
export function tokenizeSubstance(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !STOP_WORDS.has(word));
}

/**
 * Generate N-grams from a token array (default: bi-grams).
 */
export function generateNGrams(tokens: string[], n = 2): Set<string> {
  const ngrams = new Set<string>();
  if (tokens.length < n) {
    tokens.forEach(t => ngrams.add(t));
    return ngrams;
  }
  for (let i = 0; i <= tokens.length - n; i++) {
    ngrams.add(tokens.slice(i, i + n).join(' '));
  }
  return ngrams;
}

/**
 * Calculate Jaccard similarity between two sets of N-grams.
 * Returns float between 0.0 (completely distinct) and 1.0 (identical).
 */
export function calculateJaccardSimilarity(textA: string, textB: string, nGramSize = 2): number {
  const tokensA = tokenizeSubstance(textA);
  const tokensB = tokenizeSubstance(textB);

  if (tokensA.length === 0 && tokensB.length === 0) return 1.0;
  if (tokensA.length === 0 || tokensB.length === 0) return 0.0;

  const ngramsA = generateNGrams(tokensA, nGramSize);
  const ngramsB = generateNGrams(tokensB, nGramSize);

  let intersectionCount = 0;
  for (const item of ngramsA) {
    if (ngramsB.has(item)) {
      intersectionCount++;
    }
  }

  const unionCount = ngramsA.size + ngramsB.size - intersectionCount;
  if (unionCount === 0) return 1.0;

  return intersectionCount / unionCount;
}

/**
 * Levenshtein distance between two strings, capped for performance.
 */
export function calculateLevenshteinSimilarity(s1: string, s2: string): number {
  const str1 = s1.trim().toLowerCase();
  const str2 = s2.trim().toLowerCase();

  if (str1 === str2) return 1.0;
  if (str1.length === 0 || str2.length === 0) return 0.0;

  // Optimize: limit comparison length for performance if strings are very long
  const maxLen = Math.max(str1.length, str2.length);
  const a = str1.slice(0, 1000);
  const b = str2.slice(0, 1000);

  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  const distance = matrix[b.length][a.length];
  const effectiveMax = Math.max(a.length, b.length);
  return Math.max(0, 1 - distance / effectiveMax);
}

/**
 * Hollow Agreement / Echo Pattern Detector.
 * Detects if an agent is repeatedly offering polite agreement without advancing the task.
 */
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

export function detectHollowEcho(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.length < 250) {
    const matchedCount = ECHO_PATTERNS.filter(pattern => pattern.test(trimmed)).length;
    if (matchedCount >= 1 && tokenizeSubstance(trimmed).length < 20) {
      return true;
    }
  }
  return false;
}

/**
 * Composite similarity metric combining bi-gram Jaccard and Levenshtein ratio.
 */
export function computeMessageSimilarity(textA: string, textB: string): number {
  const jaccard = calculateJaccardSimilarity(textA, textB, 2);
  const levenshtein = calculateLevenshteinSimilarity(textA, textB);

  // Weight Jaccard 65% (captures semantic word-pair reuse) and Levenshtein 35% (captures structural mimicry)
  return 0.65 * jaccard + 0.35 * levenshtein;
}
