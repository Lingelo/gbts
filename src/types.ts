export interface GBTSConfig {
    gbdkPath: string;
    processRoot: string;
    tempDir: string;
}

export interface CompilationResult {
    success: boolean;
    message: string;
    outputPath?: string;
    error?: Error;
}

export interface FileInfo {
    name: string;
    path: string;
    directory: string;
    extension: string;
}

export type Command = 'all' | 'transpile' | 'compile' | 'build';

export interface CommandContext {
    command: Command;
    filePath: string;
    config: GBTSConfig;
}

export class GBTSError extends Error {
  constructor(
    message: string,
        public readonly code: string,
        public readonly cause?: Error,
  ) {
    super(message)
    this.name = 'GBTSError'
  }
}

export class TranspilationError extends GBTSError {
  constructor(message: string, cause?: Error) {
    super(message, 'TRANSPILATION_ERROR', cause)
    this.name = 'TranspilationError'
  }
}

export class CompilationError extends GBTSError {
  constructor(message: string, cause?: Error) {
    super(message, 'COMPILATION_ERROR', cause)
    this.name = 'CompilationError'
  }
}

export class FileNotFoundError extends GBTSError {
  constructor(filePath: string) {
    super(`File ${filePath} does not exist`, 'FILE_NOT_FOUND')
    this.name = 'FileNotFoundError'
  }
}

// Re-export from AI types for convenience
export type { GameBoyContext } from './ai/types'