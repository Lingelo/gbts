// @ts-nocheck - Temporary while refactoring
import type {
  AIProvider,
  GameBoyContext,
  TranspilationResult,
  TranspilationExample,
  AITranspilerConfig,
} from './types'
import { ClaudeProvider } from './providers/claude-provider'
import { OpenAIProvider } from './providers/openai-provider'
import { GameBoyPromptEngine } from './prompt-engine'
import { Logger } from '../logger'
import crypto from 'crypto'

export class AITranspiler {
  private providers: Map<string, AIProvider> = new Map()
  private promptEngine: GameBoyPromptEngine
  private cache: Map<string, TranspilationResult> = new Map()
  private learningData: TranspilationExample[] = []
  private config: AITranspilerConfig
  private dailySpent: number = 0
  private lastResetDate: string = new Date().toISOString().split('T')[0]

  constructor(config: AITranspilerConfig) {
    this.config = config
    this.promptEngine = new GameBoyPromptEngine()
    this.initializeProviders()
  }

  private initializeProviders(): void {
    const errors: string[] = []

    // Get API keys from config (with env fallback)
    const claudeKey = this.config.providers.apiKeys?.claude || process.env.CLAUDE_API_KEY
    const openaiKey = this.config.providers.apiKeys?.openai || process.env.OPENAI_API_KEY

    // Initialize Claude if API key is available
    if (claudeKey) {
      try {
        const claude = new ClaudeProvider(claudeKey)
        this.providers.set('claude', claude)
        Logger.info('✨ Claude AI provider initialized - Ready for GameBoy magic!')
      } catch (error) {
        errors.push(`Claude: ${error instanceof Error ? error.message : String(error)}`)
      }
    }

    // Initialize OpenAI if API key is available
    if (openaiKey) {
      try {
        const openai = new OpenAIProvider(openaiKey)
        this.providers.set('openai', openai)
        Logger.info('🤖 OpenAI provider initialized - GPT power activated!')
      } catch (error) {
        errors.push(`OpenAI: ${error instanceof Error ? error.message : String(error)}`)
      }
    }

    // Check if we have at least one provider
    if (this.providers.size === 0) {
      Logger.error('🚨 No AI providers available!')
      Logger.info('💡 Set CLAUDE_API_KEY and/or OPENAI_API_KEY environment variables')
      Logger.info('🌐 Claude: https://console.anthropic.com/')
      Logger.info('🌐 OpenAI: https://platform.openai.com/api-keys')

      if (errors.length > 0) {
        Logger.error(`Provider errors: ${errors.join(', ')}`)
      }

      throw new Error('AI Transpiler requires at least one AI provider. Set CLAUDE_API_KEY or OPENAI_API_KEY.')
    }

    Logger.success(`🚀 ${this.providers.size} AI provider(s) ready: ${Array.from(this.providers.keys()).join(', ')}`)
  }

  async transpile(
    jsCode: string,
    context: GameBoyContext,
    options: { useCache?: boolean; maxRetries?: number } = {},
  ): Promise<TranspilationResult> {
    const { useCache = true, maxRetries = 3 } = options

    // Check budget first
    this.resetDailyBudgetIfNeeded()
    if (this.dailySpent >= this.config.budget.dailyBudget) {
      throw new Error(`Daily budget exceeded: $${this.dailySpent.toFixed(2)} / $${this.config.budget.dailyBudget}`)
    }

    // Check cache
    const cacheKey = this.generateCacheKey(jsCode, context)
    if (useCache && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)!
      Logger.info(`🎯 Using cached AI transpilation (saved $${cached.cost.toFixed(4)})`)
      return { ...cached, fromCache: true }
    }

    // Get learning examples
    const similarExamples = this.findSimilarExamples(jsCode)

    // Build AI prompt
    const prompt = this.promptEngine.buildPrompt(jsCode, context, similarExamples)

    Logger.info(`🤖 AI transpilation starting... (JS: ${jsCode.length} chars)`)
    const startTime = Date.now()

    let lastError: Error | null = null

    // Get preferred provider
    const preferredProvider = this.getPreferredProvider()

    // Try AI transpilation with retries
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const provider = this.providers.get(preferredProvider)!

        // Check if this attempt would exceed budget
        const estimatedCost = (prompt.length + jsCode.length) / 4000 * provider.cost
        if (this.dailySpent + estimatedCost > this.config.budget.dailyBudget) {
          throw new Error(`Would exceed daily budget. Estimated cost: $${estimatedCost.toFixed(4)}`)
        }

