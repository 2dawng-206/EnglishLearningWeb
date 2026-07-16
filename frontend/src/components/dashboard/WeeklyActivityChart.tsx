import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { DailyActivity } from '../../types/gamification';

function formatDayLabel(dateString: string): string {
  return new Date(`${dateString}T00:00:00Z`).toLocaleDateString('en-US', {
    weekday: 'short',
    timeZone: 'UTC',
  });
}

export function WeeklyActivityChart({ data }: { data: DailyActivity[] }) {
  const chartData = data.map((day) => ({
    day: formatDayLabel(day.date),
    correct: day.correctReviews,
    missed: day.totalReviews - day.correctReviews,
  }));

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#cfc9b8" vertical={false} />
          <XAxis
            dataKey="day"
            tick={{ fontFamily: 'IBM Plex Sans, sans-serif', fontSize: 12, fill: '#283754' }}
            axisLine={{ stroke: '#cfc9b8' }}
            tickLine={false}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 12, fill: '#283754' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              fontFamily: 'IBM Plex Sans, sans-serif',
              fontSize: 13,
              borderRadius: 8,
              border: '1px solid #cfc9b8',
            }}
          />
          <Bar dataKey="correct" stackId="reviews" fill="#7fa894" name="Correct" />
          <Bar dataKey="missed" stackId="reviews" fill="#ef4444" name="Missed" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
