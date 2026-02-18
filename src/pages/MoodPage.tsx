import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useToast } from "@/hooks/use-toast";

const moods = [
  { value: "great", label: "Great", gradient: "from-emerald-400/20 to-emerald-500/10", ring: "ring-emerald-400", dot: "bg-emerald-400" },
  { value: "good", label: "Good", gradient: "from-sky-400/20 to-sky-500/10", ring: "ring-sky-400", dot: "bg-sky-400" },
  { value: "okay", label: "Okay", gradient: "from-amber-400/20 to-amber-500/10", ring: "ring-amber-400", dot: "bg-amber-400" },
  { value: "low", label: "Low", gradient: "from-orange-400/20 to-orange-500/10", ring: "ring-orange-400", dot: "bg-orange-400" },
  { value: "rough", label: "Rough", gradient: "from-rose-400/20 to-rose-500/10", ring: "ring-rose-400", dot: "bg-rose-400" },
];

type MoodEntry = { mood: string; timestamp: Date; note: string };

const MoodPage = () => {
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [entries, setEntries] = useState<MoodEntry[]>([]);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { toast } = useToast();

  const logMood = () => {
    if (!selectedMood) return;
    const entry: MoodEntry = { mood: selectedMood, timestamp: new Date(), note };
    setEntries((prev) => [entry, ...prev]);
    setSelectedMood(null);
    setNote("");
    toast({ title: "Mood logged", description: `You're feeling ${entry.mood}.` });
  };

  const analyzePatterns = async () => {
    if (entries.length < 2) {
      toast({ description: "Log at least 2 moods to analyze patterns." });
      return;
    }
    setIsAnalyzing(true);
    try {
      const summary = entries
        .map((e) => `${e.mood} at ${e.timestamp.toLocaleTimeString()}${e.note ? `: ${e.note}` : ""}`)
        .join("; ");
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/panda-chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [{ role: "user", content: `Analyze my mood pattern and give brief wellness advice: ${summary}` }],
        }),
      });

      let result = "";
      const reader = resp.body?.getReader();
      const decoder = new TextDecoder();
      if (reader) {
        let buf = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          let nl: number;
          while ((nl = buf.indexOf("\n")) !== -1) {
            let line = buf.slice(0, nl);
            buf = buf.slice(nl + 1);
            if (line.endsWith("\r")) line = line.slice(0, -1);
            if (!line.startsWith("data: ")) continue;
            const json = line.slice(6).trim();
            if (json === "[DONE]") break;
            try {
              const p = JSON.parse(json);
              const c = p.choices?.[0]?.delta?.content;
              if (c) result += c;
            } catch {}
          }
        }
      }
      setAnalysis(result || "Unable to analyze at this time.");
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Could not analyze moods." });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getMood = (value: string) => moods.find((m) => m.value === value);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-10">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-foreground mb-1">How are you feeling?</h1>
          <p className="text-muted-foreground text-sm">Select what best describes your mood right now.</p>
        </div>

        {/* Mood selector - clean pill-style */}
        <div className="flex flex-wrap gap-3 mb-6">
          {moods.map((m) => (
            <motion.button
              key={m.value}
              onClick={() => setSelectedMood(m.value)}
              className={`px-5 py-3 rounded-full text-sm font-medium transition-all bg-gradient-to-br ${m.gradient} ${
                selectedMood === m.value
                  ? `ring-2 ${m.ring} shadow-md scale-105`
                  : "ring-1 ring-border hover:ring-muted-foreground/30"
              }`}
              whileTap={{ scale: 0.95 }}
            >
              <span className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${m.dot}`} />
                {m.label}
              </span>
            </motion.button>
          ))}
        </div>

        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="What's on your mind? (optional)"
          className="w-full bg-card border border-border rounded-xl p-4 text-sm resize-none h-24 mb-5 focus:outline-none focus:ring-2 focus:ring-ring transition-all"
        />

        <div className="flex gap-3 mb-10">
          <Button onClick={logMood} disabled={!selectedMood} className="rounded-full">
            Log Mood
          </Button>
          <Button onClick={analyzePatterns} variant="outline" disabled={isAnalyzing || entries.length < 2} className="rounded-full gap-2">
            <TrendingUp className="w-4 h-4" />
            {isAnalyzing ? "Analyzing..." : "Analyze Patterns"}
          </Button>
        </div>

        {/* AI Analysis */}
        <AnimatePresence>
          {analysis && (
            <motion.div
              className="bg-gradient-to-br from-mint-green/60 to-mint-green/30 rounded-2xl p-6 mb-10 border border-border"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <h3 className="font-semibold text-foreground mb-3 text-sm">Wellness Insight</h3>
              <p className="text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed">{analysis}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Timeline */}
        <h3 className="font-semibold text-foreground mb-5">Your Timeline</h3>
        <div className="space-y-0">
          {entries.length === 0 && (
            <p className="text-sm text-muted-foreground py-8 text-center">No moods logged yet. Start by selecting how you feel above.</p>
          )}
          {entries.map((e, i) => {
            const m = getMood(e.mood);
            return (
              <motion.div
                key={i}
                className="flex items-start gap-4 relative"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
              >
                {/* Timeline line */}
                <div className="flex flex-col items-center">
                  <div className={`w-3 h-3 rounded-full ${m?.dot || "bg-muted"} mt-1.5 shrink-0 z-10`} />
                  {i < entries.length - 1 && <div className="w-px flex-1 bg-border" />}
                </div>

                <div className="pb-6 flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-sm font-medium text-foreground">{m?.label}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {e.timestamp.toLocaleDateString()} · {e.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  {e.note && <p className="text-xs text-muted-foreground leading-relaxed">{e.note}</p>}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default MoodPage;
