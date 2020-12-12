import ora from "ora";

export class Logger {

    public static instance = ora({
        color: "yellow",
        spinner: {
            frames: ["···", "•··", "••·", "•••"],
            interval: 250,
        },
    });

    public static success(text: string) {
        this.instance.succeed(text);
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

    public static info(text: string) {
        this.instance.info(text);
    }
}