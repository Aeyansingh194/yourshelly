import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Calendar, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useToast } from "@/hooks/use-toast";

type Entry = { text: string; title: string; date: Date };

const JournalPage = () => {
  const [text, setText] = useState("");
  const [title, setTitle] = useState("");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedEntry, setExpandedEntry] = useState<number | null>(null);
  const { toast } = useToast();

  const save = () => {
    if (!text.trim()) return;
    setEntries((prev) => [
      { text: text.trim(), title: title.trim() || `Entry - ${new Date().toLocaleDateString()}`, date: new Date() },
      ...prev,
    ]);
    setText("");
    setTitle("");
    toast({ title: "Entry saved 📝", description: "Your diary entry has been saved." });
  };

  const deleteEntry = (index: number) => {
    setEntries((prev) => prev.filter((_, i) => i !== index));
    toast({ title: "Entry deleted", description: "Your diary entry has been removed." });
  };

  const filteredEntries = entries.filter(
    (e) =>
      e.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (d: Date) => {
    const day = d.getDate();
    const month = d.toLocaleString("default", { month: "short" });
    const year = d.getFullYear();
    const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    return { day, month, year, time };
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="flex-1 max-w-3xl mx-auto w-full px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-1 flex items-center gap-3">
            <BookOpen className="w-7 h-7 text-primary" />
            My Diary
          </h1>
          <p className="text-muted-foreground">A private space to write down your thoughts, feelings, and reflections.</p>
        </div>

        {/* Writing area */}
        <motion.div
          className="bg-card border border-border rounded-2xl p-6 mb-8 shadow-sm"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Give this entry a title..."
            className="border-none bg-transparent text-lg font-semibold placeholder:text-muted-foreground/50 focus-visible:ring-0 px-0 mb-3"
          />
          <div className="w-full h-px bg-border mb-4" />
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Dear Diary, today I feel..."
            className="w-full bg-transparent text-sm resize-none min-h-[200px] focus:outline-none leading-relaxed text-foreground placeholder:text-muted-foreground/40"
          />
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
            <span className="text-xs text-muted-foreground">
              {text.length} characters · {text.trim().split(/\s+/).filter(Boolean).length} words
            </span>
            <Button onClick={save} disabled={!text.trim()} className="rounded-full gap-2">
              <BookOpen className="w-4 h-4" /> Save Entry
            </Button>
          </div>
        </motion.div>

        {/* Past entries */}
        {entries.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground text-lg">
                Past Entries ({entries.length})
              </h3>
              <div className="relative w-48">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search entries..."
                  className="pl-9 rounded-full text-xs h-9"
                />
              </div>
            </div>

            <AnimatePresence>
              {filteredEntries.map((e, i) => {
                const d = formatDate(e.date);
                const isExpanded = expandedEntry === i;
                return (
                  <motion.div
                    key={e.date.getTime()}
                    className="bg-card rounded-2xl border border-border mb-3 overflow-hidden cursor-pointer hover:shadow-sm transition-shadow"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    onClick={() => setExpandedEntry(isExpanded ? null : i)}
                  >
                    <div className="flex items-start gap-4 p-5">
                      {/* Date badge */}
                      <div className="bg-muted rounded-xl px-3 py-2 text-center shrink-0 min-w-[52px]">
                        <span className="text-lg font-bold text-foreground block leading-tight">{d.day}</span>
                        <span className="text-[10px] uppercase text-muted-foreground font-medium">{d.month}</span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-foreground text-sm mb-1">{e.title}</h4>
                        <p className={`text-xs text-muted-foreground ${isExpanded ? "whitespace-pre-wrap" : "line-clamp-2"}`}>
                          {e.text}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] text-muted-foreground">{d.time}</span>
                        <button
                          onClick={(ev) => { ev.stopPropagation(); deleteEntry(i); }}
                          className="text-muted-foreground hover:text-destructive transition-colors p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {filteredEntries.length === 0 && searchQuery && (
              <p className="text-sm text-muted-foreground text-center py-8">No entries matching "{searchQuery}"</p>
            )}
          </div>
        )}

        {entries.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <Calendar className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="text-sm">Your diary is empty. Start writing your first entry above.</p>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default JournalPage;
