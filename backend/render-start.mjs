// Runs the gateway and all four services in a single process tree so the whole
// backend fits in one free Render web service. The gateway listens on Render's
// $PORT; the services listen on fixed localhost ports behind it.
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.dirname(fileURLToPath(import.meta.url));
const local = (port) => `http://127.0.0.1:${port}`;
const PORTS = { auth: 8001, chat: 8002, agent: 8003, billing: 8004 };

// Each service has its own database; fall back to a shared MONGODB_URI.
const mongo = (name) => process.env[`${name.toUpperCase()}_MONGODB_URI`] || process.env.MONGODB_URI;

const internalUrls = {
  AUTH_SERVICE_URL: local(PORTS.auth),
  AUTH_SERVICE: local(PORTS.auth),
  CHAT_SERVICE_URL: local(PORTS.chat),
  CHAT_SERVICE: local(PORTS.chat),
  AGENT_SERVICE_URL: local(PORTS.agent),
  AGENT_SERVICE: local(PORTS.agent),
  BILLING_SERVICE_URL: local(PORTS.billing),
  BILLING_SERVICE: local(PORTS.billing),
};

const apps = [
  ...Object.entries(PORTS).map(([name, port]) => ({
    name,
    cwd: path.join(root, "services", name),
    env: { PORT: String(port), ...(mongo(name) && { MONGODB_URI: mongo(name) }) },
  })),
  { name: "gateway", cwd: path.join(root, "gateway"), env: { PORT: process.env.PORT || "8000" } },
];

const children = apps.map(({ name, cwd, env }) => {
  const child = spawn(process.execPath, ["index.js"], {
    cwd,
    env: { ...process.env, ...internalUrls, ...env },
    stdio: ["ignore", "pipe", "pipe"],
  });
  const tag = (stream, out) =>
    stream.on("data", (d) => d.toString().split("\n").filter(Boolean).forEach((l) => out.write(`[${name}] ${l}\n`)));
  tag(child.stdout, process.stdout);
  tag(child.stderr, process.stderr);
  // If any service dies, exit so Render restarts the whole instance.
  child.on("exit", (code, signal) => {
    console.error(`[${name}] exited (code=${code}, signal=${signal}); shutting down`);
    shutdown(1);
  });
  return child;
});

let stopping = false;
function shutdown(code) {
  if (stopping) return;
  stopping = true;
  children.forEach((c) => c.exitCode === null && c.kill("SIGTERM"));
  setTimeout(() => process.exit(code), 2000).unref();
}
process.on("SIGTERM", () => shutdown(0));
process.on("SIGINT", () => shutdown(0));
