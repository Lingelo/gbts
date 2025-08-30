export interface AIProvider {
  name: string;
  transpile(prompt: string): Promise<string>;
  cost: number;
  speed: 'fast' | 'medium' | 'slow';
  quality: 'high' | 'medium' | 'low';
  supportsStreaming?: boolean;
}

export interface GameBoyContext {
  target: 'dmg' | 'cgb' | 'sgb';
  availableRAM: number;
  currentBank: number;
  features: GameBoyFeature[];
  memoryLayout?: MemoryLayout;
  optimizeFor: 'size' | 'speed' | 'balance';
  projectContext?: string; // Global project schema for multi-file coherence
}

export type GameBoyFeature =
  | 'sprites'
  | 'background'
  | 'sound'
  | 'interrupts'
  | 'banking'
  | 'link'
  | 'timer'
  | 'serial';

export interface MemoryLayout {
  zeroPage: string[];      // Ultra-fast variables (0xFF80-0xFFFE)
  workRam: string[];       // Normal variables (0xC000-0xDFFF)
  romBank: number;         // Current ROM bank
  ramBank?: number;        // Current RAM bank (if any)
}

export interface TranspilationResult {
  cCode: string;
  provider: string;
  duration: number;
  cost: number;
  quality: number;
  fromCache: boolean;
  metadata: TranspilationMetadata;
}

export interface TranspilationMetadata {
  originalSize: number;
  transpiredSize: number;
  estimatedROMSize: number;
  estimatedRAMUsage: number;
  warnings: string[];
  optimizations: string[];
}

export interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
  score: number;
  estimatedPerformance: PerformanceMetrics;
}

export interface ValidationIssue {
  type: 'error' | 'warning' | 'info';
  message: string;
  line?: number;
  suggestion?: string;
}

export interface PerformanceMetrics {
  estimatedCycles: number;
  memoryEfficiency: number;
  sizeEfficiency: number;
  overallScore: number;
}

export interface AITranspilerConfig {
  providers: {
    primary: string;
    fallback: string[];
    apiKeys?: {
      claude?: string;
      openai?: string;
      openrouter?: string;
    };
    local?: LocalLLMConfig;
  };
  caching: {
    enabled: boolean;
    maxSize: number;
    ttl: number; // Time to live in milliseconds
  };
  budget: {
    maxCostPerTranspilation: number;
    dailyBudget: number;
    preferLocal: boolean;
  };
  quality: {
    minScore: number;
    requireValidation: boolean;
    enableLearning: boolean;
  };
  project: {
    chunkSize: number; // Max characters per chunk
    maxFileSize: number; // Max characters per file before chunking
    enableModularBuild: boolean; // 1 .ts = 1 .c
  };
}

export interface LocalLLMConfig {
  endpoint: string;
  model: string;
  temperature: number;
  maxTokens: number;
}

export interface TranspilationExample {
  id: string;
  jsCode: string;
  cCode: string;
  context: GameBoyContext;
  quality: number;
  performance: PerformanceMetrics;
  timestamp: number;
  provider: string;
}

// Project Schema Types for Two-Pass Approach
export interface ProjectSchema {
  files: Record<string, FileSchema>;
  globalTypes: Map<string, TypeDefinition>;
  globalFunctions: Map<string, FunctionSignature>;
  globalVariables: Map<string, string>;
  dependencies: DependencyMap;
  summary: string;
}

export interface FileSchema {
  types: Map<string, TypeDefinition>;
  functions: Map<string, FunctionSignature>;
  variables: Map<string, string>;
  imports: FileImport[];
  exports: string[];
}

export interface TypeDefinition {
  name: string;
  type: 'interface' | 'type' | 'class' | 'enum';
  definition: string;
  filePath: string;
}

export interface FunctionSignature {
  name: string;
  parameters: string;
  returnType: string;
  filePath: string;
  isExported: boolean;
}

export interface PromptTemplate {
  base: string;
  gameboyConstraints: string;
  examples: string;
  contextualInstructions: string;
  outputFormat: string;
}

export interface ProjectContext {
  files: ProjectFile[];
  dependencies: DependencyMap;
  exports: ExportMap;
  imports: ImportMap;
}

export interface ProjectFile {
  path: string;
  relativePath: string;
  content: string;
  chunks?: CodeChunk[];
  exports: string[];
  imports: FileImport[];
  size: number;
}

export interface CodeChunk {
  id: string;
  content: string;
  type: 'function' | 'class' | 'interface' | 'global' | 'other';
  startLine: number;
  endLine: number;
  dependencies: string[];
}

export interface FileImport {
  module: string;
  imports: string[];
  isRelative: boolean;
}

export interface DependencyMap {
  [filePath: string]: string[];
}

export interface ExportMap {
  [filePath: string]: string[];
}

export interface ImportMap {
  [filePath: string]: FileImport[];
}

export interface ChunkedTranspilationResult {
  filePath: string;
  chunks: ChunkResult[];
  combinedCCode: string;
  totalCost: number;
  totalDuration: number;
  averageQuality: number;
}

export interface ChunkResult {
  chunkId: string;
  cCode: string;
  cost: number;
  duration: number;
  quality: number;
}

export interface ProjectTranspilationResult {
  files: ChunkedTranspilationResult[];
  projectCCode: string; // Combined C code for entire project
  totalCost: number;
  totalDuration: number;
  averageQuality: number;
  metadata: ProjectMetadata;
}

export interface ProjectMetadata {
  totalFiles: number;
  totalChunks: number;
  totalOriginalSize: number;
  totalTranspiledSize: number;
  estimatedROMSize: number;
  estimatedRAMUsage: number;
  dependencies: string[];
  optimizations: string[];
  warnings: string[];
}

