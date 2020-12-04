import parse = require('minimist');
import {Logger} from "./src/logger";
import {Command} from "./src/command";

const yargs = require('yargs')
    .usage('Gbts transpiles and produce .gb rom file for GameBoy.')
    .example('$0 --path', 'Path to .ts file.')
    .option('path', {
        type: 'string',
        description: 'Path to .ts file to be transpiled to .c' // (3)
    })
    .locale('en')
    .argv;

function main() {
    const args = parse(process.argv.slice(2));

    Command.checkArgs(args);
    const path = args['path'];

    Command.transpile(path)
        .then(() => Command.makeGBDKN())
        .then(() => Command.compile(path))
        .then(() => Command.link(path))
        .then(() => Command.makeRom(path))
        .then(() => {
            Logger.success("ROM built");
        })
        .catch((error) => {
            Logger.stopLoading();
            Logger.error(error);
        });
}

main();
