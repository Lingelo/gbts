import child_process from 'child_process';
import fs from 'fs';
import path from 'path';
import {Logger} from "./logger";

const processRoot = process.cwd();

export class Command {

    static ALL = (path: string) => {
        return Command.transpile(path)
            .then(() => Command.makeGBDKN())
            .then(() => Command.compile(path))
            .then(() => Command.link(path))
            .then(() => Command.makeRom(path))
            .catch((error) => {
                Logger.stopLoading();
                Logger.error(error);
            });
    }

    static TRANSPILE = (path: string) =>
        Command.transpile(path)
            .catch((error) => {
                Logger.stopLoading();
                Logger.error(error);
            })

    static COMPILE = (path: string) => {
        return Command.makeGBDKN()
            .then(() => Command.compile(path))
            .then(() => Command.link(path))
            .then(() => Command.makeRom(path))
            .catch((error) => {
                Logger.stopLoading();
                Logger.error(error);
            });
    }

    static BUILD = (path: string) => {
        return Command.makeRom(path)
            .catch((error) => {
                Logger.stopLoading();
                Logger.error(error);
            });
    }

    static checkArgs(args: any): void {
        if (!args['path']) {
            Logger.error("Path is mandatory !");
            process.exit(0);
        }
    }

    private static transpile(filePath: string): Promise<string | object> {
        return new Promise((resolve, reject) => {
            Logger.startLoading('Starting transpilation from .ts to .c');

            filePath = this.computeAbsolutePath(filePath);

            if (!fs.existsSync(filePath)) {
                Logger.stopLoading();
                return reject(`File ${filePath} does not exist`);
            }

            const directory = path.dirname(filePath);

            //TODO ts2c dont work with absolute paths ... produce max stack size exceeded
            process.chdir(directory);

            try {
                child_process.execSync(`npx ts2c ${path.basename(filePath)}`, {stdio: 'inherit'});
                Logger.success(`Transpilation of ${path.basename(filePath)} done`);
                process.chdir(processRoot);
                return resolve();
            } catch (error) {
                return reject(`Error while processing transpilation\nError code${error.code}\nSignal received${error.signal}\nStack${error.stack}`);
            }

        })
    }

    private static makeGBDKN(): Promise<string | object> {

        return new Promise((resolve, reject) => {
            Logger.startLoading('Compiling GBDK (GameBoy SDK)');

            if (!fs.existsSync(`${processRoot}/bin/gbdk-n-master`)) {
                Logger.stopLoading();
                return reject(`GBDK not installed, please run "npm install" first`);
            }

            process.chdir(`${processRoot}/bin/gbdk-n-master`);

            try {
                child_process.execSync(`make`, {stdio: 'ignore'});
                Logger.success(`GBDK (GameBoy SDK) compilation done`);
                return resolve()
            } catch(error) {
                return reject(`Error while compiling GBDK (GameBoy SDK)\n${error}`);
            }

        });

    }

    private static compile(filePath: string): Promise<string | object> {
        return new Promise((resolve, reject) => {
            Logger.startLoading('Compiling sources');
            filePath = this.computeAbsolutePath(filePath);
            filePath = filePath.replace(".ts", "")

            const directory = path.dirname(filePath);
            process.chdir(directory);

            try {
                let command = `${processRoot}/bin/gbdk-n-master/bin/gbdk-n-compile.bat ${filePath}.c`;
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
            Logger.startLoading('Editing links');

            filePath = this.computeAbsolutePath(filePath);
            filePath = filePath.replace(".ts", "")

            const directory = path.dirname(filePath);
            process.chdir(directory);

            try {
                child_process.execSync(`${processRoot}/bin/gbdk-n-master/bin/gbdk-n-link.bat ${filePath}.rel -o ${filePath}.ihx`);
                Logger.success(`Editing links done`);
                process.chdir(processRoot);
                return resolve();
            } catch (error) {
                return reject(`Error while editing links\nError ${error.code}`);
            }

        });
    }

    private static makeRom(filePath: string) {

        return new Promise((resolve, reject) => {
            Logger.startLoading('Building rom');

            filePath = this.computeAbsolutePath(filePath);
            filePath = filePath.replace(".ts", "")

            const directory = path.dirname(filePath);
            process.chdir(directory);

            try {
                child_process.execSync(`${processRoot}/bin/gbdk-n-master/bin/gbdk-n-make-rom.bat ${filePath}.ihx ${filePath}.gb`);
                Logger.success(`Building rom done`);
                process.chdir(processRoot);
                return resolve();
            } catch (error) {
                return reject(`Error while making rom\nError code${error.code}\nSignal received${error.signal}\nStack${error.stack}`);
            }
        });

    }

    private static computeAbsolutePath(filePath: string): string {
        if (!path.isAbsolute(filePath)) {
            path.join(__dirname, path.basename(filePath));
        }
        return filePath;
    }
}
