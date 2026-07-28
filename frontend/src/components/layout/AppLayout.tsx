import { Suspense } from "react";
import { Outlet } from "react-router-dom";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";

export function AppLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-8">
          <Suspense
            fallback={<p className="font-body text-ink-700">Loading…</p>}
          >
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
