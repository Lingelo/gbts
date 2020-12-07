import child_process from 'child_process';
import fs from 'fs';
import path from 'path';
import {Logger} from "./logger";

const processRoot = process.cwd();

export class Command {

    static checkArgs(args: any): void {
        if (!args['path']) {
            Logger.error("Path is mandatory !");
            process.exit(0);
        }
    }

    static transpile(filePath: string): Promise<string | object> {
        return new Promise((resolve, reject) => {
            Logger.startLoading('Starting transpilation');

            filePath = this.computeAbsolutePath(filePath);

            if (!fs.existsSync(filePath)) {
                Logger.stopLoading();
                return reject(`File ${filePath} does not exist.`);
            }

            const spawn = child_process.exec(`npx ts2c ${filePath}`, function (error, stdout, stderr) {
                if (error) {
                    return reject(`Error while processing transpilation. Error code${error.code}. Signal received${error.signal}\nStack${error.stack}`);
                }
            });

            spawn.on('exit', function (code) {
                if (code === 0) {
                    Logger.success(`Transpilation of ${filePath} ended`);
                }
                return resolve();
            });
        })
    }

    static makeGBDKN(): Promise<string | object> {

        return new Promise((resolve, reject) => {
            Logger.startLoading('Preparing gbdk-n');

            process.chdir(`${processRoot}/bin/gbdk-n-master`);

            const spawn = child_process.exec(`make`, function (error, stdout, stderr) {
                if (error) {
                    return reject(`Error while preparing gbdk-n. Error code${error.code}. Signal received${error.signal}\nStack${error.stack}`);
                }
            });

            spawn.on('exit', function (code) {
                if (code === 0) {
                    Logger.success(`Gbdk-n prepared`);
                }
                return resolve();
            });
        });

    }

    static compile(filePath: string): Promise<string | object> {
        return new Promise((resolve, reject) => {
            Logger.startLoading('Compiling');
            filePath = this.computeAbsolutePath(filePath);
            filePath = filePath.replace(".ts", "")

            const spawn = child_process.exec(`${processRoot}/bin/gbdk-n-master/bin/gbdk-n-compile.bat ${filePath}.c`, function (error, stdout, stderr) {
                if (error) {
                    return reject(`Error while compiling. Error code${error.code}. Signal received${error.signal}\nStack${error.stack}`);
                }
            });

            spawn.on('exit', function (code) {
                if (code === 0) {
                    Logger.success(`Compile success`);
                }
                return resolve();
            });
        });
    }


    static link(filePath: string): Promise<string | object> {

        return new Promise((resolve, reject) => {
            Logger.startLoading('Editing links');

            filePath = this.computeAbsolutePath(filePath);
            filePath = filePath.replace(".ts", "")

            const spawn = child_process.exec(`${processRoot}/bin/gbdk-n-master/bin/gbdk-n-link.bat ${filePath}.rel -o ${filePath}.ihx`, function (error, stdout, stderr) {
                if (error) {
                    return reject(`Error while editing links. Error code${error.code}. Signal received${error.signal}\nStack${error.stack}`);
                }
            });

            spawn.on('exit', function (code) {
                if (code === 0) {
                    Logger.success(`Editing links success`);
                }
                return resolve();
            });
        });
    }

    static makeRom(filePath: string) {

        return new Promise((resolve, reject) => {
            Logger.startLoading('Making rom file');

            filePath = this.computeAbsolutePath(filePath);
            filePath = filePath.replace(".ts", "")

            const spawn = child_process.exec(`${processRoot}/bin/gbdk-n-master/bin/gbdk-n-make-rom.bat ${filePath}.ihx ${filePath}.gb`, function (error, stdout, stderr) {
                if (error) {
                    return reject(`Error while making rom. Error code${error.code}. Signal received${error.signal}\nStack${error.stack}`);
                }
            });

            spawn.on('exit', function (code) {
                if (code === 0) {
                    Logger.success(`Making rom success`);
                }
                return resolve();
            });
        });

    }

    private static computeAbsolutePath(filePath: string): string {
        if(!path.isAbsolute(filePath)) {
            path.join(__dirname, path.basename(filePath));
        }
        return filePath;
    }
}
