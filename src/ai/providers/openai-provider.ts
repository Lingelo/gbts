import OpenAI from 'openai'
import type { AIProvider } from '../types'

export class OpenAIProvider implements AIProvider {
  name = 'openai'
  cost = 0.01 // GPT-4 pricing per 1K tokens
  speed = 'medium' as const
  quality = 'high' as const
  supportsStreaming = true

  private client: OpenAI

  constructor(apiKey?: string) {
    const key = apiKey || process.env.OPENAI_API_KEY
    if (!key) {
      throw new Error('OpenAI API key is required. Set OPENAI_API_KEY environment variable.')
    }

    this.client = new OpenAI({
      apiKey: key,
    })
  }

  async transpile(prompt: string): Promise<string> {
    try {
      const completion = await this.client.chat.completions.create({
        model: 'gpt-4', // Can also use 'gpt-4-turbo' or 'gpt-3.5-turbo'
        messages: [
          {
            role: 'system',
            content: 'You are an expert GameBoy C programmer. Convert JavaScript/TypeScript to optimal GameBoy C code using GBDK.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 4000,
        temperature: 0.1, // Low temperature for consistent code generation
        top_p: 0.9,
        frequency_penalty: 0,
        presence_penalty: 0,
      })

      const content = completion.choices[0]?.message?.content

      if (!content) {
        throw new Error('No content received from OpenAI API')
      }

      // Extract C code from response
      return this.extractCCode(content)
    } catch (error: unknown) {
      if (error instanceof OpenAI.APIError) {
        throw new Error(`OpenAI API error: ${error.status} - ${error.message}`)
      } else if (error instanceof OpenAI.APIConnectionError) {
        throw new Error(`OpenAI API connection error: ${error.message}`)
      } else if (error instanceof OpenAI.RateLimitError) {
        throw new Error(`OpenAI API rate limit exceeded: ${error.message}`)
      } else if (error instanceof OpenAI.AuthenticationError) {
        throw new Error(`OpenAI API authentication error: ${error.message}. Check your OPENAI_API_KEY.`)
      } else {
        throw new Error(`OpenAI API error: ${error instanceof Error ? error.message : String(error)}`)
      }
    }
  }

  private extractCCode(response: string): string {
    // Remove markdown code blocks
    const codeBlockMatch = response.match(/```c\n([\s\S]*?)\n```/)
    if (codeBlockMatch && codeBlockMatch[1]) {
      return codeBlockMatch[1].trim()
    }

    // Try other code block formats
    const genericCodeMatch = response.match(/```\n([\s\S]*?)\n```/)
    if (genericCodeMatch && genericCodeMatch[1] && this.looksLikeCCode(genericCodeMatch[1])) {
      return genericCodeMatch[1].trim()
    }

    // Remove markdown formatting
    const cleanedResponse = response
      .replace(/```[\s\S]*?```/g, '')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/`(.*?)`/g, '$1')
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

      // Start collecting if we see C-style code
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
      'printf(',
      'scanf(',
      ';',
      '{',
      '}',
      '#define',
    ]

    let matches = 0
    for (const indicator of cIndicators) {
      if (text.includes(indicator)) {
        matches++
      }
    }

    return matches >= 3
  }

  // Estimate cost based on tokens
  estimateCost(prompt: string, response: string): number {
    // GPT-4 pricing (as of 2024):
    // Input: $30 per 1M tokens
    // Output: $60 per 1M tokens
    const INPUT_COST_PER_1M = 30.0
    const OUTPUT_COST_PER_1M = 60.0

    // Rough token estimation: ~4 characters per token
    const inputTokens = Math.ceil(prompt.length / 4)
    const outputTokens = Math.ceil(response.length / 4)

    const inputCost = (inputTokens / 1_000_000) * INPUT_COST_PER_1M
    const outputCost = (outputTokens / 1_000_000) * OUTPUT_COST_PER_1M

    return inputCost + outputCost
  }
}