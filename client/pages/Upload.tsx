import SiteLayout from "@/components/layout/SiteLayout";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { motion } from "framer-motion";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";

type Analysis = {
  subjects: Array<{
    subject: string;
    passRate: number;
    total: number;
    pass: number;
    fail: number;
    malePass: number;
    maleFail: number;
    femalePass: number;
    femaleFail: number;
    predictedNextYear: number | null;
  }>;
  overallPassRate: number | null;
  totalsByGender?: { male: { pass: number; fail: number }; female: { pass: number; fail: number } };
};

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

const numberFrom = (val: any) => {
  if (val == null) return undefined;
  const s = String(val).replace(/[,\s]/g, "").trim();
  if (!/\d/.test(s)) return undefined;
  const n = Number(s.replace(/[^\d.\-]/g, ""));
  return Number.isFinite(n) ? n : undefined;
};

const guessMaxForScore = (score: number) => {
  const candidates = [50, 60, 75, 80, 100, 150, 200, 500, 600, 800, 1000, 1050, 1100, 1200];
  for (const c of candidates) {
    if (score <= c) return c;
  }
  return Math.ceil(score / 100) * 100;
};

const inferGenderFromName = (name?: string) => {
  if (!name) return undefined;
  const n = name.toLowerCase().trim();
  const tokens = n.split(/\s+/);
  const first = tokens[0] || "";
  const dictMale = new Set([
    "muhammad","muhammed","mohammad","mohammed","ahmad","ahmed","ali","usman","husnain","hussain","hussein","hassan","hasan","hamza","bilal","umar","omer","umair","yasir","yasser","saad","saeed","waleed","asif","asim","faisal","amir","aamir","ameer","zain","zeeshan","salman","junaid","imran","muneeb","atif","atif","tanveer","tariq","shahid","naveed","shoaib","rashid","raheel","talha","tabish","zubair","farhan","kashif","atif","atif","sajid","majid","kamran","arsalan","arslan"
  ]);
  const dictFemale = new Set([
    "aisha","ayesha","khadija","fatima","fatimah","zainab","sara","sarah","amna","amna","amna","mahadia","hafsa","hafsah","maryam","mariam","noor","noora","sadia","saadia","iqra","mariam","hira","rimsha","sumaira","sumera","mahnoor","mehak","hina","komal","sanam","saba","saira","sana","rabia","rabiya","areeba","ishaal","ishal","bisma","saniya","sania","fariha","ayda","ayda","laiba","anaya","anam","aneela","aneesa"
  ]);
  if (first.startsWith("mr") || first === "s/o") return "male";
  if (first.startsWith("ms") || first.startsWith("mrs") || first === "d/o" || n.includes("bint")) return "female";
  if (dictMale.has(first)) return "male";
  if (dictFemale.has(first)) return "female";
  if (/\b(ali|ahmad|usman|bilal|umar|hamza|zain)\b/.test(n)) return "male";
  if (/\b(aisha|ayesha|fatima|zainab|sara|maryam|noor|hafsa)\b/.test(n)) return "female";
  if (first.endsWith("a")) return "female";
  return undefined;
};

