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
    <div>
      <h1>{mode === "login" ? "Log in" : "Create account"}</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">{mode === "login" ? "Log in" : "Register"}</button>
      </form>
      {error && <p style={{ color: "crimson" }}>{error}</p>}
      <p style={{ marginTop: "1rem" }}>
        <a onClick={() => setMode(mode === "login" ? "register" : "login")} style={{ cursor: "pointer", textDecoration: "underline" }}>
          {mode === "login" ? "Need an account? Register" : "Already have an account? Log in"}
        </a>
      </p>
    </div>
  );
}
