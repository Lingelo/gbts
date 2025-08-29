import child_process from 'child_process'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { Logger } from './logger'
import { AITranspiler } from './ai/ai-transpiler'
import { ProjectTranspiler } from './ai/project-transpiler'
import { AIConfig } from './config/ai-config'
import type { GameBoyContext } from './types'

const processRoot = process.cwd()

export class Command {
  private static aiTranspiler: AITranspiler | null = null
  private static aiConfig: AIConfig | null = null

  private static async getAITranspiler(): Promise<AITranspiler> {
    if (!Command.aiTranspiler) {
      Command.aiConfig = AIConfig.fromEnv()
      Command.aiTranspiler = new AITranspiler(Command.aiConfig.get())
    }
    return Command.aiTranspiler
  }

  public static async ALL(typeScriptFilePath: string): Promise<void> {
    Logger.info('🚀 GBTS AI-POWERED GAMEBOY DEVELOPMENT')
    Logger.info('🤖 Using Claude AI for TypeScript → GameBoy C conversion')

    await Command.transpile(typeScriptFilePath)
    await Command.makeGBDKN()
    await Command.compile(typeScriptFilePath)
    await Command.link(typeScriptFilePath)
    await Command.makeRom(typeScriptFilePath)

    Logger.success('🎮 GameBoy ROM created with AI power!')
  }

  public static async TRANSPILE(typeScriptFilePath: string): Promise<void> {
    await Command.transpile(typeScriptFilePath)
  }

  public static async COMPILE(typeScriptFilePath: string): Promise<void> {
    await Command.makeGBDKN()
    await Command.compile(typeScriptFilePath)
    await Command.link(typeScriptFilePath)
    await Command.makeRom(typeScriptFilePath)
  }

  public static async BUILD(typeScriptFilePath: string): Promise<void> {
    await Command.makeRom(typeScriptFilePath)
  }


  private static async transpile(inputPath: string): Promise<void> {
    const absolutePath = this.computeAbsolutePath(inputPath)

    if (!fs.existsSync(absolutePath)) {
      throw new Error(`Path ${absolutePath} does not exist`)
    }

    const isDirectory = fs.statSync(absolutePath).isDirectory()

    // Create GameBoy context
    const context: GameBoyContext = {
      target: 'dmg',
      availableRAM: 8,
      currentBank: 1,
      features: ['sprites', 'background', 'sound', 'interrupts'],
      optimizeFor: 'balance',
    }

    if (isDirectory) {
      await this.transpileProject(absolutePath, context)
    } else {
      await this.transpileSingleFile(absolutePath, context)
    }
  }

  private static async transpileProject(projectPath: string, context: GameBoyContext): Promise<void> {
    try {
      // Get AI config and create project transpiler
      const aiConfig = await this.getAIConfig()
      const projectTranspiler = new ProjectTranspiler(aiConfig.get())

      // Transpile entire project
      const result = await projectTranspiler.transpileProject(projectPath, context, {
        useCache: true,
        maxRetries: 3,
      })

      // Write output files
      const outputDir = projectPath // Write .c files next to .ts files
      await projectTranspiler.writeProjectFiles(result, outputDir)

      Logger.success('🎉 Project transpilation completed!')
      Logger.info(`📊 Files: ${result.files.length} | Total Cost: $${result.totalCost.toFixed(4)} | Avg Quality: ${(result.averageQuality * 100).toFixed(1)}%`)
      Logger.info(`📦 ROM: ~${result.metadata.estimatedROMSize} bytes | RAM: ~${result.metadata.estimatedRAMUsage} bytes`)

      if (result.metadata.warnings.length > 0) {
        Logger.warn(`⚠️  Warnings: ${result.metadata.warnings.join(', ')}`)
      }

      if (result.metadata.optimizations.length > 0) {
        Logger.info(`🔧 Optimizations: ${result.metadata.optimizations.join(', ')}`)
      }

    } catch (error) {
      if (error instanceof Error && error.message.includes('budget')) {
        Logger.error(`💰 ${error.message}`)
        Logger.info('💡 Tip: Increase daily budget in gbts.config.json or use GBTS_DAILY_BUDGET env var')
      } else if (error instanceof Error && error.message.includes('API key')) {
        Logger.error('🔑 Claude API key required!')
        Logger.info('💡 Set CLAUDE_API_KEY environment variable or add to .env file')
        Logger.info('🌐 Get your API key at: https://console.anthropic.com/')
      } else {
        Logger.error(`AI project transpilation failed: ${error instanceof Error ? error.message : String(error)}`)
        Logger.info('💡 Try again - AI can be temperamental sometimes! 🤖')
      }
      throw error
    }
  }

