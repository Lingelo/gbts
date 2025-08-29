import type { AITranspilerConfig, GameBoyContext } from '../ai/types'
import fs from 'fs'
import path from 'path'

export class AIConfig {
  private config: AITranspilerConfig
  private configPath: string

  constructor(configPath?: string) {
    this.configPath = configPath || path.join(process.cwd(), 'gbts.config.json')
    this.config = this.loadConfig()
  }

  private loadConfig(): AITranspilerConfig {
    const defaultConfig: AITranspilerConfig = {
      providers: {
        primary: 'claude',
        fallback: ['openai', 'local'],
        local: {
          endpoint: 'http://localhost:11434/api/generate',
          model: 'codellama:7b',
          temperature: 0.1,
          maxTokens: 4000,
        },
      },
      caching: {
        enabled: true,
        maxSize: 1000, // 1000 entries
        ttl: 24 * 60 * 60 * 1000, // 24 hours
      },
      budget: {
        maxCostPerTranspilation: 0.10, // $0.10
        dailyBudget: 5.00, // $5.00 per day
        preferLocal: false,
      },
      quality: {
        minScore: 0.7, // 70%
        requireValidation: true,
        enableLearning: true,
      },
      project: {
        chunkSize: 4000, // Max characters per chunk
        maxFileSize: 8000, // Max characters before chunking
        enableModularBuild: true, // 1 .ts = 1 .c
      },
    }

    if (fs.existsSync(this.configPath)) {
      try {
        const userConfig = JSON.parse(fs.readFileSync(this.configPath, 'utf-8'))
        return this.mergeConfig(defaultConfig, userConfig)
      } catch (error) {
        console.warn('Failed to load config, using defaults:', error)
        return defaultConfig
      }
    }

    return defaultConfig
  }

  private mergeConfig(defaultConfig: AITranspilerConfig, userConfig: any): AITranspilerConfig {
    return {
      providers: { ...defaultConfig.providers, ...userConfig.providers },
      caching: { ...defaultConfig.caching, ...userConfig.caching },
      budget: { ...defaultConfig.budget, ...userConfig.budget },
      quality: { ...defaultConfig.quality, ...userConfig.quality },
      project: { ...defaultConfig.project, ...userConfig.project },
    }
  }

  get(): AITranspilerConfig {
    return this.config
  }

  update(updates: Partial<AITranspilerConfig>): void {
    this.config = this.mergeConfig(this.config, updates)
    this.save()
  }

  save(): void {
    try {
      fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2))
    } catch (error) {
      console.error('Failed to save config:', error)
    }
  }

  getGameBoyContext(): GameBoyContext {
    return {
      target: 'dmg', // Default to original GameBoy
      availableRAM: 8, // 8KB
      currentBank: 1,
      features: ['sprites', 'background', 'sound', 'interrupts'],
      optimizeFor: 'balance',
    }
  }

  // Environment variable overrides
  static fromEnv(): AIConfig {
    const config = new AIConfig()
    const envConfig = config.get()

    // Override from environment variables
    if (process.env.GBTS_AI_PROVIDER) {
      envConfig.providers.primary = process.env.GBTS_AI_PROVIDER
    }

    // API Keys from environment (prioritized over config file for security)
    if (process.env.CLAUDE_API_KEY || process.env.OPENAI_API_KEY) {
      envConfig.providers.apiKeys = {}
      if (process.env.CLAUDE_API_KEY) {
        envConfig.providers.apiKeys.claude = process.env.CLAUDE_API_KEY
      }
      if (process.env.OPENAI_API_KEY) {
        envConfig.providers.apiKeys.openai = process.env.OPENAI_API_KEY
      }
    }

    if (process.env.GBTS_DAILY_BUDGET) {
      envConfig.budget.dailyBudget = parseFloat(process.env.GBTS_DAILY_BUDGET)
    }

    if (process.env.GBTS_MAX_COST) {
      envConfig.budget.maxCostPerTranspilation = parseFloat(process.env.GBTS_MAX_COST)
    }

    if (process.env.GBTS_DISABLE_CACHE) {
      envConfig.caching.enabled = process.env.GBTS_DISABLE_CACHE === 'false'
    }

    if (process.env.GBTS_LOCAL_LLM_ENDPOINT) {
      if (envConfig.providers.local) {
        envConfig.providers.local.endpoint = process.env.GBTS_LOCAL_LLM_ENDPOINT
      }
    }

    config.update(envConfig)
    return config
  }

  // Validate configuration
  validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (this.config.budget.maxCostPerTranspilation <= 0) {
      errors.push('maxCostPerTranspilation must be positive')
    }

    if (this.config.budget.dailyBudget <= 0) {
      errors.push('dailyBudget must be positive')
    }

    if (this.config.quality.minScore < 0 || this.config.quality.minScore > 1) {
      errors.push('minScore must be between 0 and 1')
    }

    if (this.config.caching.maxSize <= 0) {
      errors.push('caching maxSize must be positive')
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }
}