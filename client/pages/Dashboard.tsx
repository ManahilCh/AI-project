import SiteLayout from "@/components/layout/SiteLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Line, LineChart, XAxis, YAxis, CartesianGrid, Bar, BarChart } from "recharts";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { MOCK_DATA, SUBJECTS, YEARS, type MetricKey, MOCK_UPLOAD_HISTORY } from "@/lib/mock";
import { toCSV, downloadTextFile } from "@/lib/export";
import { toast } from "sonner";

export default function Dashboard() {
  const [year, setYear] = useState<string>("all");
  const [subject, setSubject] = useState<string>("all");
  const [metric, setMetric] = useState<MetricKey>("passRate");
  const [performance, setPerformance] = useState<string>("all");
  const [history, setHistory] = useState([...MOCK_UPLOAD_HISTORY]);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("ai_metric_history") || "[]");
      if (Array.isArray(saved)) setHistory([...MOCK_UPLOAD_HISTORY, ...saved]);
    } catch {}
  }, []);

  const filtered = useMemo(() => {
    return MOCK_DATA.filter((d) => (year === "all" ? true : d.year === Number(year)) && (subject === "all" ? true : d.subject === subject))
      .filter((d) => {
        const val = d[metric];
        if (performance === "high") return val >= 80;
        if (performance === "medium") return val >= 70 && val < 80;
        if (performance === "low") return val < 70;
        return true;
      });
  }, [year, subject, performance, metric]);

  const byYear = useMemo(() => {
    const map = new Map<number, { year: number; value: number; count: number }>();
    for (const d of MOCK_DATA.filter((d) => (subject === "all" ? true : d.subject === subject))) {
      const key = d.year;
      if (!map.has(key)) map.set(key, { year: d.year, value: 0, count: 0 });
      const m = map.get(key)!;
      m.value += d[metric];
      m.count += 1;
    }
    return Array.from(map.values())
      .map((v) => ({ year: v.year, value: Math.round((v.value / v.count) * 10) / 10 }))
      .sort((a, b) => a.year - b.year);
  }, [subject, metric]);

  const bySubject = useMemo(() => {
    const map = new Map<string, { subject: string; value: number; count: number }>();
    for (const d of filtered) {
      const key = d.subject;
      if (!map.has(key)) map.set(key, { subject: d.subject, value: 0, count: 0 });
      const m = map.get(key)!;
      m.value += d[metric];
      m.count += 1;
    }
    return Array.from(map.values()).map((v) => ({ subject: v.subject, value: Math.round((v.value / v.count) * 10) / 10 }));
  }, [filtered, metric]);

  const lastTwo = byYear.slice(-2);
  const trend = lastTwo.length === 2 ? Math.round((lastTwo[1].value - lastTwo[0].value) * 10) / 10 : 0;
  const bestSubject = useMemo(() => {
    let best = { subject: "-", value: -Infinity } as { subject: string; value: number };
    for (const s of SUBJECTS) {
      const vals = MOCK_DATA.filter((d) => d.subject === s && (year === "all" ? true : d.year === Number(year))).map((d) => d[metric]);
      if (!vals.length) continue;
      const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
      if (avg > best.value) best = { subject: s, value: Math.round(avg * 10) / 10 };
    }
    return best;
  }, [year, metric]);

  return (
    <SiteLayout>
      <section className="container py-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Results Dashboard</h2>
            <p className="text-muted-foreground">Interactive trends (2021–2025) with filters, predictions and insights.</p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Year" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                {YEARS.map((y) => (<SelectItem key={y} value={String(y)}>{y}</SelectItem>))}
              </SelectContent>
            </Select>
            <Select value={subject} onValueChange={setSubject}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Subject" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subjects</SelectItem>
                {SUBJECTS.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}
              </SelectContent>
            </Select>
            <Select value={metric} onValueChange={(v) => setMetric(v as MetricKey)}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Metric" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="passRate">Pass Rate (%)</SelectItem>
                <SelectItem value="avgScore">Average Score</SelectItem>
              </SelectContent>
            </Select>
            <Select value={performance} onValueChange={setPerformance}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Performance" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All performance</SelectItem>
                <SelectItem value="high">High (≥ 80)</SelectItem>
                <SelectItem value="medium">Medium (70–79)</SelectItem>
                <SelectItem value="low">Low (&lt; 70)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </motion.div>

        <Tabs defaultValue="overview" className="mt-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>
          <TabsContent value="overview">
            <div className="mt-4 grid grid-cols-1 gap-6 xl:grid-cols-3">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="xl:col-span-2">
                <Card className="overflow-hidden">
                  <CardHeader>
                    <CardTitle>Year-wise Trend ({metric === "passRate" ? "Pass Rate %" : "Average Score"})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer
                      config={{
                        series: { label: "Value", color: "hsl(var(--primary))" },
                      }}
                      className="h-[320px]"
                    >
                      <LineChart data={byYear}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="year" tickMargin={8} />
                        <YAxis domain={[0, 100]} tickMargin={8} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <ChartLegend content={<ChartLegendContent />} />
                        <Line type="monotone" dataKey="value" name="series" stroke="var(--color-series)" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ChartContainer>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.05 }}>
                <Card>
                  <CardHeader>
                    <CardTitle>AI Predictions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="text-muted-foreground">Simulated</div>
                    <div className="rounded-lg border p-3">
                      <div className="font-medium">Next-year {metric === "passRate" ? "Pass Rate" : "Average Score"}</div>
                      <div className="mt-1 text-2xl font-extrabold">{Math.round((byYear.at(-1)?.value ?? 70) + (trend || 1))}%</div>
                      <div className="text-xs text-muted-foreground">Based on simple trend estimation</div>
                    </div>
                    <ul className="list-disc pl-5 text-sm">
                      <li>Trend: {trend > 0 ? "+" : ""}{trend}% vs last period</li>
                      <li>Best subject: {bestSubject.subject} ({bestSubject.value}{metric === "passRate" ? "%" : ""})</li>
                    </ul>
                    <div className="flex gap-2 pt-2">
                      <Button onClick={() => {
                        const csv = toCSV(byYear.map((d) => ({ year: d.year, value: d.value })));
                        downloadTextFile(`trend_${metric}.csv`, csv, "text/csv;charset=utf-8");
                        toast.success("Exported CSV", { description: "Year-wise trend downloaded." });
                      }}>Export CSV</Button>
                      <Button variant="outline" disabled className="cursor-not-allowed">Export PNG</Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Subject comparison {year !== "all" ? `(${year})` : "(avg)"}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={{ value: { label: "Value", color: "hsl(var(--accent))" } }} className="h-[280px]">
                    <BarChart data={bySubject}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="subject" tickMargin={8} />
                      <YAxis domain={[0, 100]} tickMargin={8} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="value" name="value" fill="var(--color-value)" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="history">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {history.map((h) => (
                <motion.div key={h.id} whileHover={{ y: -3 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">{h.fileName}</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground">
                      <div>Rows: {h.rows}</div>
                      <div>Uploaded: {new Date(h.uploadedAt).toLocaleString()}</div>
                      <div className="pt-3">
                        <Button variant="outline" size="sm" disabled>Re-run Analysis</Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </TabsContent>
        </Tabs>
      </section>
    </SiteLayout>
  );
}
