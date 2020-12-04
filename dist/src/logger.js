"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = void 0;
const ora = require("ora");
class Logger {
    static success(text) {
        this.instance.succeed(text);
    }
    static error(text) {
        this.instance.fail(text);
    }
    static startLoading(text) {
        this.instance.start(text);
    }
    static stopLoading() {
        this.instance.stopAndPersist();
    }
}
exports.Logger = Logger;
Logger.instance = ora({
    color: 'yellow',
    spinner: {
        frames: ['···', '•··', '••·', '•••'],
        interval: 250
    }
});
//# sourceMappingURL=logger.js.map