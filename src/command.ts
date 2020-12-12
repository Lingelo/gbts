import child_process from "child_process";
import fs from "fs";
import os from "os";
import path from "path";

const ts2c = require("ts2c");
import {Logger} from "./logger";

const processRoot = process.cwd();

export class Command {

    public static ALL = (typeScriptFilePath: string) => {
        return Command.transpile(typeScriptFilePath)
            .then(() => Command.makeGBDKN())
            .then(() => Command.compile(typeScriptFilePath))
            .then(() => Command.link(typeScriptFilePath))
            .then(() => Command.makeRom(typeScriptFilePath));

    }

    public static TRANSPILE = (typeScriptFilePath: string) =>
        Command.transpile(typeScriptFilePath)

    public static COMPILE = (typeScriptFilePath: string) => {
        return Command.makeGBDKN()
            .then(() => Command.compile(typeScriptFilePath))
            .then(() => Command.link(typeScriptFilePath))
            .then(() => Command.makeRom(typeScriptFilePath));

    }

    public static BUILD = (typeScriptFilePath: string) => {
        return Command.makeRom(typeScriptFilePath);

    }

    public static checkArgs(args: any): void {
        if (!args.path) {
            Logger.error("Path is mandatory !");
            process.exit(0);
        }
    }

    private static transpile(filePath: string): Promise<string | object> {
        return new Promise((resolve, reject) => {
            Logger.startLoading("Starting transpilation from .ts to .c");

            filePath = this.computeAbsolutePath(filePath);

            if (!fs.existsSync(filePath)) {
                Logger.stopLoading();
                return reject(`File ${filePath} does not exist`);
            }

            try {
                const fileName = path.parse(filePath).name;
                const data = fs.readFileSync(filePath).toString();
                const dirname = path.dirname(filePath);
                const cCode = ts2c.transpile(data);
                fs.writeFileSync(dirname + "/" + fileName + ".c", cCode);
                Logger.success(`Transpilation of ${path.basename(filePath)} done`);
                return resolve();
            } catch (error) {
                return reject(`Error while processing transpilation\nError ${error}`);
            }

        });
    }

    private static makeGBDKN(): Promise<string | object> {

        return new Promise((resolve, reject) => {
            Logger.startLoading("Compiling GBDK (GameBoy SDK)");

            if (!fs.existsSync(`${processRoot}/bin/gbdk-n-master`)) {
                Logger.stopLoading();
                return reject(`GBDK not installed, please run "npm install" first`);
            }

            process.chdir(`${processRoot}/bin/gbdk-n-master`);

            try {
                child_process.execSync(`make`, {stdio: "ignore"});
                Logger.success(`GBDK (GameBoy SDK) compilation done`);
                return resolve();
            } catch (error) {
                return reject(`Error while compiling GBDK (GameBoy SDK)\n${error}`);
            }

        });

    }

    private static compile(filePath: string): Promise<string | object> {
        return new Promise((resolve, reject) => {
            Logger.startLoading("Compiling sources");
            filePath = this.computeAbsolutePath(filePath);
            filePath = filePath.replace(".ts", "");

            const directory = path.dirname(filePath);
            process.chdir(directory);

            try {
                const command = `${processRoot}/bin/gbdk-n-master/bin/${this.useCommandForCorrectOS("gbdk-n-compile")} ${filePath}.c`;
                child_process.execSync(command);
                Logger.success(`Compiling source done`);
                process.chdir(processRoot);
                return resolve();
            } catch (error) {
                return reject(`Error while compiling\nError ${error}`);
            }
        });
    }

    private static link(filePath: string): Promise<string | object> {

        return new Promise((resolve, reject) => {
            Logger.startLoading("Editing links");

            filePath = this.computeAbsolutePath(filePath);
            filePath = filePath.replace(".ts", "");

            const directory = path.dirname(filePath);
            process.chdir(directory);

            try {
                child_process.execSync(`${processRoot}/bin/gbdk-n-master/bin/${this.useCommandForCorrectOS("gbdk-n-link")} ${filePath}.rel -o ${filePath}.ihx`);
                Logger.success(`Editing links done`);
                process.chdir(processRoot);
                return resolve();
            } catch (error) {
                return reject(`Error while editing links\nError ${error}`);
            }

        });
    }

    private static makeRom(filePath: string) {

        return new Promise((resolve, reject) => {
            Logger.startLoading("Building rom");

            filePath = this.computeAbsolutePath(filePath);
            filePath = filePath.replace(".ts", "");

            const directory = path.dirname(filePath);
            process.chdir(directory);

            try {
                child_process.execSync(`${processRoot}/bin/gbdk-n-master/bin/${this.useCommandForCorrectOS("gbdk-n-make-rom")} ${filePath}.ihx ${filePath}.gb`);
                Logger.success(`Building rom done`);
                process.chdir(processRoot);
                return resolve();
            } catch (error) {
                return reject(`Error while making rom\nError ${error}`);
            }
        });

    }

    private static computeAbsolutePath(filePath: string): string {
        if (!path.isAbsolute(filePath)) {
            path.join(__dirname, path.basename(filePath));
        }
        return filePath;
    }

    private static useCommandForCorrectOS(command: string) {
        return os.platform().toString() === "win32" ? command.concat(".bat") : command.concat(".sh");
    }
}
