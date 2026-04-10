/**
 * Mastra AI Backend Configuration
 *
 * This is only loaded on the backend (Node.js) where DuckDB native bindings work.
 * DuckDB bindings are .node binary files that cannot be bundled for the browser.
 *
 * Frontend imports are handled through the /api/ai/analyze endpoint instead.
 */

import { getMastra, initializeMastra } from '../../../../frontend/instalensagent/src/mastra/index'

/**
 * Export initializer and getter functions
 */
export const setupMastra = initializeMastra
export const getMastraInstance = getMastra

/**
 * Note: The workflow was replaced with agent-based orchestration for more control.
 * Use the individual agents (profileAnalyzerAgent, contentAnalyzerAgent, etc.)
 * from the Mastra instance instead.
 */

export default getMastra