export default function Upload() {
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string[][]>([]);
  const [error, setError] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [insights, setInsights] = useState<{ rows: number; columns: number; nulls: number; sampleSubjects: string[] } | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);

  const onFiles = useCallback(async (files: FileList | null) => {
    setError(null);
    setPreview([]);
    if (!files || !files.length) return;
    const file = files[0];
    setUploadedFile(file);
    setFileName(file.name);
    const lower = file.name.toLowerCase();
    try {
      if (lower.endsWith(".csv")) {
        const text = await file.text();
        const rows = parseCsv(text);
        setPreview(rows.slice(0, 51));
      } else if (lower.endsWith(".xlsx") || lower.endsWith(".xls")) {
        const XLSX: any = await import("xlsx/xlsx.mjs");
        const buf = await file.arrayBuffer();
        const wb = XLSX.read(buf, { type: "array" });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[];
        setPreview((rows as string[][]).slice(0, 51));
      } else if (lower.endsWith(".pdf")) {
        const pdfjs = await import("pdfjs-dist");
        // @ts-ignore
        pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
        const buf = await file.arrayBuffer();
        const doc = await pdfjs.getDocument({ data: buf }).promise;
        let text = "";
        for (let p = 1; p <= doc.numPages; p++) {
          const page = await doc.getPage(p);
          const content = await page.getTextContent();
          const pageText = (content.items as any[]).map((it: any) => it.str).join(" ");
          text += "\n" + pageText;
        }
        const lines = text.split(/\n+/).map((l) => l.trim()).filter(Boolean);
        const rows = lines.map((l) => (l.includes(",") ? l.split(",") : l.split(/\s{2,}|\t+/))).filter((r) => r.length > 1);
        if (rows.length > 1) setPreview(rows.slice(0, 51));
        else setError("Could not detect a table in this PDF. Please upload CSV/Excel.");
      } else {
        setError("Unsupported file type. Please upload a CSV, Excel, or PDF file.");
      }
    } catch (e) {
      console.error(e);
      setError("Failed to parse file. Please ensure the file is formatted correctly.");
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
          className={"mt-6 rounded-2xl border p-8 " + (dragOver ? "border-primary animate-pulse" : "border-dashed")}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); onFiles(e.dataTransfer.files); }}
        >
          <div className="flex flex-col items-center text-center">
            <div className="h-16 w-16 rounded-xl bg-animated-gradient animate-float" />
            <div className="mt-4 text-lg font-semibold">Drag & drop your file here</div>
            <div className="text-sm text-muted-foreground">CSV, XLSX, XLS, or PDF</div>
            <div className="mt-4">
              <input
                id="file-input"
                type="file"
                accept=".csv,.xlsx,.xls,.pdf"
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
                toast("Analyzing...", { description: "Computing subject-wise pass rates and predictions" });
                (async () => {
                  try {
                    let rows: string[][] = preview;
                    if (uploadedFile) {
                      const lower = uploadedFile.name.toLowerCase();
                      if (lower.endsWith(".csv")) {
                        rows = parseCsv(await uploadedFile.text());
                      } else if (lower.endsWith(".xlsx") || lower.endsWith(".xls")) {
                        const XLSX: any = await import("xlsx/xlsx.mjs");
                        const buf = await uploadedFile.arrayBuffer();
                        const wb = XLSX.read(buf, { type: "array" });
                        const sheet = wb.Sheets[wb.SheetNames[0]];
                        rows = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any;
                      } else if (lower.endsWith(".pdf")) {
                        const pdfjs = await import("pdfjs-dist");
                        // @ts-ignore
                        pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
                        const buf = await uploadedFile.arrayBuffer();
                        const doc = await pdfjs.getDocument({ data: buf }).promise;
                        let text = "";
                        for (let p = 1; p <= doc.numPages; p++) {
                          const page = await doc.getPage(p);
                          const content = await page.getTextContent();
                          const pageText = (content.items as any[]).map((it: any) => it.str).join(" ");
                          text += "\n" + pageText;
                        }
                        const lines = text.split(/\n+/).map((l) => l.trim()).filter(Boolean);
                        rows = lines.map((l) => (l.includes(",") ? l.split(",") : l.split(/\s{2,}|\t+/))).filter((r) => r.length > 1);
                      }
                    }

                    if (!rows.length) throw new Error("No rows detected");

                    const headerRow = rows[0].map((h) => String(h || "").trim());
                    const findCol = (...patterns: RegExp[]) => headerRow.findIndex((h) => patterns.some((re) => re.test(h.toLowerCase())));
                    const idxSubject = findCol(/subject/);
                    const idxYear = findCol(/year/);
                    const idxGender = findCol(/gender/, /sex/);
                    const idxName = findCol(/name/, /student/);
                    const idxPass = findCol(/pass/, /status/, /result/);
                    const idxScore = findCol(/score/, /marks/, /obtained/, /percentage/, /percent/);
                    const idxMax = findCol(/out\s*of/, /max(?:imum)?/, /full\s*marks/, /total\s*marks/, /\btotal\b/);

                    type Row = { subject?: string; year?: number; gender?: string; pass?: boolean; score?: number };
                    const norm = (val: any) => String(val ?? "").trim();
                    const rowsData: Row[] = rows.slice(1).map((r) => {
                      const subject = idxSubject >= 0 ? norm(r[idxSubject]) : undefined;
                      const yearStr = idxYear >= 0 ? norm(r[idxYear]) : undefined;
                      const year = yearStr && /\d{4}/.test(yearStr) ? Number(yearStr.match(/\d{4}/)![0]) : undefined;
                      const genderCol = idxGender >= 0 ? norm(r[idxGender]).toLowerCase() : undefined;
                      const nameCol = idxName >= 0 ? norm(r[idxName]) : undefined;
                      let gender = genderCol;
                      if (!gender) gender = inferGenderFromName(nameCol);
                      const passRaw = idxPass >= 0 ? norm(r[idxPass]).toLowerCase() : undefined;

                      let pass: boolean | undefined = undefined;
                      if (passRaw) {
                        if (/^(pass|passed|p|1|true|yes)$/i.test(passRaw)) pass = true;
                        else if (/^(fail|failed|f|0|false|no)$/i.test(passRaw)) pass = false;
                      }

                      let score: number | undefined = undefined;
                      let percent: number | undefined = undefined;
                      if (idxScore >= 0) {
                        const raw = norm(r[idxScore]);
                        const n = numberFrom(raw);
                        if (n != null) {
                          if (/percent|percentage|%/i.test(headerRow[idxScore] || "") || /%/.test(raw)) {
                            percent = n > 1 ? n : n * 100;
                          } else {
                            score = n;
                          }
                        }
                      }
                      let maxMarks: number | undefined = undefined;
                      if (idxMax >= 0) {
                        const n = numberFrom(r[idxMax]);
                        if (n && n > 0) maxMarks = n;
                      }

                      if (percent == null && score != null) {
                        const m = maxMarks ?? guessMaxForScore(score);
                        percent = (score / m) * 100;
                      }

                      if (pass == null && percent != null) {
                        pass = percent >= 33;
                      }

                      return { subject, year, gender, pass, score: percent ?? score };
                    }).filter((r) => r.subject);

                    const subjMap = new Map<string, any>();
                    let maleTotalPass = 0, maleTotalFail = 0, femaleTotalPass = 0, femaleTotalFail = 0;
                    for (const r of rowsData) {
                      const s = r.subject! || "Overall";
                      if (!subjMap.has(s)) subjMap.set(s, { total: 0, pass: 0, fail: 0, malePass: 0, maleFail: 0, femalePass: 0, femaleFail: 0, yearly: new Map<number, { total: number; pass: number }>() });
                      const m = subjMap.get(s);
                      m.total += 1;
                      if (r.pass === true) m.pass += 1; else if (r.pass === false) m.fail += 1;
                      const g = (r.gender || "").toLowerCase();
                      if (g.startsWith("m")) { if (r.pass) { m.malePass += 1; maleTotalPass += 1; } else { m.maleFail += 1; maleTotalFail += 1; } }
                      else if (g.startsWith("f")) { if (r.pass) { m.femalePass += 1; femaleTotalPass += 1; } else { m.femaleFail += 1; femaleTotalFail += 1; } }
                      if (r.year) {
                        if (!m.yearly.has(r.year)) m.yearly.set(r.year, { total: 0, pass: 0 });
                        const y = m.yearly.get(r.year)!; y.total += 1; if (r.pass) y.pass += 1;
                      }
                    }

                    const subjects = Array.from(subjMap.entries()).map(([subject, m]) => {
                      const passRate = m.total ? Math.round((m.pass / m.total) * 1000) / 10 : 0;
                      const years = Array.from(m.yearly.keys()).sort((a: number, b: number) => a - b);
                      let predictedNextYear: number | null = null;
                      if (years.length >= 2) {
                        const last = years[years.length - 1];
                        const prev = years[years.length - 2];
                        const prLast = Math.round((m.yearly.get(last)!.pass / m.yearly.get(last)!.total) * 1000) / 10;
                        const prPrev = Math.round((m.yearly.get(prev)!.pass / m.yearly.get(prev)!.total) * 1000) / 10;
                        const slope = prLast - prPrev;
                        predictedNextYear = Math.max(0, Math.min(100, Math.round((prLast + slope) * 10) / 10));
                      }
                      return { subject, passRate, total: m.total, pass: m.pass, fail: m.fail, malePass: m.malePass, maleFail: m.maleFail, femalePass: m.femalePass, femaleFail: m.femaleFail, predictedNextYear };
                    }).sort((a, b) => b.passRate - a.passRate);

                    const totals = subjects.reduce((acc, s) => { acc.total += s.total; acc.pass += s.pass; return acc; }, { total: 0, pass: 0 });
                    const overallPassRate = totals.total ? Math.round((totals.pass / totals.total) * 1000) / 10 : null;

                    setAnalysis({ subjects, overallPassRate, totalsByGender: { male: { pass: maleTotalPass, fail: maleTotalFail }, female: { pass: femaleTotalPass, fail: femaleTotalFail } } });

                    const rowsCount = Math.max(0, rows.length - 1);
                    const columnsCount = rows[0]?.length ?? 0;
                    const sampleSubjects: string[] = [];
                    for (let i = 1; i < rows.length; i++) {
                      const sIdx = rows[0].findIndex((h) => /subject/i.test(String(h)));
                      if (sIdx >= 0 && rows[i][sIdx] && sampleSubjects.length < 4 && !sampleSubjects.includes(String(rows[i][sIdx]))) {
                        sampleSubjects.push(String(rows[i][sIdx]));
                      }
                    }
                    setInsights({ rows: rowsCount, columns: columnsCount, nulls: 0, sampleSubjects });

                    try {
                      const item = { id: `u_${Date.now()}`, fileName: uploadedFile?.name || "upload", rows: rowsCount, uploadedAt: new Date().toISOString() };
                      const saved = JSON.parse(localStorage.getItem("ai_metric_history") || "[]");
                      const next = Array.isArray(saved) ? [...saved, item] : [item];
                      localStorage.setItem("ai_metric_history", JSON.stringify(next));
                    } catch {}

                    toast.success("Analysis complete");
                  } catch (err) {
                    console.error(err);
                    toast.error("Analysis failed", { description: (err as Error).message });
                  } finally {
                    setAnalyzing(false);
                  }
                })();
              }}>Analyze with AI</Button>
              <Button variant="outline" onClick={() => {
                const sample = [
                  ["Year","Subject","Student Name","Gender","Marks Obtained","Out of","Result"],
                  ["2024","Math","Muhammad Ali","Male","72","100","Pass"],
                  ["2024","Math","Ayesha Khan","Female","81","100","Pass"],
                  ["2024","Science","Usman Tariq","","68","100","Pass"],
                  ["2024","Science","Fatima Noor","","64","100","Pass"],
                  ["2024","English","Bilal Ahmed","Male","59","100","Pass"],
                  ["2024","English","Maryam Iqbal","Female","62","100","Pass"],
                  ["2023","Math","Hamza Sheikh","Male","45","100","Fail"],
                  ["2023","Math","Zainab Hussain","Female","55","100","Pass"],
                  ["2023","Science","Imran Aslam","Male","49","100","Fail"],
                  ["2023","Science","Sara Ali","Female","70","100","Pass"],
                  ["2023","English","Umar Farooq","Male","52","100","Pass"],
                  ["2023","English","Noor Fatima","Female","66","100","Pass"],
                  ["2025","Computer","Hassan Raza","Male","78","100","Pass"],
                  ["2025","Computer","Laiba Anwar","Female","82","100","Pass"],
                  ["2025","Math","Junaid Saleem","Male","61","100","Pass"],
                  ["2025","Science","Anaya Siddiqui","Female","58","100","Pass"],
                  ["2025","English","Omer Zafar","Male","47","100","Fail"],
                  ["2025","English","Hafsa Tariq","","73","100","Pass"],
                  ["2024","Computer","Sana Qureshi","Female","69","100","Pass"],
                  ["2024","Computer","Shahid Mehmood","Male","62","100","Pass"],
                ];
                setPreview(sample as string[][]);
                setFileName("sample_results.csv");
                setUploadedFile(null);
                setError(null);
                toast.success("Loaded sample data", { description: "Use Analyze with AI to view insights." });
              }}>Load Sample Data</Button>
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

        {(insights || analysis) && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="mt-8 grid grid-cols-1 gap-4">
            {insights && (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
                  <div className="mt-4 text-xs text-muted-foreground">Tip: Include columns like Year, Subject, Result/Status, Gender, Score.</div>
                </div>
              </div>
            )}

            {analysis && (
              <div className="rounded-xl border p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-muted-foreground">Overall pass rate</div>
                    <div className="text-2xl font-bold">{analysis.overallPassRate ?? 0}%</div>
                  </div>
                  {analysis.totalsByGender && (
                    <div className="flex gap-3">
                      <div className="rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300 px-3 py-2 text-xs">
                        Male: {analysis.totalsByGender.male.pass} pass / {analysis.totalsByGender.male.fail} fail
                      </div>
                      <div className="rounded-lg bg-pink-50 text-pink-700 dark:bg-pink-500/10 dark:text-pink-300 px-3 py-2 text-xs">
                        Female: {analysis.totalsByGender.female.pass} pass / {analysis.totalsByGender.female.fail} fail
                      </div>
                    </div>
                  )}
                </div>
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="p-2 text-left">Subject</th>
                        <th className="p-2 text-left">Pass %</th>
                        <th className="p-2 text-left">Male Pass</th>
                        <th className="p-2 text-left">Male Fail</th>
                        <th className="p-2 text-left">Female Pass</th>
                        <th className="p-2 text-left">Female Fail</th>
                        <th className="p-2 text-left">Total</th>
                        <th className="p-2 text-left">Pred. Next Year</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analysis.subjects.map((s) => (
                        <tr key={s.subject} className="border-b hover:bg-muted/50">
                          <td className="p-2">{s.subject}</td>
                          <td className="p-2">{s.passRate}%</td>
                          <td className="p-2">{s.malePass}</td>
                          <td className="p-2">{s.maleFail}</td>
                          <td className="p-2">{s.femalePass}</td>
                          <td className="p-2">{s.femaleFail}</td>
                          <td className="p-2">{s.total}</td>
                          <td className="p-2">{s.predictedNextYear ?? "-"}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </section>
    </SiteLayout>
  );
}
