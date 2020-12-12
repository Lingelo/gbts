#!/usr/bin/env node
import parse from "minimist";
import {Command} from "./command";
import {Logger} from "./logger";

const yargs = require("yargs")
    .scriptName("gbts")
    .usage("Usage: $0 <command> [options]")
    .command("all (or empty)", "Run all commands : Transpile / Compile / Build rom")
    .command("transpile", "Run commands : Transpile")
    .command("compile", "Run commands : Compile / Build rom")
    .command("build", "Run command : Build rom")
    .example("$0 --path <path>", "Transpile / Compile / Build rom from a .ts file")
    .example("$0 all --path <path>", "Transpile / Compile / Build rom from a .ts file")
    .example("$0 transpile --path <path>", "Transpile from a .ts file")
    .example("$0 compile --path <path>", "Compile / Build rom from a .ts file")
    .example("$0 build --path <path>", "Build rom from a .ts file")
    .option("path", {
        description: "Path to .ts file",
        type: "string",
    })
    .locale("en")
    .argv;

function main() {
    const args = parse(process.argv.slice(2));

    Command.checkArgs(args);
    const path = args.path;

    if (!args._.length) {
        Logger.info("No command set, run Transpile / Compile / Build rom.");
        Command.ALL(path)
            .catch((error) => {
                Logger.stopLoading();
                Logger.error(error);
            });
    } else {
        const command = args._[0].toLowerCase();
        switch (command) {
            case "transpile": {
                Logger.info("Run command compile : Transpile.");
                Command.TRANSPILE(path)
                    .catch((error) => {
                        Logger.stopLoading();
                        Logger.error(error);
                    });
                break;
            }
            case "compile" :
                Logger.info("Run command compile : Compile / Build rom.");
                Command.COMPILE(path)
                    .catch((error) => {
                        Logger.stopLoading();
                        Logger.error(error);
                    });
                break;
            case "build" :
                Logger.info("Run command compile : Build rom.");
                Command.BUILD(path)
                    .catch((error) => {
                        Logger.stopLoading();
                        Logger.error(error);
                    });
                break;
            default:
                Logger.error("Command " + command + " unknown.");

        }
    }

}

main();
