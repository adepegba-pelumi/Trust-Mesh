import { spawn } from "node:child_process";
import path from "node:path";

import { demoApiBlockedResponse, sanitizeProcessOutput } from "@/lib/demo-api";

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

export async function GET(request: Request) {
  const blocked = demoApiBlockedResponse(request);
  if (blocked) {
    return blocked;
  }

  const { searchParams } = new URL(request.url);
  const unsafe = searchParams.get("unsafe") === "true";
  const scenario = unsafe ? "unsafe" : "happy";
  const proverDir = resolveProverDir();
  const scriptPath = path.join(proverDir, "e2e", "run_agent_demo.py");
  const python = resolvePython();

  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const child = spawn(
        python,
        [scriptPath, "--stream", "--scenario", scenario],
        {
          cwd: proverDir,
          env: { ...process.env, PYTHONUNBUFFERED: "1" },
          stdio: ["ignore", "pipe", "pipe"],
        },
      );

      let stdoutBuffer = "";

      const pushSse = (payload: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
      };

      const flushLines = (chunk: string) => {
        stdoutBuffer += chunk;
        const lines = stdoutBuffer.split("\n");
        stdoutBuffer = lines.pop() ?? "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("{")) continue;
          try {
            pushSse(JSON.parse(trimmed) as Record<string, unknown>);
          } catch {
            pushSse({ type: "log", message: trimmed });
          }
        }
      };

      child.stdout.on("data", (data: Buffer) => {
        flushLines(data.toString("utf8"));
      });

      child.stderr.on("data", (data: Buffer) => {
        pushSse({ type: "stderr", message: sanitizeProcessOutput(data.toString("utf8")) });
      });

      child.on("close", (code) => {
        if (stdoutBuffer.trim().startsWith("{")) {
          try {
            pushSse(JSON.parse(stdoutBuffer.trim()) as Record<string, unknown>);
          } catch {
            // ignore trailing partial JSON
          }
        }
        pushSse({ type: "process_exit", code });
        controller.close();
      });

      child.on("error", (error) => {
        pushSse({ type: "error", message: error.message });
        controller.close();
      });

      request.signal.addEventListener("abort", () => {
        child.kill("SIGTERM");
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
