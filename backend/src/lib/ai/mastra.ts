/**
 * Mastra AI Backend Configuration
 *
 * This is only loaded on the backend (Node.js) where DuckDB native bindings work.
 * DuckDB bindings are .node binary files that cannot be bundled for the browser.
 *
 * Frontend imports are handled through the /api/ai/analyze endpoint instead.
 */

import { getMastra, initializeMastra } from '../../../../frontend/instalensagent/src/mastra/index'
import { instagramAnalysisWorkflow } from '../../../../frontend/instalensagent/src/mastra/workflows/instagram-analysis-workflow'

/**
 * Export initializer and getter functions
 */
export const setupMastra = initializeMastra
export const getMastraInstance = getMastra

/**
 * Helper to safely access the workflow
 * Directly imports the workflow instead of accessing through Mastra instance
 */
export async function getInstagramAnalysisWorkflow() {
  // Ensure Mastra is initialized
  try {
    const mastra = getMastra()
    if (!mastra) {
      throw new Error('Mastra instance is null or undefined')
    }
    console.log('🔍 Mastra instance type:', typeof mastra)
    console.log('🔍 Mastra instance keys:', Object.keys(mastra).join(', '))
  } catch (e) {
    console.warn('⚠️ Could not access Mastra instance:', e)
  }

  // Return the workflow directly from import
  // This bypasses any issues with Mastra instance property access
  if (!instagramAnalysisWorkflow) {
    throw new Error('Instagram analysis workflow import failed')
  }

  return instagramAnalysisWorkflow
}

export default getMastra
