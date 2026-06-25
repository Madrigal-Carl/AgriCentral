import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, LogOut, Menu, Settings, User } from "lucide-react";

import { useCrumbs } from "@/utils/useCrumbs";
import useAuth from "@/hooks/useAuth";
import { Button } from "@/components/ui";

function LogoutConfirmModal({ onCancel, onConfirm }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground-40 p-4"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm bg-surface border border-border shadow-xl p-6 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-4 grid h-12 w-12 place-items-center bg-warning/10 text-warning">
          <LogOut className="h-6 w-6" />
        </div>
        <h3 className="font-display text-lg tracking-tight text-foreground mb-1">
          Log Out?
        </h3>
        <p className="text-sm text-secondary mb-6">
          Are you sure you want to log out of{" "}
          <strong className="text-foreground">AgriCentral</strong>? You'll need
          to sign in again to access your account.
        </p>
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm}>
            Log Out
          </Button>
        </div>
      </div>
    </div>
  );
}

export function Navbar({ onMenu }) {
  const crumb = useCrumbs();
  const { user, initial, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    window.addEventListener("mousedown", handler);
    return () => window.removeEventListener("mousedown", handler);
  }, []);

  function handleLogoutClick() {
    setOpen(false);
    setShowLogoutConfirm(true);
  }

  async function handleLogoutConfirm() {
    setShowLogoutConfirm(false);
    await logout();
    navigate("/auth");
  }

  return (
    <header className="sticky top-0 z-20 md:z-30 flex h-16 items-center justify-between gap-4 border-b border-border bg-surface px-4 lg:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <button
          className="text-secondary hover:text-foreground lg:hidden"
          onClick={onMenu}
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <nav className="flex min-w-0 items-center gap-1.5 text-sm">
          <span className="hidden font-semibold text-foreground sm:inline">
            AgriCentral
          </span>
          <span className="hidden text-secondary sm:inline">/</span>
          {crumb.group && (
            <>
              <span className="text-secondary">{crumb.group}</span>
              <span className="text-secondary">/</span>
            </>
          )}
          <span className="truncate font-semibold text-foreground">
            {crumb.label}
          </span>
        </nav>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative" ref={ref}>
          <button
            onClick={() => setOpen((o) => !o)}
            className="flex items-center gap-2 py-1.5 pl-1 pr-2 hover:bg-muted"
          >
            <div className="grid h-8 w-8 place-items-center bg-accent-soft rounded-full font-display text-xs text-accent">
              {initial}
            </div>
            <ChevronDown className="h-4 w-4 text-secondary" />
          </button>
          {open && (
            <div className="absolute right-0 top-full mt-2 w-56 border border-border bg-surface shadow-lg">
              <div className="border-b border-border px-4 py-3">
                <div className="text-sm font-semibold text-foreground">
                  {user?.fullname}
                </div>
                <div className="text-xs text-secondary">{user?.email}</div>
              </div>
              <ul className="py-1">
                {[
                  { icon: User, label: "Profile" },
                  { icon: Settings, label: "Account Settings" },
                ].map((i) => (
                  <li key={i.label}>
                    <button className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-foreground hover:bg-muted">
                      <i.icon className="h-4 w-4 text-secondary" />
                      {i.label}
                    </button>
                  </li>
                ))}
                <li className="border-t border-border">
                  <button
                    onClick={handleLogoutClick}
                    className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-foreground hover:bg-muted"
                  >
                    <LogOut className="h-4 w-4 text-secondary" />
                    Logout
                  </button>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>

      {showLogoutConfirm && (
        <LogoutConfirmModal
          onCancel={() => setShowLogoutConfirm(false)}
          onConfirm={handleLogoutConfirm}
        />
      )}
    </header>
  );
}
