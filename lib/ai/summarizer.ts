/**
 * Lecture Summary Generation Module
 * Generates comprehensive summaries from lecture chunks using LLM
 */

import { createOpenRouterClient, getEmbeddingModel, OPENROUTER_CONFIG } from './openrouter';
import type { Chunk } from '../vtt/types';
import type { 
  LectureSummary, 
  Section, 
  Tool, 
  Resource, 
  SummaryConfig, 
  SummarizationResult,
  ConceptWithTimestamp,
  Demo
} from './summarizer-types';

/**
 * Default summarization configuration
 */
export const DEFAULT_SUMMARY_CONFIG: SummaryConfig = {
  maxSections: 10,
  minSectionDuration: 5, // 5 minutes minimum
  includeTechnicalDetails: true,
  includeDemonstrations: true,
  includeResources: true,
  summaryStyle: 'comprehensive'
};

/**
 * Generates a comprehensive summary from lecture chunks
 * @param chunks Array of lecture chunks
 * @param config Summarization configuration
 * @param onProgress Optional progress callback
 * @returns Complete lecture summary
 */
export async function generateLectureSummary(
  chunks: Chunk[],
  config: SummaryConfig = DEFAULT_SUMMARY_CONFIG,
  onProgress?: (step: string, progress: number) => void
): Promise<SummarizationResult> {
  const startTime = Date.now();
  
  if (chunks.length === 0) {
    throw new Error('No chunks provided for summarization');
  }

  console.log(`📝 Generating summary for ${chunks.length} chunks...`);
  
  const client = createOpenRouterClient();
  const model = 'gemini-2.0-flash-exp'; // Use Gemini for better reasoning
  
  onProgress?.('Analyzing lecture structure', 10);
  
  // Step 1: Generate executive overview
  const executiveOverview = await generateExecutiveOverview(chunks, client, model);
  onProgress?.('Creating executive overview', 25);
  
  // Step 2: Detect sections and topics
  const sections = await detectSections(chunks, config, client, model);
  onProgress?.('Detecting sections', 50);
  
  // Step 3: Extract tools and frameworks
  const toolsMentioned = await extractTools(chunks, client, model);
  onProgress?.('Extracting tools', 70);
  
  // Step 4: Extract resources
  const resourcesShared = await extractResources(chunks, client, model);
  onProgress?.('Extracting resources', 85);
  
  // Step 5: Generate key takeaways
  const keyTakeaways = await generateKeyTakeaways(chunks, client, model);
  onProgress?.('Generating takeaways', 95);
  
  // Calculate total duration
  const totalDuration = calculateTotalDuration(chunks);
  
  const summary: LectureSummary = {
    executiveOverview,
    sections,
    toolsMentioned,
    keyTakeaways,
    resourcesShared,
    totalDuration,
    lectureTitle: extractLectureTitle(chunks),
    instructor: extractInstructor(chunks)
  };
  
  const processingTime = (Date.now() - startTime) / 1000;
  const tokensUsed = estimateTokensUsed(chunks);
  const confidence = calculateConfidence(sections, toolsMentioned, keyTakeaways);
  
  console.log(`✅ Generated comprehensive summary in ${processingTime.toFixed(1)}s`);
  
  return {
    summary,
    processingTime,
    chunksProcessed: chunks.length,
    tokensUsed,
    confidence
  };
}

/**
 * Generates executive overview of the lecture
 */
async function generateExecutiveOverview(
  chunks: Chunk[], 
  client: any, 
  model: string
): Promise<string> {
  const lectureText = chunks.map(chunk => chunk.text).join(' ');
  const prompt = `Analyze this lecture transcript and create a comprehensive executive overview (2-3 paragraphs) that covers:

1. Main topics and themes covered
2. Key learning objectives
3. Technical depth and complexity
4. Practical applications mentioned
5. Overall value and takeaways

Lecture transcript:
${lectureText.substring(0, 8000)} // Limit to avoid token limits

Provide a detailed, professional executive summary that would help someone understand what this lecture covers without watching it.`;

  const response = await client.chat.completions.create({
    model,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.3,
    max_tokens: 1000
  });

  return response.choices[0].message.content;
}

/**
 * Detects sections and generates section summaries
 */
