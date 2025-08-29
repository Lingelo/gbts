#!/usr/bin/env node
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import { Command } from './command'
import { Logger } from './logger'

const argv = yargs(hideBin(process.argv))
  .scriptName('gbts')
  .usage('🤖 AI-powered TypeScript to GameBoy C converter\n\nSupports single files and entire projects with intelligent chunking!\n\nUsage: $0 <command> [options]')
  .command('all', '🚀 Run full pipeline: AI Transpile → Compile → Build ROM', {}, () => {})
  .command('transpile', '🤖 AI-powered TypeScript to C conversion (supports projects)', {}, () => {})
  .command('compile', '⚙️  Compile and build GameBoy ROM', {}, () => {})
  .command('build', '🔧 Build GameBoy ROM only', {}, () => {})
  .example('$0 --path hello.ts', '🎮 Single file: AI transpile, compile, and build ROM')
  .example('$0 --path ./my-game/', '🎮 Entire project: Process all .ts files in directory')
  .example('$0 all --path ./src/', '🎮 Project pipeline with multi-file support')
  .example('$0 transpile --path input.ts', '🤖 AI conversion only (with auto-chunking for large files)')
  .example('$0 transpile --path ./project/', '🤖 Batch convert entire project directory')
  .option('path', {
    description: 'Path to TypeScript file or project directory',
    type: 'string',
    demandOption: true,
    alias: 'p',
  })
  .help('h')
  .alias('h', 'help')
  .version()
  .locale('en')
  .parseSync()

export async function main(): Promise<void> {
  try {
    const path = argv.path

    if (!path) {
      Logger.error('Path is mandatory!')
      process.exit(1)
    }

    // Get the command from argv._ (first positional argument)
    const command = argv._[0]?.toString().toLowerCase()

    if (!command || command === 'all') {
      Logger.info('🚀 Running full AI-powered GameBoy development pipeline')
      await Command.ALL(path)
    } else {
      switch (command) {
        case 'transpile': {
          Logger.info('🤖 Running AI-powered transpilation')
          await Command.TRANSPILE(path)
          break
        }
        case 'compile': {
          Logger.info('⚙️  Running compile and build')
          await Command.COMPILE(path)
          break
        }
        case 'build': {
          Logger.info('🔧 Building GameBoy ROM')
          await Command.BUILD(path)
          break
        }
        default:
          Logger.error(`❌ Unknown command: ${command}`)
          Logger.info('💡 Available commands: all, transpile, compile, build')
          process.exit(1)
      }
    }
  } catch (error) {
    Logger.stopLoading()
    if (error instanceof Error) {
      Logger.error(`💥 ${error.message}`)
    } else {
      Logger.error('💥 An unknown error occurred')
    }
    process.exit(1)
  }
}

void main()
