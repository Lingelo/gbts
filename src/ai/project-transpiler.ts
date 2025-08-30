import { ProjectAnalyzer } from './project-analyzer'
import { ProjectSchemaGenerator } from './project-schema-generator'
import { AITranspiler } from './ai-transpiler'
import { Logger } from '../logger'
import path from 'path'
import fs from 'fs'
import type {
  AITranspilerConfig,
  GameBoyContext,
  ProjectContext,
  ProjectFile,
  ProjectSchema,
  CodeChunk,
  ChunkedTranspilationResult,
  ChunkResult,
  ProjectTranspilationResult,
  ProjectMetadata,
} from './types'

export class ProjectTranspiler {
  private analyzer: ProjectAnalyzer
  private schemaGenerator: ProjectSchemaGenerator
  private transpiler: AITranspiler
  private config: AITranspilerConfig

  constructor(config: AITranspilerConfig) {
    this.config = config
    this.analyzer = new ProjectAnalyzer(
      config.project.maxFileSize,
      config.project.chunkSize,
    )
    this.schemaGenerator = new ProjectSchemaGenerator()
    this.transpiler = new AITranspiler(config)
  }

  async transpileProject(
    inputPath: string,
    context: GameBoyContext,
    options: { useCache?: boolean; maxRetries?: number } = {},
  ): Promise<ProjectTranspilationResult> {
    Logger.startLoading('🔍 Analyzing project structure...')

    // PASS 1: Analyze the project and build global schema
    const projectContext = await this.analyzer.analyzeProject(inputPath)

    Logger.stopLoading()
    Logger.success(`📁 Found ${projectContext.files.length} TypeScript files`)

    Logger.startLoading('🧠 Building global project schema...')

    // Generate comprehensive project schema for context
    const projectSchema = this.schemaGenerator.generateSchema(projectContext)

    Logger.stopLoading()
    Logger.success(`🗺️ Global schema created with ${projectSchema.globalTypes.size} types, ${projectSchema.globalFunctions.size} functions`)

    // Log chunking info
    const totalChunks = projectContext.files.reduce((sum, file) =>
      sum + (file.chunks?.length || 1), 0)

    if (totalChunks > projectContext.files.length) {
      Logger.info(`🧩 Files chunked: ${totalChunks} total chunks (max ${this.config.project.chunkSize} chars per chunk)`)
    }

    // PASS 2: Transpile with global context
    Logger.startLoading('🤖 Starting AI-powered project transpilation with global context...')

    const startTime = Date.now()
    const fileResults: ChunkedTranspilationResult[] = []
    let totalCost = 0
    let totalQuality = 0

    // Process files in dependency order
    const orderedFiles = this.orderFilesByDependencies(projectContext)

    for (let i = 0; i < orderedFiles.length; i++) {
      const file = orderedFiles[i]
      if (!file) continue

      Logger.info(`📝 Processing ${file.relativePath} (${i + 1}/${orderedFiles.length})`)

      const fileResult = await this.transpileFile(file, projectContext, projectSchema, context, options)
      fileResults.push(fileResult)

      totalCost += fileResult.totalCost
      totalQuality += fileResult.averageQuality

      Logger.success(`✅ ${file.relativePath} → ${path.basename(file.relativePath, '.ts')}.c`)
    }

    const duration = Date.now() - startTime
    const averageQuality = totalQuality / fileResults.length

    // Combine all C code
    const projectCCode = this.combineProjectCCode(fileResults, projectContext)

    // Generate metadata
    const metadata = this.generateProjectMetadata(fileResults, projectContext)

    Logger.stopLoading()
    Logger.success('🎉 Project transpilation completed!')
    Logger.info(`📊 Files: ${fileResults.length} | Chunks: ${metadata.totalChunks} | Cost: $${totalCost.toFixed(4)} | Quality: ${(averageQuality * 100).toFixed(1)}%`)

    return {
      files: fileResults,
      projectCCode,
      totalCost,
      totalDuration: duration,
      averageQuality,
      metadata,
    }
  }

