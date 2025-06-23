/**
 * Proof of Work implementation for Satoshi Stacker game
 * Uses SHA-256 hashing to find nonces that produce hashes with required leading zeros
 */

export interface ProofOfWorkChallenge {
  challenge: string;
  difficulty: number;
  timestamp: number;
  target: string;
}

export interface ProofOfWorkSolution {
  challenge: string;
  nonce: number;
  hash: string;
  timestamp: number;
}

/**
 * Calculate the target string based on difficulty
 * Difficulty represents the number of leading zeros required
 */
export function calculateTarget(difficulty: number): string {
  return '0'.repeat(difficulty) + 'f'.repeat(64 - difficulty);
}

/**
 * Generate a new proof of work challenge
 */
export function generateChallenge(playerPubkey: string, score: number, difficulty: number): ProofOfWorkChallenge {
  const timestamp = Date.now();
  const challenge = `${playerPubkey}:${score}:${timestamp}:${Math.random().toString(36).substring(7)}`;
  
  return {
    challenge,
    difficulty,
    timestamp,
    target: calculateTarget(difficulty)
  };
}


/**
 * Solve a proof of work challenge using Web Crypto API
 * Returns null if cancelled via AbortSignal
 */
export async function solveChallenge(
  challenge: ProofOfWorkChallenge, 
  signal?: AbortSignal
): Promise<ProofOfWorkSolution | null> {
  let nonce = 0;
  const encoder = new TextEncoder();
  
  while (!signal?.aborted) {
    const message = `${challenge.challenge}:${nonce}`;
    const msgBuffer = encoder.encode(message);
    
    // Use Web Crypto API for SHA-256
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    // Check if hash meets difficulty requirement
    if (hashHex.startsWith('0'.repeat(challenge.difficulty))) {
      return {
        challenge: challenge.challenge,
        nonce,
        hash: hashHex,
        timestamp: Date.now()
      };
    }
    
    nonce++;
    
    // Yield to the event loop periodically to prevent blocking
    if (nonce % 1000 === 0) {
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }
  
  return null; // Cancelled
}

/**
 * Verify a proof of work solution
 */
export async function verifySolution(
  challenge: ProofOfWorkChallenge,
  solution: ProofOfWorkSolution
): Promise<boolean> {
  // Check if solution is for the correct challenge
  if (solution.challenge !== challenge.challenge) {
    return false;
  }
  
  // Check if solution was found within time limit (5 minutes)
  const timeDiff = solution.timestamp - challenge.timestamp;
  if (timeDiff > 5 * 60 * 1000) {
    return false;
  }
  
  // Verify the hash
  const encoder = new TextEncoder();
  const message = `${challenge.challenge}:${solution.nonce}`;
  const msgBuffer = encoder.encode(message);
  
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  // Check if hash matches and meets difficulty
  return hashHex === solution.hash && hashHex.startsWith('0'.repeat(challenge.difficulty));
}

/**
 * Calculate dynamic difficulty based on score and level
 * Higher scores require more proof of work
 */
export function calculateDifficulty(score: number, level: number): number {
  // Base difficulty starts at 1 (one leading zero)
  // Increases as score/level increases
  const baseDifficulty = 1;
  const scoreMultiplier = Math.floor(score / 10000); // +1 difficulty per 10k sats
  const levelMultiplier = Math.floor(level / 5); // +1 difficulty per 5 levels
  
  // Cap at 6 leading zeros to prevent excessive computation
  return Math.min(baseDifficulty + scoreMultiplier + levelMultiplier, 6);
}

/**
 * Estimate time to solve based on difficulty (rough approximation)
 */
export function estimateSolveTime(difficulty: number): string {
  const avgHashesNeeded = Math.pow(16, difficulty);
  const hashesPerSecond = 50000; // Rough estimate for browser
  const seconds = avgHashesNeeded / hashesPerSecond;
  
  if (seconds < 1) return 'less than a second';
  if (seconds < 60) return `~${Math.round(seconds)} seconds`;
  if (seconds < 3600) return `~${Math.round(seconds / 60)} minutes`;
  return `~${Math.round(seconds / 3600)} hours`;
}