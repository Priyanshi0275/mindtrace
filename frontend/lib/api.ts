const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function getTokens() {
  if (typeof window === "undefined") return { access: null, refresh: null };
  return {
    access: localStorage.getItem("mindtrace_access"),
    refresh: localStorage.getItem("mindtrace_refresh"),
  };
}

export function setTokens(access: string, refresh: string) {
  localStorage.setItem("mindtrace_access", access);
  localStorage.setItem("mindtrace_refresh", refresh);
}

export function clearTokens() {
  localStorage.removeItem("mindtrace_access");
  localStorage.removeItem("mindtrace_refresh");
}

export async function apiFetch(path: string, options: RequestInit = {}) {
  const { access } = getTokens();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (access) headers["Authorization"] = `Bearer ${access}`;

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (res.status === 401) {
    clearTokens();
    if (typeof window !== "undefined") window.location.href = "/login";
    throw new Error("Session expired — redirecting to login.");
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error ${res.status}: ${text}`);
  }
  return res.json();
}

export async function login(email: string, password: string) {
  const res = await fetch(`${API_URL}/api/auth/login/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: email, password }),
  });
  if (!res.ok) throw new Error("Login failed");
  const data = await res.json();
  setTokens(data.access, data.refresh);
  return data;
}

export async function register(email: string, password: string) {
  return apiFetch("/api/auth/register/", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}
