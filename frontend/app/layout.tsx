import "./globals.css";

export const metadata = {
  title: "MindTrace — your emotional trace, over time",
  description: "Journal freely. See your own patterns. Never diagnosed, always yours.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <nav className="site-nav">
          <span className="site-logo">
            <span className="dot" />
            MindTrace
          </span>
          <a href="/" className="nav-link">Journal</a>
          <a href="/trends" className="nav-link">Trends</a>
          <a href="/chat" className="nav-link">Reflect</a>
          <a href="/login" className="nav-link" style={{ marginLeft: "auto" }}>
            Log in
          </a>
        </nav>
        <main>{children}</main>
      </body>
    </html>
  );
}
