"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const parse = require("minimist");
const logger_1 = require("./src/logger");
const command_1 = require("./src/command");
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
    command_1.Command.checkArgs(args);
    const path = args['path'];
    command_1.Command.transpile(path)
        .then(() => command_1.Command.makeGBDKN())
        .then(() => command_1.Command.compile(path))
        .then(() => command_1.Command.link(path))
        .then(() => command_1.Command.makeRom(path))
        .then(() => {
        logger_1.Logger.success("ROM built");
    })
        .catch((error) => {
        logger_1.Logger.stopLoading();
        logger_1.Logger.error(error);
    });
}
main();
//# sourceMappingURL=main.js.map