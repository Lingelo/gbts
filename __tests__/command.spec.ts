import fs from "fs";
import rimraf from "rimraf";
import {Command} from "../src/command";

const testDirectory = "__tests__";
const initDirectory = process.cwd();
const fullRootPathTests = initDirectory + "/" + testDirectory + "/" + "tmp";
const expectedDirectory = initDirectory + "/" + testDirectory + "/" + "expecteds";

describe("command all tests", () => {
    beforeEach(() => {
        fs.mkdirSync(fullRootPathTests);
    });

    test("should execute all commands", async () => {
        // given
        const content = `console.log("Hello world")`;

        const path = `${fullRootPathTests}/hello.ts`;
        fs.writeFileSync(path, content);

        // when
        try {
            await Command.ALL(path);
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
        const path: string = "test";

        // when
        try {
            await Command.TRANSPILE(path);
            fail();
        } catch (error) {
            // then
            expect(error).toEqual("File test does not exist");
        }

    });
    test("Should execute transpile and produce a .c file from a .ts file", async () => {
        // given
        const content = `console.log("Hello world")`;

        const path = `${fullRootPathTests}/hello.ts`;
        fs.writeFileSync(path, content);

        // when
        try {
            await Command.TRANSPILE(path);
            const contentFile = fs.readFileSync(`${fullRootPathTests}/hello.c`);
            const cContentFileExpected = fs.readFileSync(`${expectedDirectory}/hello.c`);

            expect(contentFile.toString()).toEqual(cContentFileExpected.toString());
        } catch (error) {
            fail(error);
        }

    });

    afterEach(() => {
        rimraf.sync(fullRootPathTests);
    });
});
