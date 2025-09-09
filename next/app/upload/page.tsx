"use client";
import { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { Button } from "../../components/ui/button";

function parseCsv(text: string) {
  const rows: string[][] = [];
  let i = 0; let field = ""; let row: string[] = []; let inQuotes = false;
  while (i < text.length) {
    const char = text[i]; const next = text[i + 1];
    if (inQuotes) {
      if (char === '"' && next === '"') { field += '"'; i += 2; continue; }
      if (char === '"') { inQuotes = false; i++; continue; }
      field += char; i++; continue;
    } else {
      if (char === '"') { inQuotes = true; i++; continue; }
      if (char === ',') { row.push(field); field = ""; i++; continue; }
      if (char === '\n') { row.push(field); rows.push(row); row = []; field = ""; i++; continue; }
      if (char === '\r') { i++; continue; }
      field += char; i++;
    }
  }
  row.push(field); if (row.length) rows.push(row); return rows;
}

export default function UploadPage() {
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [preview, setPreview] = useState<string[][]>([]);
  const [error, setError] = useState<string | null>(null);

  const onFiles = useCallback(async (files: FileList | null) => {
    setError(null); setPreview([]);
    if (!files || !files.length) return;
    const file = files[0]; setFileName(file.name);
    const lower = file.name.toLowerCase();
    if (lower.endsWith(".csv")) {
      const text = await file.text(); const rows = parseCsv(text).slice(0, 51); setPreview(rows);
    } else if (lower.endsWith(".xlsx") || lower.endsWith(".xls")) {
      setError("Excel preview is unavailable in this demo. Please upload CSV to preview rows.");
    } else { setError("Unsupported file type. Please upload a CSV or Excel file."); }
  }, []);

  const header = useMemo(() => (preview.length ? preview[0] : []), [preview]);
  const data = useMemo(() => (preview.length > 1 ? preview.slice(1) : []), [preview]);

  return (
    <section className="container mx-auto px-4 py-10">
      <motion.h2 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="text-2xl sm:text-3xl font-bold">
        Upload Results (Excel/CSV)
      </motion.h2>
      <p className="mt-2 text-muted-foreground">AI Model will analyze data after upload.</p>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className={"mt-6 rounded-2xl border p-8 " + (dragOver ? "border-primary" : "border-dashed")} onDragOver={(e) => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={(e) => { e.preventDefault(); setDragOver(false); onFiles(e.dataTransfer.files); }}>
        <div className="flex flex-col items-center text-center">
          <div className="h-16 w-16 rounded-xl bg-animated-gradient animate-float" />
          <div className="mt-4 text-lg font-semibold">Drag & drop your file here</div>
          <div className="text-sm text-muted-foreground">CSV, XLSX, or XLS</div>
          <div className="mt-4">
            <input id="file-input" type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={(e) => onFiles(e.target.files)} />
            <Button onClick={() => document.getElementById("file-input")?.click()}>Choose File</Button>
          </div>
          {fileName && (<div className="mt-3 text-sm text-muted-foreground">Selected: {fileName}</div>)}
          {error && (<div className="mt-3 text-sm text-destructive">{error}</div>)}
        </div>
      </motion.div>

      {preview.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }} className="mt-8 overflow-auto">
          <div className="mb-2 text-sm text-muted-foreground">Preview (first 50 rows)</div>
          <div className="min-w-[640px] rounded-lg border">
            <table className="w-full text-sm">
              <thead><tr className="border-b bg-muted/50">{header.map((h, i) => (<th key={i} className="p-3 text-left font-medium text-muted-foreground">{h || `Col ${i+1}`}</th>))}</tr></thead>
              <tbody>
                {data.map((row, i) => (
                  <tr key={i} className="border-b hover:bg-muted/50">
                    {row.map((cell, j) => (<td key={j} className="p-3 align-middle max-w-[240px] truncate">{cell}</td>))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-6 flex gap-3">
            <Button>Analyze with AI</Button>
            <Button variant="outline" disabled>Upload & Train</Button>
          </div>
        </motion.div>
      )}
    </section>
  );
}
