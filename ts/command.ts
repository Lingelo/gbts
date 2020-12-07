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

            const spawn = child_process.exec(`npx ts2c ${filePath}`, function (error, stdout, stderr) {
                if (error) {
                    return reject(`Error while processing transpilation\nError code${error.code}\nSignal received${error.signal}\nStack${error.stack}`);
                }
            });

            spawn.on('exit', function (code) {
                if (code === 0) {
                    Logger.success(`Transpilation of ${filePath} done`);
                }
                return resolve();
            });
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

            const spawn = child_process.exec(`make`, function (error, stdout, stderr) {
                if (error) {
                    return reject(`Error while compiling GBDK (GameBoy SDK)\nError code${error.code}\nSignal received${error.signal}\nStack${error.stack}`);
                }
            });

            spawn.on('exit', function (code) {
                if (code === 0) {
                    Logger.success(`GBDK (GameBoy SDK) compilation done`);
                }
                return resolve();
            });
        });

    }

    private static compile(filePath: string): Promise<string | object> {
        return new Promise((resolve, reject) => {
            Logger.startLoading('Compiling sources');
            filePath = this.computeAbsolutePath(filePath);
            filePath = filePath.replace(".ts", "")

            const spawn = child_process.exec(`${processRoot}/bin/gbdk-n-master/bin/gbdk-n-compile.bat ${filePath}.c`, function (error, stdout, stderr) {
                if (error) {
                    return reject(`Error while compiling\nError code${error.code}\nSignal received${error.signal}\nStack${error.stack}`);
                }
            });

            spawn.on('exit', function (code) {
                if (code === 0) {
                    Logger.success(`Compiling source done`);
                }
                return resolve();
            });
        });
    }


    private static link(filePath: string): Promise<string | object> {

        return new Promise((resolve, reject) => {
            Logger.startLoading('Editing links');

            filePath = this.computeAbsolutePath(filePath);
            filePath = filePath.replace(".ts", "")

            const spawn = child_process.exec(`${processRoot}/bin/gbdk-n-master/bin/gbdk-n-link.bat ${filePath}.rel -o ${filePath}.ihx`, function (error, stdout, stderr) {
                if (error) {
                    return reject(`Error while editing links\nError code${error.code}\nSignal received${error.signal}\nStack${error.stack}`);
                }
            });

            spawn.on('exit', function (code) {
                if (code === 0) {
                    Logger.success(`Editing links done`);
                }
                return resolve();
            });
        });
    }

    private static makeRom(filePath: string) {

        return new Promise((resolve, reject) => {
            Logger.startLoading('Building rom');

            filePath = this.computeAbsolutePath(filePath);
            filePath = filePath.replace(".ts", "")

            const spawn = child_process.exec(`${processRoot}/bin/gbdk-n-master/bin/gbdk-n-make-rom.bat ${filePath}.ihx ${filePath}.gb`, function (error, stdout, stderr) {
                if (error) {
                    return reject(`Error while making rom\nError code${error.code}\nSignal received${error.signal}\nStack${error.stack}`);
                }
            });

            spawn.on('exit', function (code) {
                if (code === 0) {
                    Logger.success(`Building rom done`);
                }
                return resolve();
            });
        });

    }

    private static computeAbsolutePath(filePath: string): string {
        if (!path.isAbsolute(filePath)) {
            path.join(__dirname, path.basename(filePath));
        }
        return filePath;
    }
}
