import "./globals.css";

export const metadata = {
  title: "MindTrace",
  description: "Personal journaling & emotional pattern intelligence",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <nav style={{ padding: "1rem", borderBottom: "1px solid #eee" }}>
          <a href="/" style={{ marginRight: "1rem" }}>Journal</a>
          <a href="/trends" style={{ marginRight: "1rem" }}>Trends</a>
          <a href="/chat" style={{ marginRight: "1rem" }}>Reflect</a>
          <a href="/login">Login</a>
        </nav>
        <main style={{ maxWidth: 720, margin: "2rem auto", padding: "0 1rem" }}>
          {children}
        </main>
      </body>
    </html>
  );
}