async function detectSections(
  chunks: Chunk[], 
  config: SummaryConfig, 
  client: any, 
  model: string
): Promise<Section[]> {
  const lectureText = chunks.map(chunk => chunk.text).join(' ');
  
  const prompt = `Analyze this lecture transcript and identify major sections/topics. For each section, provide:

1. Section title (descriptive, 3-8 words)
2. Start and end timestamps
3. Key concepts with timestamps
4. Technical details mentioned
5. Demonstrations or examples
6. Section summary (2-3 sentences)

Format as JSON with this structure:
{
  "sections": [
    {
      "title": "Section Title",
      "timestampStart": "00:05:30",
      "timestampEnd": "00:15:45", 
      "keyConcepts": [
        {
          "concept": "Concept Name",
          "timestamp": "00:07:15",
          "explanation": "Brief explanation",
          "importance": "high"
        }
      ],
      "technicalDetails": ["Detail 1", "Detail 2"],
      "demonstrations": [
        {
          "title": "Demo Title",
          "timestamp": "00:10:30",
          "description": "What was demonstrated",
          "toolsUsed": ["Tool 1", "Tool 2"],
          "outcome": "What was achieved"
        }
      ],
      "summary": "Section summary here"
    }
  ]
}

Lecture transcript:
${lectureText.substring(0, 12000)}`;

  const response = await client.chat.completions.create({
    model,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.2,
    max_tokens: 2000
  });

  try {
    const result = JSON.parse(response.choices[0].message.content);
    return result.sections || [];
  } catch (error) {
    console.error('Failed to parse sections JSON:', error);
    return [];
  }
}

/**
 * Extracts tools and frameworks mentioned
 */
async function extractTools(
  chunks: Chunk[], 
  client: any, 
  model: string
): Promise<Tool[]> {
  const lectureText = chunks.map(chunk => chunk.text).join(' ');
  
  const prompt = `Extract all tools, frameworks, libraries, platforms, and technologies mentioned in this lecture. For each tool, provide:

1. Name of the tool/framework
2. Category (framework, library, tool, platform, language, other)
3. First timestamp mentioned
4. Description of what it is
5. Use cases mentioned
6. Any alternatives discussed

Format as JSON:
{
  "tools": [
    {
      "name": "Tool Name",
      "category": "framework",
      "firstMentioned": "00:15:30",
      "description": "What this tool does",
      "useCases": ["Use case 1", "Use case 2"],
      "alternatives": ["Alternative 1", "Alternative 2"]
    }
  ]
}

Lecture transcript:
${lectureText.substring(0, 8000)}`;

  const response = await client.chat.completions.create({
    model,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.1,
    max_tokens: 1500
  });

  try {
    const result = JSON.parse(response.choices[0].message.content);
    return result.tools || [];
  } catch (error) {
    console.error('Failed to parse tools JSON:', error);
    return [];
  }
}

/**
 * Extracts resources and references mentioned
 */
async function extractResources(
  chunks: Chunk[], 
  client: any, 
  model: string
): Promise<string[]> {
  const lectureText = chunks.map(chunk => chunk.text).join(' ');
  
  const prompt = `Extract all resources, documentation, tutorials, repositories, articles, videos, or other references mentioned in this lecture. Include:

1. Documentation links
2. Tutorial references
3. GitHub repositories
4. Articles or blog posts
5. Video tutorials
6. Books or papers
7. Official websites
8. Community resources

Format as a simple JSON array of resource names/descriptions:
{
  "resources": [
    "Resource 1",
    "Resource 2",
    "Resource 3"
  ]
}

Lecture transcript:
${lectureText.substring(0, 6000)}`;

  const response = await client.chat.completions.create({
    model,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.1,
    max_tokens: 1000
  });

  try {
    const result = JSON.parse(response.choices[0].message.content);
    return result.resources || [];
  } catch (error) {
    console.error('Failed to parse resources JSON:', error);
    return [];
  }
}

/**
 * Generates key takeaways from the lecture
 */
