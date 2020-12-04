"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Command = void 0;
const logger_1 = require("./logger");
const child_process = require("child_process");
const fs = require("fs");
const processRoot = process.cwd();
class Command {
    static checkArgs(args) {
        if (!args['path']) {
            logger_1.Logger.error("Path is mandatory !");
            process.exit(0);
        }
    }
    static transpile(path) {
        return new Promise((resolve, reject) => {
            logger_1.Logger.startLoading('Starting transpilation');
            if (!fs.existsSync(path)) {
                logger_1.Logger.stopLoading();
                return reject(`File ${path} does not exist.`);
            }
            const spawn = child_process.exec(`npx ts2c ${path}`, function (error, stdout, stderr) {
                if (error) {
                    return reject(`Error while processing transpilation. Error code${error.code}. Signal received${error.signal}\nStack${error.stack}`);
                }
            });
            spawn.on('exit', function (code) {
                if (code === 0) {
                    logger_1.Logger.success(`Transpilation of ${path} ended`);
                }
                return resolve();
            });
        });
    }
    static makeGBDKN() {
        return new Promise((resolve, reject) => {
            logger_1.Logger.startLoading('Preparing gbdk-n');
            process.chdir(`${processRoot}/bin/gbdk-n-master`);
            const spawn = child_process.exec(`make`, function (error, stdout, stderr) {
                if (error) {
                    return reject(`Error while preparing gbdk-n. Error code${error.code}. Signal received${error.signal}\nStack${error.stack}`);
                }
            });
            spawn.on('exit', function (code) {
                if (code === 0) {
                    logger_1.Logger.success(`Gbdk-n prepared`);
                }
                return resolve();
            });
        });
    }
    static compile(path) {
        return new Promise((resolve, reject) => {
            logger_1.Logger.startLoading('Compiling');
            let number = path.lastIndexOf('.');
            let fileName = path.substring(0, number);
            let workingDirectory = fileName.substring(0, fileName.lastIndexOf('/'));
            process.chdir(workingDirectory);
            const spawn = child_process.exec(`${processRoot}/bin/gbdk-n-master/bin/gbdk-n-compile.bat ${fileName}.c`, function (error, stdout, stderr) {
                if (error) {
                    return reject(`Error while compiling. Error code${error.code}. Signal received${error.signal}\nStack${error.stack}`);
                }
            });
            spawn.on('exit', function (code) {
                if (code === 0) {
                    logger_1.Logger.success(`Compile success`);
                }
                return resolve();
            });
        });
    }
    static link(path) {
        return new Promise((resolve, reject) => {
            logger_1.Logger.startLoading('Editing links');
            let number = path.lastIndexOf('.');
            let fileName = path.substring(0, number);
            const spawn = child_process.exec(`${processRoot}/bin/gbdk-n-master/bin/gbdk-n-link.bat ${fileName}.rel -o ${fileName}.ihx`, function (error, stdout, stderr) {
                if (error) {
                    return reject(`Error while editing links. Error code${error.code}. Signal received${error.signal}\nStack${error.stack}`);
                }
            });
            spawn.on('exit', function (code) {
                if (code === 0) {
                    logger_1.Logger.success(`Editing links success`);
                }
                return resolve();
            });
        });
    }
    static makeRom(path) {
        return new Promise((resolve, reject) => {
            logger_1.Logger.startLoading('Making rom file');
            let number = path.lastIndexOf('.');
            let fileName = path.substring(0, number);
            const spawn = child_process.exec(`${processRoot}/bin/gbdk-n-master/bin/gbdk-n-make-rom.bat ${fileName}.ihx ${fileName}.gb`, function (error, stdout, stderr) {
                if (error) {
                    return reject(`Error while making rom. Error code${error.code}. Signal received${error.signal}\nStack${error.stack}`);
                }
            });
            spawn.on('exit', function (code) {
                if (code === 0) {
                    logger_1.Logger.success(`Making rom success`);
                }
                return resolve();
            });
        });
    }
}
exports.Command = Command;
//# sourceMappingURL=command.js.map