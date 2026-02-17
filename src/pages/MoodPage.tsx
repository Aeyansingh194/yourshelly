import { useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Smile, Frown, Meh, AlertTriangle, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const moods = [
  { emoji: "😊", label: "Happy", color: "bg-soft-yellow", icon: <Smile className="w-5 h-5" /> },
  { emoji: "😐", label: "Neutral", color: "bg-muted", icon: <Meh className="w-5 h-5" /> },
  { emoji: "😢", label: "Sad", color: "bg-soft-blue", icon: <Frown className="w-5 h-5" /> },
  { emoji: "😰", label: "Stressed", color: "bg-peach", icon: <AlertTriangle className="w-5 h-5" /> },
  { emoji: "😟", label: "Anxious", color: "bg-calm-lavender", icon: <Brain className="w-5 h-5" /> },
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
    toast({ title: "Mood logged!", description: `You're feeling ${entry.mood}.` });
  };

  const analyzePatterns = async () => {
    if (entries.length < 2) {
      toast({ description: "Log at least 2 moods to analyze patterns." });
      return;
    }
    setIsAnalyzing(true);
    try {
      const summary = entries.map((e) => `${e.mood} at ${e.timestamp.toLocaleTimeString()}${e.note ? `: ${e.note}` : ""}`).join("; ");
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

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-8">
        <h1 className="text-2xl font-bold text-foreground mb-2">Mood Tracker</h1>
        <p className="text-sm text-muted-foreground mb-8">Track your emotions and get AI-powered insights.</p>

        {/* Mood Selector */}
        <div className="grid grid-cols-5 gap-3 mb-6">
          {moods.map((m) => (
            <motion.button
              key={m.label}
              onClick={() => setSelectedMood(m.label)}
              className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                selectedMood === m.label ? "border-primary shadow-md" : "border-transparent"
              } ${m.color}`}
              whileTap={{ scale: 0.95 }}
            >
              <span className="text-2xl">{m.emoji}</span>
              <span className="text-xs font-medium text-foreground">{m.label}</span>
            </motion.button>
          ))}
        </div>

        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Add a note about how you feel (optional)..."
          className="w-full bg-card border border-border rounded-2xl p-4 text-sm resize-none h-20 mb-4 focus:outline-none focus:ring-2 focus:ring-ring"
        />

        <div className="flex gap-3 mb-8">
          <Button onClick={logMood} disabled={!selectedMood} className="rounded-full">
            Log Mood
          </Button>
          <Button onClick={analyzePatterns} variant="outline" disabled={isAnalyzing} className="rounded-full">
            <TrendingUp className="w-4 h-4 mr-2" />
            {isAnalyzing ? "Analyzing..." : "Analyze Patterns"}
          </Button>
        </div>

        {/* AI Analysis */}
        {analysis && (
          <motion.div
            className="bg-mint-green rounded-2xl p-6 mb-8"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h3 className="font-semibold text-foreground mb-2">🐼 Panda's Analysis</h3>
            <p className="text-sm text-foreground whitespace-pre-wrap">{analysis}</p>
          </motion.div>
        )}

        {/* History */}
        <h3 className="font-semibold text-foreground mb-4">Recent Moods</h3>
        <div className="space-y-3">
          {entries.length === 0 && <p className="text-sm text-muted-foreground">No moods logged yet.</p>}
          {entries.map((e, i) => (
            <div key={i} className="bg-card rounded-2xl p-4 border border-border flex items-center gap-3">
              <span className="text-xl">{moods.find((m) => m.label === e.mood)?.emoji}</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{e.mood}</p>
                {e.note && <p className="text-xs text-muted-foreground">{e.note}</p>}
              </div>
              <span className="text-xs text-muted-foreground">{e.timestamp.toLocaleTimeString()}</span>
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default MoodPage;
