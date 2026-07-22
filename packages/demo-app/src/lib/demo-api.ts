/** Guard demo-only API routes that spawn Python e2e scripts with signing keys. */

export function demoApiBlockedResponse(request: Request): Response | null {
  if (process.env.DEMO_API_ENABLED !== "true") {
    return Response.json(
      {
        error:
          "Demo API is disabled. Set DEMO_API_ENABLED=true in .env.local for local development only. " +
          "Never enable this on public deployments without DEMO_API_SECRET.",
      },
      { status: 403 },
    );
  }

  const secret = process.env.DEMO_API_SECRET?.trim();
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  return null;
}

export function sanitizeProcessOutput(message: string, maxLength = 240): string {
  const trimmed = message.trim();
  if (trimmed.length <= maxLength) {
    return trimmed;
  }
  return `${trimmed.slice(0, maxLength)}…`;
}