  private async transpileFile(
    file: ProjectFile,
    projectContext: ProjectContext,
    projectSchema: ProjectSchema,
    gameBoyContext: GameBoyContext,
    options: { useCache?: boolean; maxRetries?: number },
  ): Promise<ChunkedTranspilationResult> {
    const chunks = file.chunks || [{
      id: `${file.relativePath}:0`,
      content: file.content,
      type: 'other' as const,
      startLine: 1,
      endLine: file.content.split('\n').length,
      dependencies: [],
    }]

    const chunkResults: ChunkResult[] = []
    let totalCost = 0
    let totalDuration = 0

    for (const chunk of chunks) {
      const chunkContext = this.buildChunkContext(chunk, file, projectContext, projectSchema, gameBoyContext)

      try {
        const result = await this.transpiler.transpile(
          chunk.content,
          chunkContext,
          options,
        )

        const chunkResult: ChunkResult = {
          chunkId: chunk.id,
          cCode: result.cCode,
          cost: result.cost,
          duration: result.duration,
          quality: result.quality,
        }

        chunkResults.push(chunkResult)
        totalCost += result.cost
        totalDuration += result.duration

        if (chunks.length > 1) {
          Logger.info(`  📦 Chunk ${chunk.id} completed (${result.cCode.length} chars)`)
        }
      } catch (error) {
        Logger.error(`❌ Failed to transpile chunk ${chunk.id}: ${error instanceof Error ? error.message : String(error)}`)
        throw error
      }
    }

    // Combine chunks into single C file
    const combinedCCode = this.combineChunks(chunkResults, file)
    const averageQuality = chunkResults.reduce((sum, chunk) => sum + chunk.quality, 0) / chunkResults.length

    return {
      filePath: file.relativePath,
      chunks: chunkResults,
      combinedCCode,
      totalCost,
      totalDuration,
      averageQuality,
    }
  }

  private buildChunkContext(
    chunk: CodeChunk,
    file: ProjectFile,
    projectContext: ProjectContext,
    projectSchema: ProjectSchema,
    gameBoyContext: GameBoyContext,
  ): GameBoyContext {
    // Build enriched context with global project knowledge
    const contextSummary = this.schemaGenerator.buildChunkContextSummary(chunk, file, projectSchema)

    return {
      ...gameBoyContext,
      // Enhanced context with global project schema
      projectContext: contextSummary,
      memoryLayout: {
        ...gameBoyContext.memoryLayout,
        // Optimize based on chunk type and project structure
        zeroPage: chunk.type === 'function' ? [`${chunk.type}_vars`] : [],
        workRam: file.exports,
        romBank: gameBoyContext.currentBank,
      },
    }
  }

