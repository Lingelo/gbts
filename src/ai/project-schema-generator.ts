import path from 'path'
import type { ProjectContext, ProjectFile, ProjectSchema, TypeDefinition, FunctionSignature } from './types'

export class ProjectSchemaGenerator {
  /**
   * Generate a comprehensive schema of the entire project
   * This provides global context for AI transpilation
   */
  generateSchema(projectContext: ProjectContext): ProjectSchema {
    const schema: ProjectSchema = {
      files: {},
      globalTypes: new Map(),
      globalFunctions: new Map(),
      globalVariables: new Map(),
      dependencies: projectContext.dependencies,
      summary: this.generateProjectSummary(projectContext),
    }

    // First pass: Collect all type definitions
    for (const file of projectContext.files) {
      const fileSchema = this.analyzeFileStructure(file)
      schema.files[file.relativePath] = fileSchema

      // Merge into global context
      fileSchema.types.forEach((type, name) => {
        schema.globalTypes.set(`${file.relativePath}:${name}`, type)
      })

      fileSchema.functions.forEach((func, name) => {
        schema.globalFunctions.set(`${file.relativePath}:${name}`, func)
      })

      fileSchema.variables.forEach((variable, name) => {
        schema.globalVariables.set(`${file.relativePath}:${name}`, variable)
      })
    }

    return schema
  }

  private analyzeFileStructure(file: ProjectFile) {
    const content = file.content
    const types = new Map<string, TypeDefinition>()
    const functions = new Map<string, FunctionSignature>()
    const variables = new Map<string, string>()

    // Extract interfaces and types
    const interfaceMatches = content.matchAll(/interface\s+(\w+)\s*{([^{}]*(?:{[^{}]*}[^{}]*)*)}/g)
    for (const match of interfaceMatches) {
      const [, name, body] = match
      if (name && body) {
        types.set(name, {
          name,
          type: 'interface',
          definition: body.trim(),
          filePath: file.relativePath,
        })
      }
    }

    // Extract type aliases
    const typeMatches = content.matchAll(/type\s+(\w+)\s*=\s*([^;\n]+)/g)
    for (const match of typeMatches) {
      const [, name, definition] = match
      if (name && definition) {
        types.set(name, {
          name,
          type: 'type',
          definition: definition.trim(),
          filePath: file.relativePath,
        })
      }
    }

    // Extract function signatures
    const functionMatches = content.matchAll(/(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\(([^)]*)\)\s*:?\s*([^{;\n]*)/g)
    for (const match of functionMatches) {
      const [, name, params, returnType] = match
      if (name) {
        functions.set(name, {
          name,
          parameters: params?.trim() || '',
          returnType: returnType?.trim() || 'void',
          filePath: file.relativePath,
          isExported: match[0].includes('export'),
        })
      }
    }

    // Extract class methods
    const methodMatches = content.matchAll(/(?:public|private|protected)?\s*(?:async\s+)?(\w+)\s*\(([^)]*)\)\s*:?\s*([^{;\n]*)/g)
    for (const match of methodMatches) {
      const [, name, params, returnType] = match
      if (name && !['constructor', 'if', 'for', 'while', 'switch'].includes(name)) {
        functions.set(name, {
          name,
          parameters: params?.trim() || '',
          returnType: returnType?.trim() || 'void',
          filePath: file.relativePath,
          isExported: false,
        })
      }
    }

    // Extract variable declarations
    const varMatches = content.matchAll(/(?:export\s+)?(?:const|let|var)\s+(\w+)\s*:?\s*([^=;\n]*)/g)
    for (const match of varMatches) {
      const [, name, type] = match
      if (name) {
        variables.set(name, type?.trim() || 'any')
      }
    }

    return {
      types,
      functions,
      variables,
      imports: file.imports,
      exports: file.exports,
    }
  }

  private generateProjectSummary(projectContext: ProjectContext): string {
    const fileCount = projectContext.files.length
    const totalLines = projectContext.files.reduce((sum, file) =>
      sum + file.content.split('\n').length, 0)

    const mainEntryPoint = projectContext.files.find(f =>
      f.relativePath.includes('main') ||
      f.relativePath.includes('index') ||
      f.content.includes('main('),
    )?.relativePath || 'unknown'

    return `GameBoy TypeScript Project:
- ${fileCount} TypeScript files (${totalLines} total lines)
- Entry point: ${mainEntryPoint}
- Key modules: ${projectContext.files.slice(0, 3).map(f => path.basename(f.relativePath, '.ts')).join(', ')}
- Target: GameBoy ROM using GBDK framework`
  }

  /**
   * Create context summary for a specific chunk including relevant global context
   */
  buildChunkContextSummary(
    chunk: any,
    file: ProjectFile,
    schema: ProjectSchema,
  ): string {
    const relevantTypes: string[] = []
    const relevantFunctions: string[] = []

    // Find dependencies for this file
    const fileDeps = schema.dependencies[file.relativePath] || []

    // Collect relevant type definitions from dependencies
    for (const depPath of fileDeps) {
      const depSchema = schema.files[depPath]
      if (depSchema) {
        depSchema.types.forEach((type, name) => {
          if (chunk.content.includes(name)) {
            relevantTypes.push(`// From ${depPath}\ninterface ${name} ${type.definition}`)
          }
        })

        depSchema.functions.forEach((func, name) => {
          if (chunk.content.includes(name)) {
            relevantFunctions.push(`// From ${depPath}\n${func.returnType} ${name}(${func.parameters})`)
          }
        })
      }
    }

    return `
Project Context:
${schema.summary}

Available Types:
${relevantTypes.join('\n\n')}

Available Functions:
${relevantFunctions.join('\n')}

Current File: ${file.relativePath}
Chunk: ${chunk.id}
`
  }
}