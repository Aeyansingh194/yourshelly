import { motion } from "framer-motion";

const features = [
  { emoji: "⏱️", text: "Track your mood in just seconds", bg: "bg-soft-yellow" },
  { emoji: "🎤", text: "Add voice memos on the go", bg: "bg-peach" },
  { emoji: "🏆", text: "Set achievable routines easily", bg: "bg-soft-blue" },
  { emoji: "🎬", text: "Add video memos on the go", bg: "bg-mint-green" },
  { emoji: "🧘", text: "Learn breathing techniques to combat stress", bg: "bg-mint-green" },
  { emoji: "🙌", text: "Get support based on your data", bg: "bg-calm-lavender" },
  { emoji: "💝", text: "Measure heart rate during sessions", bg: "bg-peach" },
  { emoji: "🤳", text: "Get daily quotes based on your situation", bg: "bg-calm-lavender" },
  { emoji: "⌚", text: "Connect to your wearable devices", bg: "bg-soft-yellow" },
];

const FeaturesGrid = () => {
  return (
    <section className="py-20 px-6 bg-muted">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-foreground">
            Main <span className="text-primary italic">features</span>
          </h2>
        </div>
        <div className="grid md:grid-cols-2 gap-4 max-w-3xl mx-auto">
          {features.map((f, i) => (
            <motion.div
              key={f.text}
              className="flex items-center gap-4 bg-card rounded-2xl p-4 shadow-sm"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              viewport={{ once: true }}
            >
              <div className={`w-14 h-14 rounded-full ${f.bg} flex items-center justify-center shrink-0`}>
                <span className="text-2xl">{f.emoji}</span>
              </div>
              <p className="text-sm font-medium text-foreground">{f.text}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesGrid;
