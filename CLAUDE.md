# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

GBTS 2.0 is an AI-powered CLI tool that converts TypeScript to GameBoy C code using Claude AI and OpenAI. The project has been completely modernized from a traditional ts2c-based transpiler to a full AI-powered solution with no fallback to legacy transpilation.

## Essential Commands

### Development Workflow
```bash
npm run build          # Build TypeScript to dist/
npm run typecheck      # Run TypeScript strict type checking
npm run lint           # Apply modern ESLint formatting (no semicolons, single quotes)
npm run lint:check     # Check ESLint without fixing
npm test              # Run Jest tests
npm run test:watch    # Watch mode for tests
```

### Using the CLI
```bash
# Single file processing
gbts --path hello.ts
gbts transpile --path game.ts

# ENTIRE PROJECT PROCESSING (NEW!)
gbts --path ./my-game/          # Process entire directory
gbts transpile --path ./src/    # Transpile all .ts files in project

# Multi-file projects with intelligent chunking
gbts all --path ./game-project/ # Full pipeline for entire project

# Large file support with auto-chunking (NEW!)
# Files >8KB automatically chunked into manageable pieces
gbts transpile --path large-game.ts
```

## Architecture Overview

### AI-Powered Transpilation System
The core architecture supports both single files and entire projects with intelligent chunking:

**Core Components:**
- **AITranspiler** (`src/ai/ai-transpiler.ts`) - Single file transpilation with caching and budget management
- **ProjectTranspiler** (`src/ai/project-transpiler.ts`) - Multi-file project transpilation with dependency resolution
- **ProjectAnalyzer** (`src/ai/project-analyzer.ts`) - Code analysis, chunking, and dependency mapping
- **Providers** (`src/ai/providers/`) - Claude, OpenAI, and OpenRouter implementations with official SDKs
- **GameBoyPromptEngine** (`src/ai/prompt-engine.ts`) - Specialized prompts with GameBoy hardware constraints

**Key Features:**
- **Multi-file Support**: Process entire directories recursively (skips node_modules, dist, .git)
- **Intelligent Chunking**: Large files (>8KB) automatically split by functions, classes, or logical blocks
- **Dependency Resolution**: Files processed in correct order based on import/export relationships
- **Modular Output**: Option to generate 1 .c file per .ts file or single combined file

### Configuration System
- **AIConfig** (`src/config/ai-config.ts`) - Manages AI provider settings, API keys, budgets, and caching
- Supports both config file (`gbts.config.json`) and environment variables
- API keys prioritized: env vars > config file for security

### Key Environment Variables
```bash
# AI Providers
OPENROUTER_API_KEY  # OpenRouter API key (recommended - unified access)
CLAUDE_API_KEY      # Claude API key (direct)
OPENAI_API_KEY      # OpenAI API key (direct)
GBTS_AI_PROVIDER    # Primary provider (openrouter/claude/openai)

# Budget Management
GBTS_DAILY_BUDGET   # Daily spending limit ($5.00)
GBTS_MAX_COST       # Max cost per transpilation ($0.10)

# Performance & Chunking
GBTS_DISABLE_CACHE  # Disable intelligent caching
GBTS_CHUNK_SIZE     # Max characters per chunk (4000)
GBTS_MAX_FILE_SIZE  # File size before chunking (8000)
```

### GameBoy Development Pipeline
1. **AI Transpilation**: TypeScript → GameBoy C via AI providers
2. **GBDK Compilation**: C code → GameBoy assembly using GBDK-N
3. **Linking**: Assembly → Intel HEX format  
4. **ROM Building**: HEX → .gb GameBoy ROM file

### Code Style Standards
- **Modern TypeScript**: Strict mode, ES2022 target
- **ESLint**: No semicolons, single quotes, trailing commas
- **Testing**: Jest with mocked AI calls to avoid API costs

## Key Constraints & Behaviors

### AI Provider System & Token Limits
- Requires at least one AI provider (Claude or OpenAI) with valid API key
- **Token Limitations**: Claude ~4K tokens output, GPT-4 ~4K tokens output
- **Solution**: Intelligent chunking automatically splits large files by functions, classes, or logical blocks
- Automatic fallback between providers if primary fails
- Built-in retry logic (3 attempts) with exponential backoff
- Cost tracking and daily budget enforcement

### Multi-File Project Handling
- **Directory Detection**: Automatically detects if path is file or directory
- **Recursive Scanning**: Processes all .ts files in project (skips node_modules, dist, .git, __tests__)
- **Dependency Ordering**: Analyzes imports/exports to process files in correct order
- **Modular Build Options**: Generate individual .c files or single combined project file

### GameBoy Hardware Constraints  
The AI system understands GameBoy limitations:
- 8KB RAM, 32KB ROM constraints
- DMG/CGB/SGB target compatibility
- Memory optimization (zero page, ROM constants)
- GBDK-specific functions and headers

### Caching & Performance
- Intelligent caching based on JS code + GameBoy context
- Persistent disk cache in `.gbts/ai-cache.json`  
- Learning system that improves transpilation quality over time
- Quality scoring and metadata collection

## Important Implementation Notes

### TypeScript Strictness
Project uses extremely strict TypeScript configuration with `exactOptionalPropertyTypes` - ensure all optional properties handle `undefined` correctly.

### ESLint Commands
The `npm run lint` command uses `find` instead of glob patterns to ensure all `.ts` files are processed, preventing missed files during linting.

### Test Architecture  
Tests mock the AI transpiler to avoid real API calls during development. The `AITranspiler` is mocked in `__tests__/command.spec.ts` to return predictable GameBoy C code.

### No Legacy Fallback
This is a 100% AI-powered solution - there is no fallback to traditional ts2c transpilation. All TypeScript → C conversion happens through AI providers.

## Recent Updates (v2.0)

### Migration from ora to nanospinner
- **Performance**: Reduced bundle size from ~200KB to ~2KB
- **Modern**: Updated to nanospinner with smoother animations
- **Compatibility**: Maintained all existing Logger functionality
- **Gaming Vibe**: Perfect fit for retro GameBoy development theme

### OpenRouter Provider Integration
- **Unified Access**: Single API for Claude 3.5 Sonnet AND GPT-4
- **Cost Optimization**: Competitive pricing with transparent billing
- **Automatic Fallback**: Seamless switching between models
- **Configuration**: Set `GBTS_AI_PROVIDER=openrouter` and `OPENROUTER_API_KEY`

### Automatic SDCC Installation
- **Zero Configuration**: SDCC compiler installed automatically via `install.js`
- **Cross-Platform**: Homebrew integration for macOS, manual instructions for others
- **Modern Architecture**: Updated GBDK scripts from `gbz80` to `sm83` (modern GameBoy architecture)
- **Error Handling**: Graceful fallback with clear installation instructions

### Enhanced Project Autonomy
- **Global Installation**: Package can be installed globally (`npm install -g gbts`)
- **Self-Contained**: All dependencies (GBDK, SDCC) bundled or auto-installed
- **Portable**: Works from any directory after global installation