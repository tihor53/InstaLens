/**
 * In-memory token store
 * Stores user access tokens temporarily in memory
 * In production, consider using sessions or JWT instead
 */

interface StoredToken {
  accessToken: string
  userId: string
  storedAt: number
}

export class TokenStore {
  private tokens: Map<string, StoredToken> = new Map()

  /**
   * Save access token in memory
   * Note: Tokens will be lost on server restart
   */
  saveToken(userId: string, accessToken: string): void {
    this.tokens.set(userId, {
      accessToken,
      userId,
      storedAt: Date.now()
    })
  }

  /**
   * Get stored access token
   */
  getToken(userId: string): string | null {
    const token = this.tokens.get(userId)
    return token ? token.accessToken : null
  }

  /**
   * Delete stored token
   */
  deleteToken(userId: string): void {
    this.tokens.delete(userId)
  }

  /**
   * Check if token exists
   */
  hasToken(userId: string): boolean {
    return this.tokens.has(userId)
  }

  /**
   * Get all stored tokens (for debugging)
   */
  getAllTokens(): string[] {
    return Array.from(this.tokens.keys())
  }
}