        Logger.info(`🎮 Attempt ${attempt}/${maxRetries} - Sending to Claude AI...`)

        const cCode = await provider.transpile(prompt)
        const duration = Date.now() - startTime

        // Calculate actual cost
        const actualCost = provider instanceof ClaudeProvider ?
          provider.estimateCost(prompt, cCode) : estimatedCost

        this.dailySpent += actualCost

        // Validate result
        if (!cCode || cCode.trim().length === 0) {
          throw new Error('AI returned empty result')
        }

        if (!this.looksLikeCCode(cCode)) {
          throw new Error('AI result does not look like valid C code')
        }

        // Create result
        const result: TranspilationResult = {
          cCode: this.postProcessCCode(cCode),
          provider: preferredProvider,
          duration,
          cost: actualCost,
          quality: this.estimateQuality(cCode),
          fromCache: false,
          metadata: {
            originalSize: jsCode.length,
            transpiredSize: cCode.length,
            estimatedROMSize: this.estimateROMSize(cCode),
            estimatedRAMUsage: this.estimateRAMUsage(cCode),
            warnings: [],
            optimizations: this.detectOptimizations(cCode),
          },
        }

        // Cache result
        if (useCache) {
          this.cache.set(cacheKey, result)
        }

        // Add to learning data
        this.addToLearning(jsCode, result.cCode, context, result.quality, preferredProvider)

        Logger.success(`🎉 AI transpilation completed! Duration: ${duration}ms, Cost: $${actualCost.toFixed(4)}`)
        Logger.info(`📊 Quality: ${(result.quality * 100).toFixed(1)}%, ROM: ~${result.metadata.estimatedROMSize} bytes`)

