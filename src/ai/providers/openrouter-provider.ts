import OpenAI from 'openai'
import type { AIProvider } from '../types'

export class OpenRouterProvider implements AIProvider {
  name = 'openrouter'
  cost = 0.008 // Average cost per 1K tokens for GPT-4/Claude
  speed = 'medium' as const
  quality = 'high' as const
  supportsStreaming = true

  private client: OpenAI
  private model: string

  constructor(apiKey?: string, model: string = 'anthropic/claude-3.5-sonnet') {
    const key = apiKey || process.env.OPENROUTER_API_KEY
    if (!key) {
      throw new Error('OpenRouter API key is required. Set OPENROUTER_API_KEY environment variable.')
    }

    this.model = model
    this.client = new OpenAI({
      apiKey: key,
      baseURL: 'https://openrouter.ai/api/v1',
      defaultHeaders: {
        'HTTP-Referer': 'https://github.com/Freuhlon/gbts',
        'X-Title': 'GBTS - GameBoy TypeScript Transpiler',
      },
    })
  }

  async transpile(prompt: string): Promise<string> {
    try {
      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert GameBoy C programmer. Convert JavaScript/TypeScript to optimal GameBoy C code using GBDK. Focus on memory efficiency, GameBoy hardware constraints, and proper GBDK functions.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 4000,
        temperature: 0.1,
        top_p: 0.9,
      })

      const content = completion.choices[0]?.message?.content

      if (!content) {
        throw new Error('No content received from OpenRouter API')
      }

      return this.extractCCode(content)
    } catch (error: unknown) {
      if (error instanceof OpenAI.APIError) {
        throw new Error(`OpenRouter API error: ${error.status} - ${error.message}`)
      } else if (error instanceof OpenAI.APIConnectionError) {
        throw new Error(`OpenRouter API connection error: ${error.message}`)
      } else if (error instanceof OpenAI.RateLimitError) {
        throw new Error(`OpenRouter API rate limit exceeded: ${error.message}`)
      } else if (error instanceof OpenAI.AuthenticationError) {
        throw new Error(`OpenRouter API authentication error: ${error.message}. Check your OPENROUTER_API_KEY.`)
      } else {
        throw new Error(`OpenRouter API error: ${error instanceof Error ? error.message : String(error)}`)
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

  // Estimate cost based on model pricing
  estimateCost(prompt: string, response: string): number {
    const tokenCount = Math.ceil((prompt.length + response.length) / 4)

    // OpenRouter pricing varies by model, using average
    const costPer1K = this.model.includes('claude') ? 0.015 : 0.03

    return (tokenCount / 1000) * costPer1K
  }
}