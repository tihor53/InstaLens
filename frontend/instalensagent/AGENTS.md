# AGENTS.md

You are a TypeScript developer experienced with the Mastra framework. You build AI agents, tools, workflows, and scorers. You follow strict TypeScript practices and always consult up-to-date Mastra documentation before making changes.

## CRITICAL: Load `mastra` skill

**BEFORE doing ANYTHING with Mastra, load the `mastra` skill FIRST.** Never rely on cached knowledge as Mastra's APIs change frequently between versions. Use the skill to read up-to-date documentation from `node_modules`.

## Project Overview

This is a **Mastra** project written in TypeScript. Mastra is a framework for building AI-powered applications and agents with a modern TypeScript stack. The Node.js runtime is `>=22.13.0`.

## Commands

```bash
npm run dev # Start Mastra Studio at localhost:4111 (long-running, use a separate terminal)
npm run build # Build a production-ready server
```

## Project Structure

| Folder                 | Description                                                                                                                              |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `src/mastra`           | Entry point for all Mastra-related code and configuration.                                                                               |
| `src/mastra/agents`    | Define and configure your agents - their behavior, goals, and tools.                                                                     |
| `src/mastra/workflows` | Define multi-step workflows that orchestrate agents and tools together.                                                                  |
| `src/mastra/tools`     | Create reusable tools that your agents can call                                                                                          |
| `src/mastra/mcp`       | (Optional) Implement custom MCP servers to share your tools with external agents                                                         |
| `src/mastra/scorers`   | (Optional) Define scorers for evaluating agent performance over time                                                                     |
| `src/mastra/public`    | (Optional) Contents are copied into the `.build/output` directory during the build process, making them available for serving at runtime |

### Top-level files

Top-level files define how your Mastra project is configured, built, and connected to its environment.

| File                  | Description                                                                                                       |
| --------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `src/mastra/index.ts` | Central entry point where you configure and initialize Mastra.                                                    |
| `.env.example`        | Template for environment variables - copy and rename to `.env` to add your secret [model provider](/models) keys. |
| `package.json`        | Defines project metadata, dependencies, and available npm scripts.                                                |
| `tsconfig.json`       | Configures TypeScript options such as path aliases, compiler settings, and build output.                          |

## Boundaries

### Always do

- Load the `mastra` skill before any Mastra-related work
- Register new agents, tools, workflows, and scorers in `src/mastra/index.ts`
- Use schemas for tool inputs and outputs
- Run `npm run build` to verify changes compile

### Never do

- Never commit `.env` files or secrets
- Never modify `node_modules` or Mastra's database files directly
- Never hardcode API keys (always use environment variables)

## Resources

- [Mastra Documentation](https://mastra.ai/llms.txt)
- [Mastra .well-known skills discovery](https://mastra.ai/.well-known/skills/index.json)

---

## Instagram Profile Analysis System (Phase 2)

This project includes a complete Instagram business profile analyzer with 4 specialized AI agents.

### Agents

#### 1. **Profile Analyzer** (`profile-analyzer-agent.ts`)
Analyzes Instagram business profiles for business identity and classification.
- **Input**: Instagram profile data
- **Output**: Business identity, classification, branding, location information
- **Model**: Llama 3.3 70B (via Groq)

#### 2. **Content Analyzer** (`content-analyzer-agent.ts`)
Analyzes post content for themes, services, and visual style.
- **Input**: Post captions, hashtags, engagement metrics
- **Output**: Content themes, services, product categories, CTAs, visual style
- **Model**: Llama 3.3 70B (via Groq)

#### 3. **Audience Analyzer** (`audience-analyzer-agent.ts`)
Infers audience insights from profile and content data.
- **Input**: Profile analysis, content analysis, raw metrics
- **Output**: Demographics, engagement patterns, community characteristics, customer journey
- **Model**: Llama 3.3 70B (via Groq)

#### 4. **Data Structurer** (`data-structurer-agent.ts`)
Structures all analysis data into CRM-ready format.
- **Input**: All previous analyses
- **Output**: Lead data, enrichment data, segmentation, marketing intelligence
- **Model**: Llama 3.3 70B (via Groq)

### Workflow

The **`instagramAnalysisWorkflow`** orchestrates all 4 agents:
1. Profile Analyzer and Content Analyzer run **in parallel**
2. Audience Analyzer runs after both complete (depends on both)
3. Data Structurer runs last (depends on all)
4. Returns complete structured analysis

**Location**: `src/mastra/workflows/instagram-analysis-workflow.ts`

### Usage Example

```typescript
const result = await instagramAnalysisWorkflow.execute({
  triggerData: {
    username: 'business_account',
    fullName: 'Business Name',
    biography: 'Business bio and description',
    website: 'https://example.com',
    followerCount: 5000,
    followingCount: 100,
    postCount: 150,
    isBusinessAccount: true,
    posts: [
      {
        caption: 'Post caption...',
        hashtags: ['#tag1', '#tag2'],
        likes: 100,
        comments: 10,
      },
      // ... more posts
    ],
  },
});

// Result contains:
// - profileAnalysis
// - contentAnalysis
// - audienceAnalysis
// - structuredData (CRM-ready)
```

### Environment Setup

Required environment variable:
```bash
GROQ_API_KEY=your-groq-api-key
```
