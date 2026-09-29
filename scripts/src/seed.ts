import { spawn } from "node:child_process";

const child = spawn("pnpm", ["--filter", "@workspace/api-server", "run", "build"], { stdio: "inherit", shell: true });
child.on("exit", (code) => process.exit(code ?? 1));