        return result
      } catch (error) {
        lastError = error as Error
        Logger.warn(`❌ Attempt ${attempt} failed: ${lastError.message}`)

        if (attempt < maxRetries) {
          Logger.info('🔄 Retrying in 2 seconds...')
          await new Promise(resolve => setTimeout(resolve, 2000))
        }
      }
    }

    // All retries failed
    Logger.error(`💥 AI transpilation failed after ${maxRetries} attempts`)
    throw lastError || new Error('AI transpilation failed with unknown error')
  }

  private getPreferredProvider(): string {
    // Use configuration preference
    const preferred = this.config.providers.primary
    if (this.providers.has(preferred)) {
      return preferred
    }

    // Fallback to any available provider
    const available = Array.from(this.providers.keys())
    if (available.length > 0) {
      Logger.warn(`Preferred provider '${preferred}' not available, using '${available[0]}'`)
      return available[0]
    }

    throw new Error('No AI providers available')
  }

  private generateCacheKey(jsCode: string, context: GameBoyContext): string {
    const contextStr = JSON.stringify(context)
    return crypto.createHash('sha256')
      .update(jsCode + contextStr)
      .digest('hex')
      .substring(0, 16)
  }

  private findSimilarExamples(jsCode: string): TranspilationExample[] {
    // Simple similarity based on keywords and patterns
    const keywords = this.extractKeywords(jsCode)

    return this.learningData
      .filter(example => {
        const exampleKeywords = this.extractKeywords(example.jsCode)
        const overlap = keywords.filter(k => exampleKeywords.includes(k)).length
        return overlap > 0 && example.quality > 0.7
      })
      .sort((a, b) => b.quality - a.quality)
      .slice(0, 3)
  }

  private extractKeywords(code: string): string[] {
    const keywords = [
      'console.log', 'function', 'const', 'let', 'var', 'if', 'for', 'while',
      'array', 'object', 'class', 'async', 'await', 'Promise', 'setTimeout',
      'addEventListener', 'Math.', 'parseInt', 'parseFloat', 'JSON.',
      'forEach', 'map', 'filter', 'reduce', 'push', 'pop', 'splice',
    ]

    return keywords.filter(keyword => code.includes(keyword))
  }

  private looksLikeCCode(code: string): boolean {
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
      if (code.includes(indicator)) {
        matches++
      }
    }

    return matches >= 3
  }

  private postProcessCCode(cCode: string): string {
    let processed = cCode

    // Ensure GameBoy headers are included
    if (!processed.includes('#include <gb/gb.h>')) {
      processed = `#include <gb/gb.h>\n${processed}`
    }

    if (!processed.includes('#include <stdio.h>')) {
      processed = processed.replace('#include <gb/gb.h>', '#include <gb/gb.h>\n#include <stdio.h>')
    }

    // Add memory optimization hints
    processed = processed
      // Mark frequently used variables for zero page
      .replace(/unsigned char (player_\w+|enemy_\w+|bullet_\w+)/g, '__at(0xFF80) unsigned char $1')

      // Mark constants for ROM storage
      .replace(/const char (\w+)\[\]/g, '__code const char $1[]')

      // Optimize small arrays
      .replace(/unsigned char (\w+)\[([1-4])\]/g, 'register unsigned char $1[$2]')

    return processed
  }

  private estimateQuality(cCode: string): number {
    let score = 0.5 // Base score

    // Positive indicators
    if (cCode.includes('#include <gb/gb.h>')) score += 0.1
    if (cCode.includes('unsigned char')) score += 0.1
    if (cCode.includes('wait_vbl_done')) score += 0.1
    if (cCode.includes('printf')) score += 0.05
    if (cCode.match(/void\s+main\s*\(/)) score += 0.1

    // Negative indicators
    if (cCode.includes('malloc') || cCode.includes('free')) score -= 0.2
    if (cCode.includes('float') || cCode.includes('double')) score -= 0.15
    if (cCode.includes('int ') && !cCode.includes('unsigned char')) score -= 0.05

    // Length penalty (too short = probably incomplete)
    if (cCode.length < 50) score -= 0.2

    return Math.max(0, Math.min(1, score))
  }

  private estimateROMSize(cCode: string): number {
    // Rough estimation based on lines and complexity
    const lines = cCode.split('\n').filter(line => line.trim().length > 0)
    const avgBytesPerLine = 8 // Conservative estimate
    return lines.length * avgBytesPerLine
  }

  private estimateRAMUsage(cCode: string): number {
    // Count variable declarations
    const charVars = (cCode.match(/unsigned char \w+/g) || []).length
    const intVars = (cCode.match(/int \w+/g) || []).length
    const arrays = (cCode.match(/\w+\[\d+\]/g) || [])

    let ramUsage = charVars * 1 + intVars * 2

    // Estimate array sizes
    arrays.forEach(arr => {
      const sizeMatch = arr.match(/\[(\d+)\]/)
      if (sizeMatch) {
        ramUsage += parseInt(sizeMatch[1])
      }
    })

    return ramUsage
  }

  private detectOptimizations(cCode: string): string[] {
    const optimizations: string[] = []

    if (cCode.includes('unsigned char')) {
      optimizations.push('8-bit variables used for GameBoy efficiency')
    }

    if (cCode.includes('__at(0xFF80)')) {
      optimizations.push('Zero page optimization applied')
    }

    if (cCode.includes('__code const')) {
      optimizations.push('Constants stored in ROM')
    }

    if (cCode.includes('register')) {
      optimizations.push('Register optimization hints added')
    }

    return optimizations
  }

  private addToLearning(
    jsCode: string,
    cCode: string,
    context: GameBoyContext,
    quality: number,
    provider: string,
  ): void {
    if (!this.config.quality.enableLearning) return

    const example: TranspilationExample = {
      id: crypto.randomUUID(),
      jsCode,
      cCode,
      context,
      quality,
      performance: {
        estimatedCycles: this.estimateROMSize(cCode) * 4, // Rough estimate
        memoryEfficiency: 1 - (this.estimateRAMUsage(cCode) / 8192), // 8KB RAM
        sizeEfficiency: 1 - (this.estimateROMSize(cCode) / 32768), // 32KB ROM
        overallScore: quality,
      },
      timestamp: Date.now(),
      provider,
    }

    this.learningData.push(example)

    // Keep only best 100 examples
    if (this.learningData.length > 100) {
      this.learningData = this.learningData
        .sort((a, b) => b.quality - a.quality)
        .slice(0, 100)
    }
  }

  private resetDailyBudgetIfNeeded(): void {
    const today = new Date().toISOString().split('T')[0]
    if (today !== this.lastResetDate) {
      this.dailySpent = 0
      this.lastResetDate = today
      Logger.info(`💰 Daily budget reset: $${this.config.budget.dailyBudget}`)
    }
  }
}