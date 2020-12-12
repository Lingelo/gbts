import {execSync} from "child_process";
import fs from "fs";
import path from "path";
import rimraf from "rimraf";
import {Command} from "../src/command";
import {Logger} from "../src/logger";

const testDirectory = "__tests__";
const initDirectory = process.cwd();
const fullRootPathTests = initDirectory + "/" + testDirectory + "/" + "tmp";
const expectedDirectory = initDirectory + "/" + testDirectory + "/" + "expecteds";

describe("command all tests", () => {
    beforeEach(() => {
        fs.mkdirSync(fullRootPathTests);
    });

    test("should execute all command through a prompt", () => {

        // given
        const content = `console.log("Hello world")`;

        const filePath = `${fullRootPathTests}/hello.ts`;
        fs.writeFileSync(filePath, content);

        if (!path.isAbsolute(filePath)) {
            path.join(__dirname, path.basename(filePath));
        }

        // when
        execSync(`npm start -- --path ${filePath}`);

        const existCFile = fs.existsSync(`${fullRootPathTests}/hello.c`);
        const existGBFile = fs.existsSync(`${fullRootPathTests}/hello.gb`);

        expect(existCFile).toBeTruthy();
        expect(existGBFile).toBeTruthy();
    });

    test("should execute all commands", async () => {
        // given
        const content = `console.log("Hello world")`;

        const filePath = `${fullRootPathTests}/hello.ts`;
        fs.writeFileSync(filePath, content);

        // when
        try {
            await Command.ALL(filePath);
            const existCFile = fs.existsSync(`${fullRootPathTests}/hello.c`);
            const existGBFile = fs.existsSync(`${fullRootPathTests}/hello.gb`);

            expect(existCFile).toBeTruthy();
            expect(existGBFile).toBeTruthy();

        } catch (error) {
            fail(error);
        }
    });

    afterEach(() => {
        rimraf.sync(fullRootPathTests);
    });

});

describe("Command transpile tests", () => {

    beforeEach(() => {
        fs.mkdirSync(fullRootPathTests);
    });

    test("Should execute transpile and check file not found", async () => {

        // given
        const filePath: string = "test";

        // when
        try {
            await Command.TRANSPILE(filePath);
            fail();
        } catch (error) {
            // then
            expect(error).toEqual("File test does not exist");
        }

    });
    test("Should execute transpile and produce a .c file from a .ts file", async () => {
        // given
        const content = `console.log("Hello world")`;

        const filePath = `${fullRootPathTests}/hello.ts`;
        fs.writeFileSync(filePath, content);

        // when
        try {
            await Command.TRANSPILE(filePath);
            const contentFile = fs.readFileSync(`${fullRootPathTests}/hello.c`);
            const cContentFileExpected = fs.readFileSync(`${expectedDirectory}/hello.c`);

            expect(contentFile.toString()).toBe(cContentFileExpected.toString());
        } catch (error) {
            fail(error);
        }

    });

    afterEach(() => {
        rimraf.sync(fullRootPathTests);
    });
});

describe("Command compile tests", () => {
    beforeEach(() => {
        fs.mkdirSync(fullRootPathTests);
    });

    test("Should execute compile from .c file", async () => {
        // given
        const content = `console.log("Hello world")`;

        const filePath = `${fullRootPathTests}/hello.ts`;
        fs.writeFileSync(filePath, content);

        // when
        try {
            await Command.TRANSPILE(filePath);
            await Command.COMPILE(filePath);

            const gbFileExist = fs.existsSync(`${fullRootPathTests}/hello.gb`);

            expect(gbFileExist).toBeTruthy();
        } catch (error) {
            fail(error);
        }
    });

    afterEach(() => {
        rimraf.sync(fullRootPathTests);
    });
});

describe("Command build tests", () => {

    beforeEach(() => {
        fs.mkdirSync(fullRootPathTests);
    });

    test("Should execute build and generate .gb file", async () => {
        // given
        const content = `console.log("Hello world")`;

        const filePath = `${fullRootPathTests}/hello.ts`;
        fs.writeFileSync(filePath, content);

        // when
        try {
            await Command.ALL(filePath);
            await Command.BUILD(filePath);
            const gbFileExist = fs.existsSync(`${fullRootPathTests}/hello.gb`);

            expect(gbFileExist).toBeTruthy();
        } catch (error) {
            fail(error);
        }

    });

    afterEach(() => {
        rimraf.sync(fullRootPathTests);
    });
});

describe("Check command line", () => {

    test("Should check 'path' option is mandatory", () => {
        const mockExit = jest.spyOn(process, "exit").mockImplementation();
        jest.spyOn(Logger, "error").mockImplementation();

        Command.checkArgs({
            path: null,
        });

        expect(Logger.error).toHaveBeenCalledWith("Path is mandatory !");
        expect(mockExit).toHaveBeenCalledWith(0);

    });
});
