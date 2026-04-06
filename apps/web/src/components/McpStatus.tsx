import { useState, useEffect } from "react";
import { mcp } from "../lib/api";

export function McpStatus() {
  const [connected, setConnected] = useState<boolean | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [showManual, setShowManual] = useState(false);

  useEffect(() => {
    mcp.status().then((s) => setConnected(s.connected)).catch(() => setConnected(false));
  }, []);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const result = await mcp.connectClaudeCode();
      if (result.ok) {
        setConnected(true);
      } else {
        setShowManual(true);
      }
    } catch {
      setShowManual(true);
    } finally {
      setConnecting(false);
    }
  };

  if (connected === null) return null;

  return (
    <div className="relative">
      {connected ? (
        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
          </span>
          MCP Conectado
        </div>
      ) : (
        <div>
          <button
            onClick={handleConnect}
            disabled={connecting}
            className="flex items-center gap-2 rounded-md border border-zinc-700 px-3 py-1.5 text-xs text-zinc-300 transition hover:border-zinc-500 hover:text-white disabled:opacity-50"
          >
            <span className="h-2 w-2 rounded-full bg-zinc-600" />
            {connecting ? "Conectando..." : "Conectar ao Claude Code"}
          </button>

          {showManual && (
            <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-lg border border-zinc-700 bg-zinc-900 p-4 text-xs shadow-xl">
              <p className="mb-2 text-zinc-300">
                Conexão automática falhou. Adicione isso no{" "}
                <code className="text-zinc-100">~/.claude/settings.json</code>:
              </p>
              <pre className="overflow-x-auto rounded bg-zinc-800 p-2 text-zinc-400">
{`{
  "mcpServers": {
    "o-mcp": {
      "command": "npx",
      "args": ["o-mcp"]
    }
  }
}`}
              </pre>
              <button
                onClick={() => setShowManual(false)}
                className="mt-2 text-zinc-500 hover:text-zinc-300"
              >
                Fechar
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
