import { motion } from "framer-motion";

const features = [
  { emoji: "⏱️", text: "Track your mood in just seconds", bg: "bg-soft-yellow" },
  
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
    <section className="bg-muted px-4 py-16 sm:px-6 sm:py-20">
      <div className="container mx-auto">
        <div className="mb-12 text-center sm:mb-16">
          <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
            Main <span className="text-primary italic">features</span>
          </h2>
        </div>
        <div className="mx-auto grid max-w-6xl gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {features.map((f, i) => (
            <motion.div
              key={f.text}
              className="flex items-start gap-4 rounded-2xl bg-card p-5 shadow-sm"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              viewport={{ once: true }}
            >
              <div className={`w-14 h-14 rounded-full ${f.bg} flex items-center justify-center shrink-0`}>
                <span className="text-2xl">{f.emoji}</span>
              </div>
              <p className="text-sm font-medium leading-6 text-foreground sm:text-base">{f.text}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesGrid;
