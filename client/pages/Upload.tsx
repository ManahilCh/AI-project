import SiteLayout from "@/components/layout/SiteLayout";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { motion } from "framer-motion";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";

function parseCsv(text: string) {
  const rows: string[][] = [];
  let i = 0;
  let field = "";
  let row: string[] = [];
  let inQuotes = false;
  while (i < text.length) {
    const char = text[i];
    const next = text[i + 1];
    if (inQuotes) {
      if (char === '"' && next === '"') {
        field += '"';
        i += 2;
        continue;
      }
      if (char === '"') {
        inQuotes = false;
        i++;
        continue;
      }
      field += char;
      i++;
      continue;
    } else {
      if (char === '"') {
        inQuotes = true;
        i++;
        continue;
      }
      if (char === ',') {
        row.push(field);
        field = "";
        i++;
        continue;
      }
      if (char === '\n') {
        row.push(field);
        rows.push(row);
        row = [];
        field = "";
        i++;
        continue;
      }
      if (char === '\r') { i++; continue; }
      field += char;
      i++;
    }
  }
  row.push(field);
  if (row.length) rows.push(row);
  return rows;
}

export default function Upload() {
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [preview, setPreview] = useState<string[][]>([]);
  const [error, setError] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [insights, setInsights] = useState<{ rows: number; columns: number; nulls: number; sampleSubjects: string[] } | null>(null);

  const onFiles = useCallback(async (files: FileList | null) => {
    setError(null);
    setPreview([]);
    if (!files || !files.length) return;
    const file = files[0];
    setFileName(file.name);
    const lower = file.name.toLowerCase();
    if (lower.endsWith(".csv")) {
      const text = await file.text();
      const rows = parseCsv(text).slice(0, 51); // header + 50 rows
      setPreview(rows);
    } else if (lower.endsWith(".xlsx") || lower.endsWith(".xls")) {
      setError("Excel preview is unavailable in this demo. Please upload CSV to preview rows.");
    } else {
      setError("Unsupported file type. Please upload a CSV or Excel file.");
    }
  }, []);

  const header = useMemo(() => (preview.length ? preview[0] : []), [preview]);
  const data = useMemo(() => (preview.length > 1 ? preview.slice(1) : []), [preview]);

  return (
    <SiteLayout>
      <section className="container py-10">
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-2xl sm:text-3xl font-bold"
        >
          Upload Results (Excel/CSV)
        </motion.h2>
        <p className="mt-2 text-muted-foreground">AI Model will analyze data after upload.</p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className={"mt-6 rounded-2xl border p-8 " + (dragOver ? "border-primary" : "border-dashed")}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); onFiles(e.dataTransfer.files); }}
        >
          <div className="flex flex-col items-center text-center">
            <div className="h-16 w-16 rounded-xl bg-animated-gradient animate-float" />
            <div className="mt-4 text-lg font-semibold">Drag & drop your file here</div>
            <div className="text-sm text-muted-foreground">CSV, XLSX, or XLS</div>
            <div className="mt-4">
              <input
                id="file-input"
                type="file"
                accept=".csv,.xlsx,.xls"
                className="hidden"
                onChange={(e) => onFiles(e.target.files)}
              />
              <Button onClick={() => document.getElementById("file-input")?.click()}>Choose File</Button>
            </div>
            {fileName && (
              <div className="mt-3 text-sm text-muted-foreground">Selected: {fileName}</div>
            )}
            {error && (
              <div className="mt-3 text-sm text-destructive">{error}</div>
            )}
          </div>
        </motion.div>

        {preview.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="mt-8"
          >
            <div className="mb-2 text-sm text-muted-foreground">Preview (first 50 rows)</div>
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    {header.map((h, idx) => (
                      <TableHead key={idx}>{h || `Col ${idx + 1}`}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((row, i) => (
                    <TableRow key={i}>
                      {row.map((cell, j) => (
                        <TableCell key={j} className="truncate max-w-[200px]">{cell}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button onClick={() => {
                if (!preview.length) return;
                setAnalyzing(true);
                toast("Analyzing with AI (simulated)", { description: "Generating quick insights..." });
                setTimeout(() => {
                  const headerSet = new Set(preview[0].map((h) => (h || "").toLowerCase()));
                  const rowsCount = Math.min(50, Math.max(0, preview.length - 1));
                  const columnsCount = preview[0]?.length ?? 0;
                  let nulls = 0;
                  const sampleSubjects: string[] = [];
                  for (let i = 1; i < preview.length; i++) {
                    for (let j = 0; j < preview[i].length; j++) {
                      if (preview[i][j] === "" || preview[i][j] === undefined || preview[i][j] === null) nulls++;
                    }
                    const sIdx = preview[0].findIndex((h) => /subject/i.test(h));
                    if (sIdx >= 0 && preview[i][sIdx] && sampleSubjects.length < 4 && !sampleSubjects.includes(preview[i][sIdx])) {
                      sampleSubjects.push(preview[i][sIdx]);
                    }
                  }
                  setInsights({ rows: rowsCount, columns: columnsCount, nulls, sampleSubjects });
                  try {
                    const item = { id: `u_${Date.now()}`, fileName: file.name || "upload.csv", rows: rowsCount, uploadedAt: new Date().toISOString() };
                    const saved = JSON.parse(localStorage.getItem("ai_metric_history") || "[]");
                    const next = Array.isArray(saved) ? [...saved, item] : [item];
                    localStorage.setItem("ai_metric_history", JSON.stringify(next));
                  } catch {}
                  setAnalyzing(false);
                  toast.success("Insights ready", { description: "Scroll to view details below." });
                }, 900);
              }}>Analyze with AI</Button>
              <Button variant="outline" disabled>Upload & Train</Button>
            </div>
          </motion.div>
        )}

        {analyzing && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-8 flex items-center gap-3 text-sm text-muted-foreground">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted border-t-transparent" />
            Running AI analysis...
          </motion.div>
        )}

        {insights && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-xl border p-5">
              <div className="text-sm text-muted-foreground">Data quality</div>
              <div className="mt-2 text-2xl font-bold">{insights.rows} rows • {insights.columns} columns</div>
              <div className="text-sm">Empty cells detected: {insights.nulls}</div>
            </div>
            <div className="rounded-xl border p-5">
              <div className="text-sm text-muted-foreground">Detected subjects</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {insights.sampleSubjects.length ? insights.sampleSubjects.map((s) => (
                  <span key={s} className="rounded-full bg-accent px-3 py-1 text-sm">{s}</span>
                )) : <span className="text-sm">No subject column detected</span>}
              </div>
              <div className="mt-4 text-xs text-muted-foreground">Tip: Include columns like Year, Subject, Pass Rate, Average Score.</div>
            </div>
          </motion.div>
        )}
      </section>
    </SiteLayout>
  );
}
