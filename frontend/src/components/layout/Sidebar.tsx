import { NavLink } from "react-router-dom";
import { useAuthStore } from "../../features/auth/auth-store";

const navItems = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/vocabulary", label: "Vocabulary" },
  { to: "/study", label: "Study" },
  { to: "/settings", label: "Settings" },
];

const adminNavItems = [{ to: "/admin/words", label: "Manage" }];

export function Sidebar() {
  const role = useAuthStore((state) => state.user?.role);
  const items = role === "admin" ? [...navItems, ...adminNavItems] : navItems;

  return (
    <nav className="w-56 shrink-0 border-r border-paper-300 bg-paper-50 px-3 py-6 dark:border-ink-700 dark:bg-ink-900">
      <ul className="flex flex-col gap-1">
        {items.map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              className={({ isActive }) =>
                `block rounded-lg px-4 py-2.5 font-body text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-ink-950 text-paper-100 dark:bg-amber-600 dark:text-ink-950"
                    : "text-ink-800 hover:bg-ink-950/5 dark:text-paper-100 dark:hover:bg-paper-100/10"
                }`
              }
            >
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
