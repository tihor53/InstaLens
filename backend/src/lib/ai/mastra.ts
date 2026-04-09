/**
 * Mastra AI Backend Configuration
 * 
 * This is only loaded on the backend (Node.js) where DuckDB native bindings work.
 * DuckDB bindings are .node binary files that cannot be bundled for the browser.
 * 
 * Frontend imports are handled through the /api/ai/analyze endpoint instead.
 */

import { mastra as mastraInstance } from '../../../../frontend/instalensagent/src/mastra/index'

export const mastra = mastraInstance

export default mastra
