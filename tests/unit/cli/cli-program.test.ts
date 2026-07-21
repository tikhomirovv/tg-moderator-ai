import { describe, expect, test } from "bun:test";
import { buildCliProgram } from "../../../scripts/cli";

describe("operator cli program", () => {
  test("registers promo create and global help", async () => {
    const program = buildCliProgram();
    const help = await new Promise<string>((resolve, reject) => {
      const chunks: string[] = [];
      const originalWrite = process.stdout.write.bind(process.stdout);
      process.stdout.write = ((chunk: string | Uint8Array) => {
        chunks.push(String(chunk));
        return true;
      }) as typeof process.stdout.write;

      program
        .parseAsync(["node", "cli", "--help"])
        .then(() => {
          process.stdout.write = originalWrite;
          resolve(chunks.join(""));
        })
        .catch((error) => {
          process.stdout.write = originalWrite;
          reject(error);
        });
    });

    expect(help).toContain("promo");
    expect(help).toContain("credits");
    expect(help).toContain("Operator CLI");
  });
});
