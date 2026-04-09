import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * Base Agent class for AI analysis
 */
class Agent {
  protected client: Anthropic;
  public id: string;
  public name: string;
  public instructions: string;

  constructor(
    id: string,
    name: string,
    instructions: string,
    anthropicClient?: Anthropic
  ) {
    this.id = id;
    this.name = name;
    this.instructions = instructions;
    this.client = anthropicClient || client;
  }

  /**
   * Generate a response from the agent
   */
  async generate(userPrompt: string, context?: string): Promise<any> {
    try {
      const systemPrompt = `${this.instructions}${context ? '\n\nContext:\n' + context : ''}`;

      const response = await this.client.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4096,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: userPrompt,
          },
        ],
      });

      if (response.content[0].type === 'text') {
        return {
          text: response.content[0].text,
          content: response.content[0].text,
        };
      }

      return response;
    } catch (error) {
      console.error(`Error in agent ${this.id}:`, error);
      throw error;
    }
  }
}

/**
 * Profile Analyzer Agent
 * Analyzes Instagram business profiles for identity, classification, branding, and location
 */
const profileAnalyzer = new Agent(
  'profile-analyzer',
  'Profile Analyzer',
  `You are an expert business analyst specializing in Instagram business profiles.

Your task is to analyze Instagram profile data and extract:
1. Business identity (name, tagline, brand positioning)
2. Business category (e.g., Restaurant, Fashion, Fitness, etc.)
3. Business model (B2C, B2B, D2C, etc.)
4. Brand voice and tone
5. Geographic location and service areas

You MUST return your analysis as valid JSON with NO additional text or markdown.
Ensure all fields are properly typed and values are accurate based on the provided data.`
);

/**
 * Content Analyzer Agent
 * Analyzes Instagram post content for themes, services, products, CTAs, and visual style
 */
const contentAnalyzer = new Agent(
  'content-analyzer',
  'Content Analyzer',
  `You are a content strategist analyzing Instagram posts.

Your task is to analyze post content and identify:
1. Main content themes (e.g., product showcases, lifestyle, education)
2. Service offerings mentioned in posts and captions
3. Product categories featured
4. Call-to-action patterns
5. Visual style and aesthetic

You MUST return your analysis as valid JSON with NO additional text or markdown.
Ensure all fields are properly typed and observations are grounded in the actual post content.`
);

/**
 * Audience Analyzer Agent
 * Analyzes target audience, engagement patterns, and customer journey
 */
const audienceAnalyzer = new Agent(
  'audience-analyzer',
  'Audience Analyzer',
  `You are a social media analyst specializing in audience insights.

Your task is to infer from the provided content analysis and profile data:
1. Target audience demographics (age range, interests, lifestyle)
2. Engagement patterns (posting frequency, best performing content)
3. Community characteristics (size, engagement level, loyalty)
4. Pain points and needs addressed
5. Customer journey stages targeted

You MUST return your analysis as valid JSON with NO additional text or markdown.
Base your inferences on the provided data and clearly justify your assessments.`
);

/**
 * Data Structurer Agent
 * Structures analyzed data into CRM-ready format
 */
const dataStructurer = new Agent(
  'data-structurer',
  'Data Structurer',
  `You are a data engineer specializing in CRM data formatting.

Your task is to take the combined analysis results and structure them into a format suitable for:
1. CRM systems (HubSpot, Salesforce)
2. Google Sheets exports
3. Marketing automation tools

Ensure all data is:
- Properly typed and validated
- In the correct format for CRM systems
- Complete and comprehensive

You MUST return a comprehensive JSON object with proper structure.
NO additional text or markdown - just the JSON object.`
);

export const mastra = {
  agents: {
    profileAnalyzer,
    contentAnalyzer,
    audienceAnalyzer,
    dataStructurer,
  },
};

export type { Agent };
export default mastra;
