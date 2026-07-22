import { spawn } from "node:child_process";
import path from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function resolveProverDir(): string {
  const configured = process.env.DEMO_PROVER_DIR;
  if (configured) {
    return path.isAbsolute(configured)
      ? configured
      : path.resolve(process.cwd(), configured);
  }
  return path.resolve(process.cwd(), "../prover");
}

function resolvePython(): string {
  return process.env.DEMO_PYTHON ?? (process.platform === "win32" ? "python" : "python3");
}

export async function GET() {
  const proverDir = resolveProverDir();
  const scriptPath = path.join(proverDir, "e2e", "generate_commitment.py");
  const python = resolvePython();

  return new Promise<Response>((resolve) => {
    const child = spawn(python, [scriptPath], {
      cwd: proverDir,
      env: { ...process.env, PYTHONUNBUFFERED: "1" },
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString("utf8");
    });
    child.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString("utf8");
    });

    child.on("close", (code) => {
      if (code !== 0) {
        resolve(
          Response.json(
            { error: stderr.trim() || "Commitment generation failed" },
            { status: 500 },
          ),
        );
        return;
      }

      try {
        const payload = JSON.parse(stdout.trim()) as Record<string, unknown>;
        resolve(Response.json(payload));
      } catch {
        resolve(
          Response.json({ error: "Invalid prover output", raw: stdout.trim() }, { status: 500 }),
        );
      }
    });

    child.on("error", (error) => {
      resolve(Response.json({ error: error.message }, { status: 500 }));
    });
  });
}
