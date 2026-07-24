"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login, register } from "@/lib/api";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "register">("login");
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      if (mode === "register") {
        await register(email, password);
      }
      await login(email, password);
      router.push("/");
    } catch (e: any) {
      setError(e.message);
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-blob" />
      <span className="eyebrow">{mode === "login" ? "Welcome back" : "Start your trace"}</span>
      <h1 style={{ fontSize: "1.9rem", marginBottom: "1.25rem" }}>
        {mode === "login" ? "Log in" : "Create account"}
      </h1>

      <div className="auth-card">
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="password (8+ characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit" style={{ width: "100%" }}>
            {mode === "login" ? "Log in" : "Create account"}
          </button>
        </form>
        {error && <div className="error-banner">{error}</div>}
        <p style={{ marginTop: "1.1rem", fontSize: "0.9rem" }}>
          <button
            type="button"
            className="link-btn"
            onClick={() => setMode(mode === "login" ? "register" : "login")}
          >
            {mode === "login" ? "Need an account? Create one" : "Already have an account? Log in"}
          </button>
        </p>
      </div>
    </div>
  );
}
