import fs from 'fs'
import path from 'path'
import type {
  ProjectContext,
  ProjectFile,
  CodeChunk,
  FileImport,
  DependencyMap,
  ExportMap,
  ImportMap,
} from './types'

export class ProjectAnalyzer {
  private maxFileSize: number
  private chunkSize: number

  constructor(maxFileSize = 8000, chunkSize = 4000) {
    this.maxFileSize = maxFileSize
    this.chunkSize = chunkSize
  }

  async analyzeProject(inputPath: string): Promise<ProjectContext> {
    const isDirectory = fs.statSync(inputPath).isDirectory()
    const files = isDirectory
      ? await this.scanDirectory(inputPath)
      : [await this.analyzeFile(inputPath, inputPath)]

    const dependencies = this.buildDependencyMap(files)
    const exports = this.buildExportMap(files)
    const imports = this.buildImportMap(files)

    return {
      files,
      dependencies,
      exports,
      imports,
    }
  }

  private async scanDirectory(dirPath: string): Promise<ProjectFile[]> {
    const files: ProjectFile[] = []

    const scan = async(currentPath: string, basePath: string) => {
      const entries = fs.readdirSync(currentPath)

      for (const entry of entries) {
        const fullPath = path.join(currentPath, entry)
        const stat = fs.statSync(fullPath)

        if (stat.isDirectory()) {
          // Skip node_modules, dist, etc.
          if (['node_modules', 'dist', '.git', '__tests__'].includes(entry)) {
            continue
          }
          await scan(fullPath, basePath)
        } else if (entry.endsWith('.ts') && !entry.endsWith('.d.ts')) {
          const file = await this.analyzeFile(fullPath, basePath)
          files.push(file)
        }
      }
    }

    await scan(dirPath, dirPath)
    return files
  }

  private async analyzeFile(filePath: string, basePath: string): Promise<ProjectFile> {
    const content = fs.readFileSync(filePath, 'utf-8')
    const relativePath = path.relative(basePath, filePath)

    const imports = this.extractImports(content)
    const exports = this.extractExports(content)
    const size = content.length

    const file: ProjectFile = {
      path: filePath,
      relativePath,
      content,
      imports,
      exports,
      size,
    }

    // Chunk large files
    if (size > this.maxFileSize) {
      file.chunks = this.chunkFile(content, relativePath)
    }

    return file
  }

  private chunkFile(content: string, filePath: string): CodeChunk[] {
    const chunks: CodeChunk[] = []
    const lines = content.split('\n')

    // Strategy 1: Chunk by functions and classes
    const functionChunks = this.chunkByFunctions(lines, filePath)
    if (functionChunks.length > 1) {
      return functionChunks
    }

    // Strategy 2: Chunk by logical blocks (if no clear functions)
    return this.chunkByBlocks(lines, filePath)
  }

  private chunkByFunctions(lines: string[], filePath: string): CodeChunk[] {
    const chunks: CodeChunk[] = []
    let currentChunk: string[] = []
    let currentStart = 0
    let braceCount = 0
    let inFunction = false
    let functionName = ''

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      if (!line) continue

      currentChunk.push(line)

      // Detect function/class starts
      const funcMatch = line.match(/(?:function|class|interface|type|const\s+\w+\s*=\s*(?:async\s+)?\(|export\s+(?:function|class|interface|type))/)
      if (funcMatch && !inFunction) {
        inFunction = true
        functionName = this.extractFunctionName(line)
        currentStart = Math.max(0, i - currentChunk.length + 1)
      }

      // Count braces for scope tracking
      braceCount += (line.match(/{/g) || []).length
      braceCount -= (line.match(/}/g) || []).length

      // End of function/class
      if (inFunction && braceCount <= 0 && line.includes('}')) {
        const chunkContent = currentChunk.join('\n')

        if (chunkContent.length > 100) { // Minimum chunk size
          chunks.push({
            id: `${filePath}:${chunks.length}`,
            content: chunkContent,
            type: this.detectChunkType(chunkContent),
            startLine: currentStart + 1,
            endLine: i + 1,
            dependencies: this.extractDependencies(chunkContent),
          })
        }

        currentChunk = []
        inFunction = false
        functionName = ''
        braceCount = 0
      }

      // Force split if chunk gets too large
      if (currentChunk.join('\n').length > this.chunkSize) {
        const chunkContent = currentChunk.join('\n')
        chunks.push({
          id: `${filePath}:${chunks.length}`,
          content: chunkContent,
          type: 'other',
          startLine: currentStart + 1,
          endLine: i + 1,
          dependencies: this.extractDependencies(chunkContent),
        })

        currentChunk = []
        currentStart = i + 1
        inFunction = false
        braceCount = 0
      }
    }

    // Add remaining content
    if (currentChunk.length > 0) {
      const chunkContent = currentChunk.join('\n')
      chunks.push({
        id: `${filePath}:${chunks.length}`,
        content: chunkContent,
        type: 'other',
        startLine: currentStart + 1,
        endLine: lines.length,
        dependencies: this.extractDependencies(chunkContent),
      })
    }

    return chunks
  }

