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

  // Load markdown from /public/journal/day-X.md
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
    <div className="min-h-screen selection:bg-orange-100 pointer-events-auto">
      {/* Minimal Header */}
      <nav className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-slate-100 p-4">
        <div className="max-w-3xl mx-auto flex justify-between items-center">
          <Link
            href="/"
            className="text-sm font-bold text-slate-500 hover:text-orange-600 transition-colors uppercase tracking-widest"
          >
            ← Back to Map
          </Link>
          <span className="text-xs font-black text-slate-300 uppercase tracking-widest">
            Day {id}
          </span>
        </div>
      </nav>

      <article
        className="relative max-w-3xl mx-auto py-16 px-8 md:px-12 
             mt-[40vh] md:mt-10 
             mb-10 
             bg-white/90 backdrop-blur-2xl shadow-2xl rounded-[2.5rem] 
             border border-white/40"
      >
        {/* Header Section */}
        <header className=" border-b border-slate-100/50 pb-12">
          <h1 className="text-5xl md:text-7xl font-black text-slate-900 leading-[0.9] tracking-tighter italic uppercase mb-6">
            {entry.title}
          </h1>
          <div className="flex flex-wrap gap-6 text-slate-500 font-medium">
            <p>{entry.date}</p>
            <p>{entry.metrics.miles} Miles Traveled</p>
            <p>{entry.metrics.elevation}ft Climbing</p>
          </div>
        </header>
        <div
          className="prose prose-slate lg:prose-xl max-w-none 
  font-sans /* Ensures it uses the same font as your sidebar */
  prose-headings:font-black prose-headings:tracking-tighter prose-headings:italic prose-headings:uppercase
  prose-p:text-slate-700 prose-p:leading-relaxed
  prose-strong:text-orange-600 prose-strong:font-black
  prose-img:rounded-3xl prose-img:shadow-2xl
  prose-blockquote:border-l-4 prose-blockquote:border-orange-500 prose-blockquote:italic prose-blockquote:bg-slate-50 prose-blockquote:px-6 prose-blockquote:py-2"
        >
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      </article>
    </div>
  );
}
