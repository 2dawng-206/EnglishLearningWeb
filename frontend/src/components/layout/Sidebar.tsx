import { NavLink } from 'react-router-dom';

const navItems = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/vocabulary', label: 'Vocabulary' },
  { to: '/study', label: 'Study' },
];

export function Sidebar() {
  return (
    <nav className="w-56 shrink-0 border-r border-paper-300 bg-paper-50 px-3 py-6">
      <ul className="flex flex-col gap-1">
        {navItems.map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              className={({ isActive }) =>
                `block rounded-lg px-4 py-2.5 font-body text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-ink-950 text-paper-100'
                    : 'text-ink-800 hover:bg-ink-950/5'
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
