#!/usr/bin/env node
import parse from 'minimist';
import {Command} from "./command";
import {Logger} from "./logger";

const yargs = require('yargs')
    .scriptName("gbts")
    .usage('Usage: $0 <command> [options]')
    .command('all (or empty)', 'Run all commands : Transpile / Compile / Build rom')
    .command('compile', 'Run commands : Compile / Build rom')
    .command('build', 'Run command : Build rom')
    .example('$0 --path <path>', 'Transpile / Compile / Build rom from a .ts file')
    .example('$0 all --path <path>', 'Transpile / Compile / Build rom from a .ts file')
    .example('$0 compile --path <path>', 'Compile / Build rom from a .ts file')
    .example('$0 build --path <path>', 'Build rom from a .ts file')
    .option('path', {
        type: 'string',
        description: 'Path to .ts file'
    })
    .locale('en')
    .argv;

async function main() {
    const args = parse(process.argv.slice(2));

    Command.checkArgs(args);
    const path = args['path'];

    if (!args._.length) {
        Logger.info("No command set, run Transpile / Compile / Build rom.")
        await Command.ALL(path)
    } else {
        const command = args._[0].toLowerCase();
        switch (command) {
            case "compile" :
                Logger.info("Run command compile : Compile / Build rom.")
                await Command.COMPILE(path);
                break;
            case "build" :
                Logger.info("Run command compile : Build rom.")
                await Command.BUILD(path);
                break;
            default:
                Logger.error("Command " + command + " unknown.");

        }
    }

}

main().then();