  private static async transpileSingleFile(filePath: string, context: GameBoyContext): Promise<void> {
    Logger.startLoading('🤖 Starting AI-powered transpilation TypeScript → GameBoy C')

    try {
      const fileName = path.parse(filePath).name
      const jsCode = fs.readFileSync(filePath, 'utf-8')
      const dirname = path.dirname(filePath)

      // Check if file is too large - use project transpiler for chunking
      const aiConfig = await this.getAIConfig()
      if (jsCode.length > aiConfig.get().project.maxFileSize) {
        Logger.info(`📦 Large file detected (${jsCode.length} chars) - using intelligent chunking`)
        Logger.stopLoading()
        
        const projectTranspiler = new ProjectTranspiler(aiConfig.get())
        const result = await projectTranspiler.transpileProject(filePath, context, {
          useCache: true,
          maxRetries: 3,
        })

        // Write output files  
        await projectTranspiler.writeProjectFiles(result, dirname)
        return
      }

      // Get AI transpiler instance for small files
      const aiTranspiler = await this.getAITranspiler()

      Logger.info(`💡 Sending ${jsCode.length} characters to Claude AI...`)

      // AI-powered transpilation! 🚀
      const result = await aiTranspiler.transpile(jsCode, context, {
        useCache: true,
        maxRetries: 3,
      })

      // Write the AI-generated C code
      const outputPath = path.join(dirname, `${fileName}.c`)
      fs.writeFileSync(outputPath, result.cCode)

      Logger.stopLoading()
      Logger.success('🎉 AI transpilation completed!')
      Logger.info(`📊 Quality: ${(result.quality * 100).toFixed(1)}% | Cost: $${result.cost.toFixed(4)} | ROM: ~${result.metadata.estimatedROMSize} bytes`)

      if (result.fromCache) {
        Logger.info(`⚡ Used cached result (saved $${result.cost.toFixed(4)})`)
      }

      if (result.metadata.warnings.length > 0) {
        Logger.warn(`⚠️  Warnings: ${result.metadata.warnings.join(', ')}`)
      }

      if (result.metadata.optimizations.length > 0) {
        Logger.info(`🔧 Optimizations: ${result.metadata.optimizations.join(', ')}`)
      }

    } catch (error) {
      Logger.stopLoading()
      if (error instanceof Error && error.message.includes('budget')) {
        Logger.error(`💰 ${error.message}`)
        Logger.info('💡 Tip: Increase daily budget in gbts.config.json or use GBTS_DAILY_BUDGET env var')
      } else if (error instanceof Error && error.message.includes('API key')) {
        Logger.error('🔑 Claude API key required!')
        Logger.info('💡 Set CLAUDE_API_KEY environment variable or add to .env file')
        Logger.info('🌐 Get your API key at: https://console.anthropic.com/')
      } else {
        Logger.error(`AI transpilation failed: ${error instanceof Error ? error.message : String(error)}`)
        Logger.info('💡 Try again - AI can be temperamental sometimes! 🤖')
      }
      throw error
    }
  }

  private static async getAIConfig(): Promise<AIConfig> {
    if (!Command.aiConfig) {
      Command.aiConfig = AIConfig.fromEnv()
    }
    return Command.aiConfig
  }

  private static async makeGBDKN(): Promise<void> {
    Logger.startLoading('Compiling GBDK (GameBoy SDK)')

    const gbdkPath = `${processRoot}/bin/gbdk-n-master`
    if (!fs.existsSync(gbdkPath)) {
      Logger.stopLoading()
      throw new Error('GBDK not installed, please run "npm install" first')
    }

    const originalCwd = process.cwd()
    try {
      process.chdir(gbdkPath)
      child_process.execSync('make', { stdio: 'ignore' })
      Logger.success('GBDK (GameBoy SDK) compilation done')
    } catch (error) {
      throw new Error(`Error while compiling GBDK (GameBoy SDK): ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      process.chdir(originalCwd)
    }
  }

  private static async compile(filePath: string): Promise<void> {
    Logger.startLoading('Compiling sources')
    const absolutePath = this.computeAbsolutePath(filePath)
    const baseFilePath = absolutePath.replace('.ts', '')

    const directory = path.dirname(baseFilePath)
    const originalCwd = process.cwd()

    try {
      process.chdir(directory)
      const command = `${processRoot}/bin/gbdk-n-master/bin/${this.useCommandForCorrectOS('gbdk-n-compile')} ${baseFilePath}.c`
      child_process.execSync(command)
      Logger.success('Compiling source done')
    } catch (error) {
      throw new Error(`Error while compiling: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      process.chdir(originalCwd)
    }
  }

  private static async link(filePath: string): Promise<void> {
    Logger.startLoading('Editing links')

    const absolutePath = this.computeAbsolutePath(filePath)
    const baseFilePath = absolutePath.replace('.ts', '')

    const directory = path.dirname(baseFilePath)
    const originalCwd = process.cwd()

    try {
      process.chdir(directory)
      const command = `${processRoot}/bin/gbdk-n-master/bin/${this.useCommandForCorrectOS('gbdk-n-link')} ${baseFilePath}.rel -o ${baseFilePath}.ihx`
      child_process.execSync(command)
      Logger.success('Editing links done')
    } catch (error) {
      throw new Error(`Error while editing links: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      process.chdir(originalCwd)
    }
  }

  private static async makeRom(filePath: string): Promise<void> {
    Logger.startLoading('Building rom')

    const absolutePath = this.computeAbsolutePath(filePath)
    const baseFilePath = absolutePath.replace('.ts', '')

    const directory = path.dirname(baseFilePath)
    const originalCwd = process.cwd()

    try {
      process.chdir(directory)
      const command = `${processRoot}/bin/gbdk-n-master/bin/${this.useCommandForCorrectOS('gbdk-n-make-rom')} ${baseFilePath}.ihx ${baseFilePath}.gb`
      child_process.execSync(command)
      Logger.success('Building rom done')
    } catch (error) {
      throw new Error(`Error while making rom: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      process.chdir(originalCwd)
    }
  }

  private static computeAbsolutePath(filePath: string): string {
    if (!path.isAbsolute(filePath)) {
      return path.resolve(process.cwd(), filePath)
    }
    return filePath
  }

  private static useCommandForCorrectOS(command: string): string {
    return os.platform() === 'win32' ? `${command}.bat` : `${command}.sh`
  }
}
