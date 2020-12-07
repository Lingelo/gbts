#!/usr/bin/env node
import parse from 'minimist';
import {Command} from "./command";
import {Logger} from "./logger";

const yargs = require('yargs')
    .scriptName("gbts")
    .usage('Usage: $0 <command> [options]')
    .command('[command]', 'Command to run')
    .example('$0 --path <path>', 'Transpile / Compile / Build rom')
    .example('$0 all --path <path>', 'Transpile / Compile / Build rom')
    .example('$0 compile --path <path>', 'Compile / Build rom')
    .example('$0 build --path <path>', 'Build rom')
    .option('path', {
        type: 'string',
        description: 'Path to .ts file to be transpiled to .c' // (3)
    })
    .locale('en')
    .argv;

async function main() {
    const args = parse(process.argv.slice(2));

    Command.checkArgs(args);
    const path = args['path'];

    if (!args._.length) {
        await Command.ALL(path)
    } else {
        const command = args._[0].toLowerCase();
        switch (command) {
            case "compile" :
                await Command.COMPILE(path);
                break;
            case "build" :
                await Command.BUILD(path);
                break;
            default:
                Logger.error("Command " + command + " unknown.");

        }
    }

}

main().then();
