import { lazy } from 'react';

// DashboardPage pulls in Recharts, the single heaviest dependency in the
// app (~500kB minified) — splitting it into its own chunk keeps that
// weight out of the bundle everyone downloads, including everyone who
// lands on /login and never visits the dashboard.
export const DashboardPage = lazy(() =>
  import('../pages/dashboard/DashboardPage').then((module) => ({
    default: module.DashboardPage,
  })),
);
