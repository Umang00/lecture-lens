/**
 * Hybrid Ranking System for RAG Results
 * Implements multiple ranking factors to improve search result relevance
 */

export interface RankingFactors {
  vectorSimilarity: number; // 0-1 (base similarity score)
  recencyBoost: number; // 0-0.1 (newer content gets boost)
  metadataMatch: number; // 0-0.15 (title/instructor matching)
  codePresence: number; // 0-0.08 (technical content boost)
  resourceTypeRelevance: number; // 0-0.12 (resource type matching)
  titleRelevance: number; // 0-0.1 (title keyword matching)
}

export interface SearchResult {
  id: string;
  type: 'lecture' | 'resource';
  text: string;
  similarity: number;
  metadata: Record<string, any>;
}

export interface RerankedResult extends SearchResult {
  finalScore: number;
  rankingFactors: RankingFactors;
}

/**
 * Rerank search results using hybrid ranking system
 */
export function rerankResults(
  results: SearchResult[],
  query: string,
  options: {
    boostRecent?: boolean;
    boostTechnical?: boolean;
    boostTitles?: boolean;
  } = {}
): RerankedResult[] {
  const {
    boostRecent = true,
    boostTechnical = true,
    boostTitles = true
  } = options;

  const queryLower = query.toLowerCase();
  const queryWords = queryLower.split(/\s+/).filter(word => word.length > 2);
  
  return results.map(result => {
    const factors: RankingFactors = {
      vectorSimilarity: result.similarity,
      recencyBoost: 0,
      metadataMatch: 0,
      codePresence: 0,
      resourceTypeRelevance: 0,
      titleRelevance: 0
    };
    
    let finalScore = result.similarity;
    
    // 1. Recency Boost (0-0.1)
    if (boostRecent) {
      const recencyScore = calculateRecencyBoost(result.metadata?.created_at);
      factors.recencyBoost = recencyScore;
      finalScore += recencyScore;
    }
    
    // 2. Metadata Match Boost (0-0.15)
    const metadataScore = calculateMetadataMatch(result, queryLower);
    factors.metadataMatch = metadataScore;
    finalScore += metadataScore;
    
    // 3. Code Presence Boost (0-0.08)
    if (boostTechnical) {
      const codeScore = calculateCodePresenceBoost(result.text, queryLower);
      factors.codePresence = codeScore;
      finalScore += codeScore;
    }
    
    // 4. Resource Type Relevance (0-0.12)
    const resourceScore = calculateResourceTypeRelevance(result, queryLower);
    factors.resourceTypeRelevance = resourceScore;
    finalScore += resourceScore;
    
    // 5. Title Relevance (0-0.1)
    if (boostTitles) {
      const titleScore = calculateTitleRelevance(result, queryWords);
      factors.titleRelevance = titleScore;
      finalScore += titleScore;
    }
    
    return {
      ...result,
      finalScore: Math.min(finalScore, 1.0), // Cap at 1.0
      rankingFactors: factors
    };
  }).sort((a, b) => b.finalScore - a.finalScore);
}

/**
 * Calculate recency boost based on creation date
 */
function calculateRecencyBoost(createdAt?: string): number {
  if (!createdAt) return 0;
  
  const created = new Date(createdAt);
  const now = new Date();
  const daysSinceCreation = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
  
  // Boost decreases over time, max boost for content < 30 days old
  if (daysSinceCreation < 30) {
    return 0.1 * (1 - daysSinceCreation / 30);
  } else if (daysSinceCreation < 90) {
    return 0.05 * (1 - (daysSinceCreation - 30) / 60);
  } else {
    return 0.02; // Small boost for older content
  }
}

/**
 * Calculate metadata match boost (instructor, title matching)
 */
function calculateMetadataMatch(result: SearchResult, queryLower: string): number {
  let score = 0;
  
  const title = result.metadata?.lectureTitle || result.metadata?.resourceTitle || '';
  const instructor = result.metadata?.instructor || '';
  const author = result.metadata?.author || '';
  
  // Title matching (0-0.1)
  if (title.toLowerCase().includes(queryLower)) {
    score += 0.1;
  } else {
    // Partial title matching
    const titleWords = title.toLowerCase().split(/\s+/);
    const matchingWords = queryLower.split(/\s+/).filter(word => 
      titleWords.some((titleWord: string) => titleWord.includes(word) || word.includes(titleWord))
    );
    score += (matchingWords.length / queryLower.split(/\s+/).length) * 0.05;
  }
  
  // Instructor/Author matching (0-0.05)
  if (instructor.toLowerCase().includes(queryLower) || 
      author.toLowerCase().includes(queryLower)) {
    score += 0.05;
  }
  
  return Math.min(score, 0.15);
}

/**
 * Calculate code presence boost for technical queries
 */