async function generateKeyTakeaways(
  chunks: Chunk[], 
  client: any, 
  model: string
): Promise<string[]> {
  const lectureText = chunks.map(chunk => chunk.text).join(' ');
  
  const prompt = `Generate 5-8 key takeaways from this lecture. Each takeaway should be:

1. Actionable and specific
2. Based on actual content from the lecture
3. Include timestamps when relevant
4. Focus on practical applications
5. Highlight important concepts or techniques

Format as JSON array:
{
  "takeaways": [
    "Takeaway 1 with timestamp if relevant",
    "Takeaway 2 with timestamp if relevant"
  ]
}

Lecture transcript:
${lectureText.substring(0, 8000)}`;

  const response = await client.chat.completions.create({
    model,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.3,
    max_tokens: 800
  });

  try {
    const result = JSON.parse(response.choices[0].message.content);
    return result.takeaways || [];
  } catch (error) {
    console.error('Failed to parse takeaways JSON:', error);
    return [];
  }
}

/**
 * Helper functions
 */
function calculateTotalDuration(chunks: Chunk[]): number {
  if (chunks.length === 0) return 0;
  
  const lastChunk = chunks[chunks.length - 1];
  const endTime = parseTimestamp(lastChunk.endTime);
  return Math.round(endTime / 60); // Convert to minutes
}

function extractLectureTitle(chunks: Chunk[]): string | undefined {
  // Look for title patterns in first few chunks
  const firstChunks = chunks.slice(0, 3);
  const text = firstChunks.map(c => c.text).join(' ');
  
  // Simple pattern matching for titles
  const titlePatterns = [
    /(?:lecture|session|class|workshop|tutorial):\s*([^.!?]+)/i,
    /(?:today|we'll|we will)\s+(?:cover|discuss|talk about)\s+([^.!?]+)/i,
    /(?:welcome to|introduction to)\s+([^.!?]+)/i
  ];
  
  for (const pattern of titlePatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  
  return undefined;
}

function extractInstructor(chunks: Chunk[]): string | undefined {
  // Look for instructor name patterns
  const firstChunks = chunks.slice(0, 5);
  const text = firstChunks.map(c => c.text).join(' ');
  
  const instructorPatterns = [
    /(?:hi|hello|welcome),?\s*(?:i'm|i am)\s+([a-zA-Z\s]+)/i,
    /(?:this is|i'm)\s+([a-zA-Z\s]+)(?:\s+and|,)/i
  ];
  
  for (const pattern of instructorPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  
  return undefined;
}

function parseTimestamp(timestamp: string): number {
  const parts = timestamp.split(':');
  if (parts.length === 3) {
    const [hours, minutes, seconds] = parts;
    return parseInt(hours) * 3600 + parseInt(minutes) * 60 + parseFloat(seconds);
  }
  return 0;
}

function estimateTokensUsed(chunks: Chunk[]): number {
  const totalText = chunks.map(c => c.text).join(' ');
  return Math.ceil(totalText.length / 4); // Rough estimate
}

function calculateConfidence(sections: Section[], tools: Tool[], takeaways: string[]): number {
  // Simple confidence calculation based on completeness
  let confidence = 0;

  if (sections.length > 0) confidence += 0.4;
  if (tools.length > 0) confidence += 0.2;
  if (takeaways.length > 0) confidence += 0.2;
  if (sections.some(s => s.keyConcepts.length > 0)) confidence += 0.2;

  return Math.min(confidence, 1.0);
}

/**
 * Generates a concise summary for a resource (3-5 sentences)
 * @param content Resource content
 * @param title Resource title
 * @returns Summary text
 */
export async function generateResourceSummary(
  content: string,
  title: string
): Promise<string> {
  const client = createOpenRouterClient();
  const model = 'gemini-2.0-flash-exp';

  console.log(`📝 Generating summary for resource: ${title}`);

  // Limit content to avoid token limits
  const truncatedContent = content.substring(0, 6000);

  const prompt = `Create a concise 3-5 sentence summary of this resource. Focus on:
1. What the resource is about
2. Key topics covered
3. Who would find it useful
4. Main takeaways

Resource Title: ${title}

Content:
${truncatedContent}

Provide a clear, informative summary that helps users decide if they want to read this resource.`;

  const response = await client.chat.completions.create({
    model,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.3,
    max_tokens: 300
  });

  const summary = response.choices[0].message.content;
  console.log(`✅ Generated resource summary (${summary.length} chars)`);

  return summary;
}
