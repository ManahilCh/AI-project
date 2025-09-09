"use client";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "../../components/ui/button";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, BarChart, Bar } from "recharts";

const SUBJECTS = ["Math", "Science", "English", "Computer"] as const;
const YEARS = [2021, 2022, 2023, 2024, 2025] as const;
const MOCK_DATA = [
  { year: 2021, subject: "Math", passRate: 72, avgScore: 68 },
  { year: 2021, subject: "Science", passRate: 76, avgScore: 70 },
  { year: 2021, subject: "English", passRate: 81, avgScore: 73 },
  { year: 2021, subject: "Computer", passRate: 78, avgScore: 75 },
  { year: 2022, subject: "Math", passRate: 74, avgScore: 70 },
  { year: 2022, subject: "Science", passRate: 77, avgScore: 72 },
  { year: 2022, subject: "English", passRate: 82, avgScore: 75 },
  { year: 2022, subject: "Computer", passRate: 80, avgScore: 77 },
  { year: 2023, subject: "Math", passRate: 76, avgScore: 72 },
  { year: 2023, subject: "Science", passRate: 79, avgScore: 74 },
  { year: 2023, subject: "English", passRate: 84, avgScore: 77 },
  { year: 2023, subject: "Computer", passRate: 83, avgScore: 80 },
  { year: 2024, subject: "Math", passRate: 78, avgScore: 74 },
  { year: 2024, subject: "Science", passRate: 81, avgScore: 76 },
  { year: 2024, subject: "English", passRate: 85, avgScore: 79 },
  { year: 2024, subject: "Computer", passRate: 85, avgScore: 82 },
  { year: 2025, subject: "Math", passRate: 80, avgScore: 76 },
  { year: 2025, subject: "Science", passRate: 83, avgScore: 78 },
  { year: 2025, subject: "English", passRate: 86, avgScore: 80 },
  { year: 2025, subject: "Computer", passRate: 87, avgScore: 84 },
];

type MetricKey = "passRate" | "avgScore";

export default function DashboardPage() {
  const [year, setYear] = useState<string>("all");
  const [subject, setSubject] = useState<string>("all");
  const [metric, setMetric] = useState<MetricKey>("passRate");

  const filtered = useMemo(() => {
    return MOCK_DATA.filter((d) => (year === "all" ? true : d.year === Number(year)) && (subject === "all" ? true : d.subject === subject));
  }, [year, subject]);

  const byYear = useMemo(() => {
    const map = new Map<number, { year: number; value: number; count: number }>();
    for (const d of MOCK_DATA.filter((d) => (subject === "all" ? true : d.subject === subject))) {
      const key = d.year; if (!map.has(key)) map.set(key, { year: d.year, value: 0, count: 0 });
      const m = map.get(key)!; m.value += d[metric]; m.count += 1;
    }
    return Array.from(map.values()).map((v) => ({ year: v.year, value: Math.round((v.value / v.count) * 10) / 10 })).sort((a, b) => a.year - b.year);
  }, [subject, metric]);

  const bySubject = useMemo(() => {
    const map = new Map<string, { subject: string; value: number; count: number }>();
    for (const d of filtered) {
      const key = d.subject; if (!map.has(key)) map.set(key, { subject: d.subject, value: 0, count: 0 });
      const m = map.get(key)!; m.value += d[metric]; m.count += 1;
    }
    return Array.from(map.values()).map((v) => ({ subject: v.subject, value: Math.round((v.value / v.count) * 10) / 10 }));
  }, [filtered, metric]);

  return (
    <section className="container mx-auto px-4 py-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Results Dashboard</h2>
          <p className="text-muted-foreground">Interactive trends (2021–2025) with filters, predictions and insights.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <select value={year} onChange={(e) => setYear(e.target.value)} className="h-10 rounded-md border bg-background px-3 py-2 text-sm">
            <option value="all">All Years</option>
            {YEARS.map((y) => (<option key={y} value={String(y)}>{y}</option>))}
          </select>
          <select value={subject} onChange={(e) => setSubject(e.target.value)} className="h-10 rounded-md border bg-background px-3 py-2 text-sm">
            <option value="all">All Subjects</option>
            {SUBJECTS.map((s) => (<option key={s} value={s}>{s}</option>))}
          </select>
          <select value={metric} onChange={(e) => setMetric(e.target.value as MetricKey)} className="h-10 rounded-md border bg-background px-3 py-2 text-sm">
            <option value="passRate">Pass Rate (%)</option>
            <option value="avgScore">Average Score</option>
          </select>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="xl:col-span-2 rounded-lg border bg-card">
          <div className="p-6 border-b"><div className="text-xl font-semibold">Year-wise Trend</div></div>
          <div className="p-6">
            <div className="h-[320px] w-full">
              <LineChart width={800} height={320} data={byYear} className="max-w-full">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis domain={[0, 100]} />
                <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
              </LineChart>
            </div>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.05 }} className="rounded-lg border bg-card">
          <div className="p-6 border-b"><div className="text-xl font-semibold">AI Predictions</div></div>
          <div className="p-6 text-sm">
            <div className="text-muted-foreground">Simulated</div>
            <div className="rounded-lg border p-3 mt-2">
              <div className="font-medium">Next-year {metric === "passRate" ? "Pass Rate" : "Average Score"}</div>
              <div className="mt-1 text-2xl font-extrabold">{Math.round(((byYear[byYear.length - 1]?.value) ?? 70) + 1)}%</div>
              <div className="text-xs text-muted-foreground">Based on simple trend estimation</div>
            </div>
            <div className="flex gap-2 pt-3">
              <Button disabled>Export CSV</Button>
              <Button variant="outline" disabled>Export PNG</Button>
            </div>
          </div>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="mt-6 rounded-lg border bg-card">
        <div className="p-6 border-b"><div className="text-xl font-semibold">Subject comparison {year !== "all" ? `(${year})` : "(avg)"}</div></div>
        <div className="p-6">
          <div className="h-[280px] w-full">
            <BarChart width={800} height={280} data={bySubject} className="max-w-full">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="subject" />
              <YAxis domain={[0, 100]} />
              <Bar dataKey="value" fill="hsl(var(--accent-foreground))" radius={[6,6,0,0]} />
            </BarChart>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