  private combineChunks(chunks: ChunkResult[], file: ProjectFile): string {
    const header = `// Generated from ${file.relativePath}\n#include <gb/gb.h>\n#include <stdio.h>\n\n`

    const combinedCode = chunks
      .map(chunk => chunk.cCode)
      .map(code => {
        // Clean up individual chunk headers
        return code
          .replace(/#include\s+<gb\/gb\.h>\s*\n?/g, '')
          .replace(/#include\s+<stdio\.h>\s*\n?/g, '')
          .trim()
      })
      .join('\n\n')

    return header + combinedCode
  }

  private orderFilesByDependencies(projectContext: ProjectContext): ProjectFile[] {
    const ordered: ProjectFile[] = []
    const visited = new Set<string>()
    const visiting = new Set<string>()

    const visit = (filePath: string) => {
      if (visited.has(filePath)) return
      if (visiting.has(filePath)) {
        // Circular dependency - just add it
        Logger.warn(`⚠️  Circular dependency detected involving ${filePath}`)
        return
      }

      visiting.add(filePath)
      const deps = projectContext.dependencies[filePath] || []

      deps.forEach(depPath => {
        visit(depPath)
      })

      visiting.delete(filePath)
      visited.add(filePath)

      const file = projectContext.files.find(f => f.relativePath === filePath)
      if (file) {
        ordered.push(file)
      }
    }

    // Process all files
    projectContext.files.forEach(file => {
      visit(file.relativePath)
    })

    return ordered
  }

  private combineProjectCCode(
    fileResults: ChunkedTranspilationResult[],
    projectContext: ProjectContext,
  ): string {
    const header = '// GameBoy Project - Generated by GBTS AI\n#include <gb/gb.h>\n#include <stdio.h>\n\n'

    // Forward declarations
    const declarations = this.generateForwardDeclarations(fileResults, projectContext)

    // Combined code from all files
    const allCode = fileResults
      .map(result => `// === ${result.filePath} ===\n${result.combinedCCode}`)
      .join('\n\n')
      .replace(/#include\s+<gb\/gb\.h>\s*\n?/g, '')
      .replace(/#include\s+<stdio\.h>\s*\n?/g, '')

    return `${header + declarations}\n${allCode}`
  }

  private generateForwardDeclarations(
    fileResults: ChunkedTranspilationResult[],
    projectContext: ProjectContext,
  ): string {
    const declarations: string[] = []

    // Extract function declarations from exported functions
    projectContext.files.forEach(file => {
      file.exports.forEach(exportName => {
        // Simple heuristic for function declarations
        if (exportName && exportName !== 'default') {
          declarations.push(`// Forward declaration for ${exportName}`)
        }
      })
    })

    return declarations.length > 0 ? `${declarations.join('\n')}\n` : ''
  }

  private generateProjectMetadata(
    fileResults: ChunkedTranspilationResult[],
    projectContext: ProjectContext,
  ): ProjectMetadata {
    const totalFiles = fileResults.length
    const totalChunks = fileResults.reduce((sum, file) => sum + file.chunks.length, 0)
    const totalOriginalSize = projectContext.files.reduce((sum, file) => sum + file.size, 0)
    const totalTranspiledSize = fileResults.reduce((sum, file) => sum + file.combinedCCode.length, 0)

    // Estimate ROM and RAM usage
    const estimatedROMSize = Math.ceil(totalTranspiledSize * 1.2) // C code + compiled overhead
    const estimatedRAMUsage = Math.ceil(totalTranspiledSize * 0.1) // Rough estimate

    // Collect dependencies
    const dependencies = Object.values(projectContext.dependencies).flat()
    const uniqueDeps = [...new Set(dependencies)]

    // Collect optimizations from all chunks
    const optimizations = ['Multi-file project structure', 'Intelligent code chunking']
    if (totalChunks > totalFiles) {
      optimizations.push(`Code chunked into ${totalChunks} manageable pieces`)
    }

    const warnings: string[] = []
    if (estimatedROMSize > 32768) {
      warnings.push('Estimated ROM size exceeds GameBoy limit (32KB)')
    }
    if (estimatedRAMUsage > 8192) {
      warnings.push('Estimated RAM usage exceeds GameBoy limit (8KB)')
    }

    return {
      totalFiles,
      totalChunks,
      totalOriginalSize,
      totalTranspiledSize,
      estimatedROMSize,
      estimatedRAMUsage,
      dependencies: uniqueDeps,
      optimizations,
      warnings,
    }
  }

  async writeProjectFiles(
    result: ProjectTranspilationResult,
    outputDir: string,
  ): Promise<void> {
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }

    if (this.config.project.enableModularBuild) {
      // Write individual .c files
      for (const fileResult of result.files) {
        const outputPath = path.join(
          outputDir,
          `${path.basename(fileResult.filePath, '.ts')}.c`,
        )
        fs.writeFileSync(outputPath, fileResult.combinedCCode)
        Logger.info(`📄 Written ${outputPath}`)
      }
    } else {
      // Write single combined file
      const outputPath = path.join(outputDir, 'project.c')
      fs.writeFileSync(outputPath, result.projectCCode)
      Logger.info(`📄 Written ${outputPath}`)
    }

    // Write project metadata
    const metadataPath = path.join(outputDir, 'project-info.json')
    fs.writeFileSync(metadataPath, JSON.stringify(result.metadata, null, 2))
  }
}