  private chunkByBlocks(lines: string[], filePath: string): CodeChunk[] {
    const chunks: CodeChunk[] = []
    let currentChunk: string[] = []
    let currentStart = 0

    for (let i = 0; i < lines.length; i++) {
      const currentLine = lines[i]
      if (currentLine) {
        currentChunk.push(currentLine)
      }

      // Split on natural boundaries or size limit
      const nextLine = lines[i + 1]
      if (currentChunk.join('\n').length >= this.chunkSize ||
          (i < lines.length - 1 && nextLine && this.isNaturalBoundary(currentLine || '', nextLine))) {
        const chunkContent = currentChunk.join('\n')
        chunks.push({
          id: `${filePath}:${chunks.length}`,
          content: chunkContent,
          type: 'other',
          startLine: currentStart + 1,
          endLine: i + 1,
          dependencies: this.extractDependencies(chunkContent),
        })

        currentChunk = []
        currentStart = i + 1
      }
    }

    // Add remaining content
    if (currentChunk.length > 0) {
      const chunkContent = currentChunk.join('\n')
      chunks.push({
        id: `${filePath}:${chunks.length}`,
        content: chunkContent,
        type: 'other',
        startLine: currentStart + 1,
        endLine: lines.length,
        dependencies: this.extractDependencies(chunkContent),
      })
    }

    return chunks
  }

  private isNaturalBoundary(currentLine: string, nextLine: string): boolean {
    // Split after complete statements
    if (currentLine.trim().endsWith('}') &&
        !nextLine.trim().startsWith('.') &&
        !nextLine.trim().startsWith('else')) {
      return true
    }

    // Split before new functions/classes
    if (nextLine.match(/^(export\s+)?(function|class|interface|type)/)) {
      return true
    }

    // Split after blank lines
    if (currentLine.trim() === '' && nextLine.trim() !== '') {
      return true
    }

    return false
  }

  private extractFunctionName(line: string): string {
    const match = line.match(/(?:function|class)\s+(\w+)/) ||
                  line.match(/const\s+(\w+)\s*=/) ||
                  line.match(/(\w+)\s*\(/)
    return match?.[1] || 'anonymous'
  }

  private detectChunkType(content: string): CodeChunk['type'] {
    if (content.includes('function ') || content.includes('=> ')) return 'function'
    if (content.includes('class ')) return 'class'
    if (content.includes('interface ') || content.includes('type ')) return 'interface'
    if (content.includes('export ') && !content.includes('{')) return 'global'
    return 'other'
  }

  private extractDependencies(content: string): string[] {
    const deps: string[] = []

    // Extract function calls
    const calls = content.match(/\b([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/g) || []
    calls.forEach(call => {
      const func = call.replace('(', '')
      if (func && !['console', 'Math', 'parseInt', 'parseFloat'].includes(func)) {
        deps.push(func)
      }
    })

    // Extract variable references
    const vars = content.match(/\b([a-zA-Z_$][a-zA-Z0-9_$]*)\b/g) || []
    vars.forEach(v => {
      if (v && v.length > 1 && !['const', 'let', 'var', 'function', 'class'].includes(v)) {
        deps.push(v)
      }
    })

    return [...new Set(deps)]
  }

  private extractImports(content: string): FileImport[] {
    const imports: FileImport[] = []
    const importRegex = /import\s+(?:{([^}]+)}|\*\s+as\s+(\w+)|(\w+))\s+from\s+['"]([^'"]+)['"]/g

    let match
    while ((match = importRegex.exec(content)) !== null) {
      const [, namedImports, namespaceImport, defaultImport, module] = match
      const isRelative = module?.startsWith('./') || false

      let importList: string[] = []
      if (namedImports) {
        importList = namedImports.split(',').map(i => i.trim())
      } else if (namespaceImport) {
        importList = [namespaceImport]
      } else if (defaultImport) {
        importList = [defaultImport]
      }

      if (module) {
        imports.push({
          module,
          imports: importList,
          isRelative,
        })
      }
    }

    return imports
  }

  private extractExports(content: string): string[] {
    const exports: string[] = []

    // Named exports
    const namedExports = content.match(/export\s+(?:function|class|interface|type|const|let|var)\s+(\w+)/g) || []
    namedExports.forEach(exp => {
      const match = exp.match(/(\w+)$/)
      if (match?.[1]) exports.push(match[1])
    })

    // Export statements
    const exportStatements = content.match(/export\s+{([^}]+)}/g) || []
    exportStatements.forEach(stmt => {
      const match = stmt.match(/{([^}]+)}/)
      if (match?.[1]) {
        const items = match[1].split(',').map(i => i.trim())
        exports.push(...items)
      }
    })

    return exports
  }

  private buildDependencyMap(files: ProjectFile[]): DependencyMap {
    const deps: DependencyMap = {}

    files.forEach(file => {
      deps[file.relativePath] = []

      file.imports.forEach(imp => {
        if (imp.isRelative && imp.module) {
          // Resolve relative path
          const resolvedPath = path.resolve(path.dirname(file.path), `${imp.module}.ts`)
          const relativeDep = files.find(f => f.path === resolvedPath)?.relativePath
          if (relativeDep) {
            deps[file.relativePath]?.push(relativeDep)
          }
        }
      })
    })

    return deps
  }

  private buildExportMap(files: ProjectFile[]): ExportMap {
    const exports: ExportMap = {}
    files.forEach(file => {
      exports[file.relativePath] = file.exports
    })
    return exports
  }

  private buildImportMap(files: ProjectFile[]): ImportMap {
    const imports: ImportMap = {}
    files.forEach(file => {
      imports[file.relativePath] = file.imports
    })
    return imports
  }
}