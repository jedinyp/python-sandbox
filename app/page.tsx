"use client";
import { useState, useEffect } from "react";

export default function Home() {
  const [code, setCode] = useState('print("Hello from sandbox!")');
  const [output, setOutput] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [socketId, setSocketId] = useState<string | null>(null);

  useEffect(() => {
    const id = crypto.randomUUID();
    setSocketId(id);

    const ws = new WebSocket("ws://localhost:8080");
    ws.onopen = () => ws.send(JSON.stringify({ register: id }));
    ws.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.socketId === id) {
        if (data.output) setOutput((prev) => prev + data.output);
        if (data.done) {
          setOutput((prev) => prev + `\n[Process exited: ${data.exitCode}]`);
          setIsRunning(false);
        }
      }
    };
    return () => ws.close();
  }, []);

  const runCode = async () => {
    if (isRunning) return;
    setIsRunning(true);
    setOutput("");
    await fetch("/api/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, socketId }),
    });
  };

  return (
    <main>
      <h1>Python Sandbox</h1>
      <textarea
        className="code-area"
        value={code}
        onChange={(e) => setCode(e.target.value)}
      />
      <button
        type="button"
        className="run-btn"
        onClick={runCode}
        disabled={isRunning}
      >
        {isRunning ? "Running..." : "Run"}
      </button>
      <pre>
        {output}
      </pre>
    </main>
  );
}