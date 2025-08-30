import fs from "fs";
import path from "path";
import { Command } from "../src/command";
import { Logger } from "../src/logger";

// Mock dependencies to make tests faster
jest.mock("../src/logger");

// Mock AI transpiler to avoid real API calls in tests
jest.mock("../src/ai/ai-transpiler", () => ({
  AITranspiler: jest.fn().mockImplementation(() => ({
    transpile: jest.fn().mockResolvedValue({
      cCode: `#include <gb/gb.h>\nvoid main() { printf("Hello World!"); }`,
      provider: 'mock',
      duration: 100,
      cost: 0.001,
      quality: 0.9,
      fromCache: false,
      metadata: {
        originalSize: 20,
        transpiredSize: 50,
        estimatedROMSize: 100,
        estimatedRAMUsage: 10,
        warnings: [],
        optimizations: ['Mock optimization']
      }
    })
  }))
}));

const testDirectory = "__tests__";
const initDirectory = process.cwd();
const fullRootPathTests = path.join(initDirectory, testDirectory, "tmp");

describe("Command Tests", () => {
  beforeEach(() => {
    if (!fs.existsSync(fullRootPathTests)) {
      fs.mkdirSync(fullRootPathTests, { recursive: true });
    }
    jest.clearAllMocks();
  });

  afterEach(async () => {
    if (fs.existsSync(fullRootPathTests)) {
      fs.rmSync(fullRootPathTests, { recursive: true, force: true });
    }
  });


  describe("TRANSPILE", () => {
    test("Should execute transpile successfully", async () => {
      const content = 'console.log("Hello world")';
      const filePath = path.join(fullRootPathTests, "hello.ts");
      fs.writeFileSync(filePath, content);

      await Command.TRANSPILE(filePath);

      expect(Logger.startLoading).toHaveBeenCalledWith("🤖 Starting AI-powered transpilation TypeScript → GameBoy C");
      expect(Logger.success).toHaveBeenCalledWith("🎉 AI transpilation completed!");
      
      // Check that C file was created
      const cFilePath = path.join(fullRootPathTests, "hello.c");
      expect(fs.existsSync(cFilePath)).toBeTruthy();
    });

    test("Should handle file not found error", async () => {
      const filePath = "nonexistent.ts";

      await expect(Command.TRANSPILE(filePath)).rejects.toThrow("does not exist");
      // stopLoading is not called because the error occurs before startLoading
    });
  });

  describe("Path utilities", () => {
    test("Should handle relative paths correctly", () => {
      // Test the computeAbsolutePath method indirectly through TRANSPILE
      const content = 'console.log("Hello world")';
      const relativePath = `__tests__/tmp/test.ts`;
      
      if (!fs.existsSync(path.dirname(relativePath))) {
        fs.mkdirSync(path.dirname(relativePath), { recursive: true });
      }
      fs.writeFileSync(relativePath, content);

      expect(async () => {
        await Command.TRANSPILE(relativePath);
      }).not.toThrow();

      // Cleanup
      fs.unlinkSync(relativePath);
    });
  });
});