function calculateCodePresenceBoost(text: string, queryLower: string): number {
  const technicalKeywords = [
    'code', 'function', 'class', 'import', 'programming', 'development',
    'api', 'database', 'sql', 'javascript', 'python', 'react', 'node',
    'docker', 'kubernetes', 'git', 'github', 'deployment', 'server'
  ];
  
  const isTechnicalQuery = technicalKeywords.some(keyword => 
    queryLower.includes(keyword)
  );
  
  if (!isTechnicalQuery) return 0;
  
  const codeIndicators = [
    /```[\s\S]*?```/g, // Code blocks
    /function\s+\w+/g, // Function declarations
    /class\s+\w+/g, // Class declarations
    /import\s+.*from/g, // Import statements
    /const\s+\w+\s*=/g, // Const declarations
    /let\s+\w+\s*=/g, // Let declarations
    /def\s+\w+/g, // Python functions
    /\.py|\.js|\.ts|\.jsx|\.tsx/g, // File extensions
    /npm\s+install|pip\s+install/g, // Package managers
    /docker|kubernetes|k8s/g // Container technologies
  ];
  
  let codeScore = 0;
  codeIndicators.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) {
      codeScore += Math.min(matches.length * 0.01, 0.02);
    }
  });
  
  return Math.min(codeScore, 0.08);
}

/**
 * Calculate resource type relevance boost
 */
function calculateResourceTypeRelevance(result: SearchResult, queryLower: string): number {
  const resourceType = result.metadata?.type || '';
  const url = result.metadata?.url || '';
  
  let score = 0;
  
  // GitHub repository matching
  if (resourceType === 'github' || url.includes('github.com')) {
    const githubKeywords = ['github', 'repository', 'repo', 'code', 'development', 'git'];
    if (githubKeywords.some(keyword => queryLower.includes(keyword))) {
      score += 0.06;
    }
  }
  
  // YouTube video matching
  if (resourceType === 'youtube' || url.includes('youtube.com') || url.includes('youtu.be')) {
    const videoKeywords = ['video', 'tutorial', 'watch', 'demo', 'presentation', 'lecture'];
    if (videoKeywords.some(keyword => queryLower.includes(keyword))) {
      score += 0.06;
    }
  }
  
  // Blog/article matching
  if (resourceType === 'blog' || url.includes('blog') || url.includes('medium.com')) {
    const blogKeywords = ['article', 'blog', 'post', 'guide', 'tutorial', 'documentation'];
    if (blogKeywords.some(keyword => queryLower.includes(keyword))) {
      score += 0.06;
    }
  }
  
  // RSS feed matching
  if (resourceType === 'rss') {
    const rssKeywords = ['news', 'update', 'feed', 'rss', 'latest'];
    if (rssKeywords.some(keyword => queryLower.includes(keyword))) {
      score += 0.04;
    }
  }
  
  return Math.min(score, 0.12);
}

/**
 * Calculate title relevance boost
 */
function calculateTitleRelevance(result: SearchResult, queryWords: string[]): number {
  const title = result.metadata?.lectureTitle || result.metadata?.resourceTitle || '';
  if (!title) return 0;
  
  const titleWords = title.toLowerCase().split(/\s+/);
  let matchingWords = 0;
  
  queryWords.forEach(queryWord => {
    if (titleWords.some((titleWord: string) => 
      titleWord.includes(queryWord) || queryWord.includes(titleWord)
    )) {
      matchingWords++;
    }
  });
  
  if (matchingWords === 0) return 0;
  
  // Boost based on percentage of query words found in title
  const relevanceRatio = matchingWords / queryWords.length;
  return Math.min(relevanceRatio * 0.1, 0.1);
}

/**
 * Analyze ranking factors for debugging
 */
export function analyzeRankingFactors(result: RerankedResult): string {
  const factors = result.rankingFactors;
  return `
Ranking Analysis for ${result.id}:
- Vector Similarity: ${factors.vectorSimilarity.toFixed(3)}
- Recency Boost: ${factors.recencyBoost.toFixed(3)}
- Metadata Match: ${factors.metadataMatch.toFixed(3)}
- Code Presence: ${factors.codePresence.toFixed(3)}
- Resource Type: ${factors.resourceTypeRelevance.toFixed(3)}
- Title Relevance: ${factors.titleRelevance.toFixed(3)}
- Final Score: ${result.finalScore.toFixed(3)}
  `.trim();
}

/**
 * Get ranking statistics for a set of results
 */
export function getRankingStats(results: RerankedResult[]): {
  averageScore: number;
  scoreRange: [number, number];
  topFactors: string[];
} {
  if (results.length === 0) {
    return { averageScore: 0, scoreRange: [0, 0], topFactors: [] };
  }
  
  const scores = results.map(r => r.finalScore);
  const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
  const scoreRange: [number, number] = [Math.min(...scores), Math.max(...scores)];
  
  // Find most influential factors
  const factorScores = {
    recency: results.reduce((sum, r) => sum + r.rankingFactors.recencyBoost, 0),
    metadata: results.reduce((sum, r) => sum + r.rankingFactors.metadataMatch, 0),
    code: results.reduce((sum, r) => sum + r.rankingFactors.codePresence, 0),
    resource: results.reduce((sum, r) => sum + r.rankingFactors.resourceTypeRelevance, 0),
    title: results.reduce((sum, r) => sum + r.rankingFactors.titleRelevance, 0)
  };
  
  const topFactors = Object.entries(factorScores)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3)
    .map(([factor]) => factor);
  
  return { averageScore, scoreRange, topFactors };
}
