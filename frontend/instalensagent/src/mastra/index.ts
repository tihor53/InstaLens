import { Mastra } from '@mastra/core/mastra'
import { PinoLogger } from '@mastra/loggers'
import { LibSQLStore } from '@mastra/libsql'
import { DuckDBStore } from '@mastra/duckdb'
import { MastraCompositeStore } from '@mastra/core/storage'
import { Observability, DefaultExporter, CloudExporter, SensitiveDataFilter } from '@mastra/observability'
import { instagramAnalysisWorkflow } from './workflows/instagram-analysis-workflow'
import { profileAnalyzerAgent } from './agents/profile-analyzer-agent'
import { contentAnalyzerAgent } from './agents/content-analyzer-agent'
import { audienceAnalyzerAgent } from './agents/audience-analyzer-agent'
import { dataStructurerAgent } from './agents/data-structurer-agent'

let mastraInstance: Mastra | null = null

/**
 * Initialize Mastra with Groq LLM and DuckDB storage
 * This is called once on server startup to set up the AI agents
 */
export async function initializeMastra(): Promise<Mastra> {
  if (mastraInstance) {
    return mastraInstance
  }

  console.log('🤖 Initializing Mastra with Groq Llama 3.3 70B...')

  const observabilityStore = await new DuckDBStore().getStore('observability')

  mastraInstance = new Mastra({
    workflows: { instagramAnalysisWorkflow },
    agents: {
      profileAnalyzerAgent,
      contentAnalyzerAgent,
      audienceAnalyzerAgent,
      dataStructurerAgent,
    },
    storage: new MastraCompositeStore({
      id: 'composite-storage',
      default: new LibSQLStore({
        id: 'mastra-storage',
        url: 'file:./mastra.db',
      }),
      domains: {
        observability: observabilityStore,
      },
    }),
    logger: new PinoLogger({
      name: 'Mastra',
      level: 'info',
    }),
    observability: new Observability({
      configs: {
        default: {
          serviceName: 'mastra',
          exporters: [
            new DefaultExporter(),
            new CloudExporter(),
          ],
          spanOutputProcessors: [new SensitiveDataFilter()],
        },
      },
    }),
  })

  console.log('✅ Mastra initialized successfully')
  return mastraInstance
}

/**
 * Get the initialized Mastra instance (must call initializeMastra first)
 */
export function getMastra(): Mastra {
  if (!mastraInstance) {
    throw new Error(
      'Mastra not initialized. Call initializeMastra() during server startup.'
    )
  }
  return mastraInstance
}

export { instagramAnalysisWorkflow }
export default getMastra
