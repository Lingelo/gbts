import ora = require('ora');

export class Logger {

    static instance = ora({
        color: 'yellow',
        spinner: {
            frames: ['···', '•··', '••·', '•••'],
            interval: 250
        }
    });

    public static success(text: string) {
        this.instance.succeed(text)
    }

    public static error(text: string) {
        this.instance.fail(text);
    }

    public static startLoading(text: string) {
        this.instance.start(text);
    }

    public static stopLoading() {
        this.instance.stopAndPersist();
    }
}
