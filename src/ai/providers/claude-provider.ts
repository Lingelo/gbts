import Anthropic from '@anthropic-ai/sdk'
import type { AIProvider } from '../types'

export class ClaudeProvider implements AIProvider {
  name = 'claude'
  cost = 0.015 // $0.015 per 1K tokens (Claude 3.5 Sonnet)
  speed = 'fast' as const
  quality = 'high' as const
  supportsStreaming = true

  private client: Anthropic

  constructor(apiKey?: string) {
    const key = apiKey || process.env.CLAUDE_API_KEY
    if (!key) {
      throw new Error('Claude API key is required. Set CLAUDE_API_KEY environment variable.')
    }

    this.client = new Anthropic({
      apiKey: key,
      // Optional: Custom base URL if needed
      // baseURL: 'https://api.anthropic.com',
    })
  }

  async transpile(prompt: string): Promise<string> {
    try {
      const message = await this.client.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4000,
        temperature: 0.1, // Low temperature for consistent code generation
        messages: [{
          role: 'user',
          content: prompt,
        }],
      })

      // Extract text content from response
      const content = message.content
        .filter((block: any): block is Anthropic.TextBlock => block.type === 'text')
        .map((block: Anthropic.TextBlock) => block.text)
        .join('\n')

      if (!content) {
        throw new Error('No content received from Claude API')
      }

      // Extract C code from response (remove markdown formatting)
      return this.extractCCode(content)
    } catch (error: unknown) {
      if (error instanceof Anthropic.APIError) {
        throw new Error(`Claude API error: ${error.status} - ${error.message}`)
      } else if (error instanceof Anthropic.APIConnectionError) {
        throw new Error(`Claude API connection error: ${error.message}`)
      } else if (error instanceof Anthropic.RateLimitError) {
        throw new Error(`Claude API rate limit exceeded: ${error.message}`)
      } else if (error instanceof Anthropic.AuthenticationError) {
        throw new Error(`Claude API authentication error: ${error.message}. Check your CLAUDE_API_KEY.`)
      } else {
        throw new Error(`Claude API error: ${error instanceof Error ? error.message : String(error)}`)
      }
    }
  }

  private extractCCode(response: string): string {
    // Remove markdown code blocks
    const codeBlockMatch = response.match(/```c\n([\s\S]*?)\n```/)
    if (codeBlockMatch && codeBlockMatch[1]) {
      return codeBlockMatch[1].trim()
    }

    // Remove any other markdown formatting
    const cleanedResponse = response
      .replace(/```[\s\S]*?```/g, '') // Remove any code blocks
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
      .replace(/\*(.*?)\*/g, '$1')     // Remove italic
      .replace(/`(.*?)`/g, '$1')       // Remove inline code
      .trim()

    // If the response looks like C code, return it
    if (this.looksLikeCCode(cleanedResponse)) {
      return cleanedResponse
    }

    // Otherwise, try to extract C-like content
    const lines = cleanedResponse.split('\n')
    const cCodeLines: string[] = []
    let inCodeSection = false

    for (const line of lines) {
      const trimmedLine = line.trim()

      // Start of C code indicators
      if (trimmedLine.includes('#include') ||
          trimmedLine.includes('void main(') ||
          trimmedLine.includes('int main(')) {
        inCodeSection = true
      }

      if (inCodeSection) {
        cCodeLines.push(line)
      }

      // End of explanatory text
      if (!inCodeSection && (
        trimmedLine.includes('unsigned char') ||
          trimmedLine.includes('signed char') ||
          trimmedLine.includes('#define'))) {
        inCodeSection = true
        cCodeLines.push(line)
      }
    }

    return cCodeLines.length > 0 ? cCodeLines.join('\n') : cleanedResponse
  }

  private looksLikeCCode(text: string): boolean {
    const cIndicators = [
      '#include',
      'void main(',
      'int main(',
      'unsigned char',
      'signed char',
      ';', // C statements end with semicolons
      '{', // C uses braces
      '#define',
    ]

    let matches = 0
    for (const indicator of cIndicators) {
      if (text.includes(indicator)) {
        matches++
      }
    }

    // If we have at least 3 C indicators, it's probably C code
    return matches >= 3
  }

  // Estimate cost based on tokens (approximation)
  estimateCost(prompt: string, response: string): number {
    // Claude 3.5 Sonnet pricing (as of 2024):
    // Input: $3 per 1M tokens
    // Output: $15 per 1M tokens
    const INPUT_COST_PER_1M = 3.0
    const OUTPUT_COST_PER_1M = 15.0

    // Rough token estimation: ~4 characters per token
    const inputTokens = Math.ceil(prompt.length / 4)
    const outputTokens = Math.ceil(response.length / 4)

    const inputCost = (inputTokens / 1_000_000) * INPUT_COST_PER_1M
    const outputCost = (outputTokens / 1_000_000) * OUTPUT_COST_PER_1M

    return inputCost + outputCost
  }
}