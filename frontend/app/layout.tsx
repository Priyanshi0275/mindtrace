import "./globals.css";
import NavBar from "@/components/NavBar";

export const metadata = {
  title: "MindTrace — your emotional trace, over time",
  description: "Journal freely. See your own patterns. Never diagnosed, always yours.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <NavBar />
        <main>{children}</main>
      </body>
    </html>
  );
}
