import { runCli } from "./cli.ts";

runCli(process.argv).catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
