import ora from "ora";

export class Logger {

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

    private static instance = Logger.init();

    private static init() {
        return ora({
            color: "yellow",
            isEnabled: true,
            spinner: {
                frames: ["···", "•··", "••·", "•••"],
                interval: 500,
            },
        });
    }
}
