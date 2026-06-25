import { Link, useLocation } from "react-router-dom";
import { Leaf, X } from "lucide-react";

import { farNavSections } from "@/constants/navigation";
import useAuth from "@/hooks/useAuth";

export function Sidebar({ open, onClose }) {
  const { user, initial } = useAuth();
  const { pathname } = useLocation();
  const isActive = (to, exact) =>
    exact ? pathname === to : pathname === to || pathname.startsWith(to + "/");

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-foreground/40 lg:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={[
          "fixed inset-y-0 left-0 z-50 flex w-[240px] flex-col bg-surface border-r border-border transition-transform duration-200",
          "lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between gap-2 border-b border-border px-5">
          <Link to="/" className="flex items-center gap-2.5" onClick={onClose}>
            <div className="grid h-8 w-8 place-items-center bg-primary">
              <Leaf className="h-4 w-4 text-accent" strokeWidth={2.5} />
            </div>
            <span className="font-display text-[17px] tracking-tight text-foreground">
              AgriCentral
            </span>
          </Link>
          <button
            className="text-secondary hover:text-foreground lg:hidden"
            onClick={onClose}
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-5">
          {farNavSections.map((group) => (
            <div key={group.label} className="mb-5">
              <div className="label-eyebrow px-3 pb-2">{group.label}</div>
              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const active = isActive(item.to, item.exact);
                  const Icon = item.icon;
                  return (
                    <li key={item.to}>
                      <Link
                        to={item.to}
                        onClick={onClose}
                        className={[
                          "relative flex items-center gap-3 px-3 py-2 text-sm transition-colors",
                          active
                            ? "bg-accent-soft font-bold text-foreground"
                            : "text-secondary hover:bg-muted hover:text-foreground",
                        ].join(" ")}
                      >
                        {active && (
                          <span className="absolute inset-y-0 left-0 w-[3px] bg-accent" />
                        )}
                        <Icon
                          className={[
                            "h-4 w-4 shrink-0",
                            active ? "text-accent" : "",
                          ].join(" ")}
                          strokeWidth={active ? 2.5 : 2}
                        />
                        <span className="truncate">{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* User footer */}
        <div className="border-t border-border p-3">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="grid h-9 w-9 shrink-0 place-items-center bg-primary font-display text-sm text-accent">
              {initial}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold text-foreground">
                {user?.fullname}
              </div>
              <div className="truncate text-[11px] text-secondary">
                {user?.role} · {user?.email}
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
