"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { clearTokens, getMe, isLoggedIn } from "@/lib/api";

type Me = {
  email: string;
  first_name: string;
  last_name: string;
  initials: string;
};

export default function NavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isLoggedIn()) {
      getMe()
        .then(setMe)
        .catch(() => setMe(null));
    } else {
      setMe(null);
    }
  }, [pathname]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function handleLogout() {
    clearTokens();
    setMe(null);
    setMenuOpen(false);
    router.push("/login");
  }

  function link(href: string, label: string) {
    const active = pathname === href;
    return (
      <a href={href} className={`nav-link ${active ? "active" : ""}`}>
        {label}
      </a>
    );
  }

  return (
    <nav className="site-nav">
      <span className="site-logo">
        <span className="dot" />
        MindTrace
      </span>
      {link("/", "Journal")}
      {link("/trends", "Trends")}
      {link("/chat", "Reflect")}

      <div style={{ marginLeft: "auto" }} ref={menuRef}>
        {me ? (
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="avatar-btn"
              title={`${me.first_name} ${me.last_name}`.trim() || me.email}
            >
              {me.initials}
            </button>
            {menuOpen && (
              <div className="profile-menu">
                <div className="profile-menu-name">
                  {me.first_name} {me.last_name}
                </div>
                <div className="profile-menu-email">{me.email}</div>
                <button className="profile-menu-item" onClick={handleLogout}>
                  Log out
                </button>
              </div>
            )}
          </div>
        ) : (
          <a href="/login" className="nav-link">Log in</a>
        )}
      </div>
    </nav>
  );
}
