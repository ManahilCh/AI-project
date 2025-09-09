"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "../components/ui/button";

export default function Page() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-animated-gradient" />
      <div className="relative">
        <div className="container mx-auto flex min-h-[70vh] flex-col items-center justify-center py-20 text-center text-white px-4">
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight drop-shadow-lg">
            AI Metric FSD Result Predictor (2021–2025)
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="mt-4 max-w-2xl text-sm sm:text-base md:text-lg text-white/90">
            Upload your results to visualize trends and preview AI-driven predictions and insights.
          </motion.p>
          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.35 }} className="mt-8">
            <Button size="lg" className="shadow-xl" asChild>
              <Link href="/upload">Upload Results (Excel/CSV)</Link>
            </Button>
          </motion.div>
          <div className="mt-12 grid w-full max-w-5xl grid-cols-1 gap-4 md:grid-cols-3">
            {["Year-wise trends", "AI predictions", "Export & history"].map((label, i) => (
              <motion.div key={label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 + i * 0.1 }} className="rounded-xl border border-white/20 bg-white/10 p-5 text-left backdrop-blur-md">
                <div className="text-sm uppercase tracking-wider text-white/70">Feature</div>
                <div className="mt-1 text-lg font-semibold">{label}</div>
                <div className="mt-2 text-sm text-white/80">Smooth animations, interactive filters, and a modern dashboard experience.</div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
