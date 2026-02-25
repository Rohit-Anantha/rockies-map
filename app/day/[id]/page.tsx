import fs from "fs";
import path from "path";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import Link from "next/link";
import { journalEntries } from "../../components/journal";

export default async function DayDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const entry = journalEntries[id];

  if (!entry) notFound();

  const filePath = path.join(
    process.cwd(),
    "public",
    "journal",
    `day-${id}.md`,
  );
  let content = "";
  try {
    content = fs.readFileSync(filePath, "utf8");
  } catch (e) {
    content = "Writing in progress... check back soon!";
  }

  return (
    <div className="min-h-screen selection:bg-orange-100 pointer-events-auto font-sans">
      {/* 1. Branded Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 p-4 md:p-6 pointer-events-none">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <Link
            href="/"
            className="pointer-events-auto bg-white/90 backdrop-blur-md px-5 py-2.5 rounded-full text-xs font-black text-slate-900 shadow-xl border border-slate-200 hover:text-orange-600 transition-all hover:scale-105 uppercase tracking-widest flex items-center gap-2"
          >
            <span className="text-lg">←</span> Back to Map
          </Link>
          <div className="bg-orange-600 px-4 py-2 rounded-full shadow-lg pointer-events-auto">
            <span className="text-xs font-black text-white uppercase tracking-widest">
              Day {id}
            </span>
          </div>
        </div>
      </nav>

      {/* 2. Main Article Card */}
      <article
        className="relative max-w-3xl mx-auto py-16 px-8 md:px-12 
             mt-[45vh] md:mt-24 
             mb-20 
             bg-white/95 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] rounded-[2.5rem] 
             border border-white/40"
      >
        {/* 3. Branded Header - High Contrast */}
        <header className="border-b-4 border-slate-900 pb-10 mb-10">
          <h1 className="text-5xl md:text-8xl font-black text-slate-900 leading-[0.85] tracking-tighter italic uppercase mb-8">
            {entry.title}
          </h1>

          <div className="flex flex-wrap gap-4">
            <div className="bg-slate-900 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest">
              {entry.date}
            </div>
            <div className="bg-orange-100 text-orange-700 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest">
              {entry.metrics.miles} Mi
            </div>
            <div className="bg-slate-100 text-slate-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest">
              {entry.metrics.elevation.toLocaleString()} Ft Climb
            </div>
          </div>
        </header>
        {/* 4. Markdown Content - Typography Unified */}
        <div
          className="prose prose-slate lg:prose-xl max-w-none 
    /* Force the body and heading text to our foreground variable */
    prose-p:text-foreground prose-headings:text-foreground
    prose-headings:font-black prose-headings:italic prose-headings:uppercase
    prose-strong:text-brand-orange prose-strong:font-black
    /* Standard layout */
    prose-img:rounded-3xl prose-img:shadow-2xl"
        >
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
        <footer className="mt-16 pt-8 border-t border-slate-100 flex justify-between items-center">
          <div className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.2em]">
            End of Day {id}
          </div>
          <Link
            href={`/day/${Number(id) + 1}`}
            className="group text-slate-900 font-black italic uppercase tracking-tighter text-2xl flex items-center gap-2"
          >
            Next Day{" "}
            <span className="group-hover:translate-x-2 transition-transform">
              →
            </span>
          </Link>
        </footer>
      </article>
    </div>
  );
}
