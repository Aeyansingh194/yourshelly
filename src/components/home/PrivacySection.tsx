import { motion } from "framer-motion";
import { Shield } from "lucide-react";

const PrivacySection = () => {
  return (
    <section className="py-20 px-6">
      <div className="container mx-auto flex flex-col md:flex-row items-center gap-12">
        <motion.div
          className="flex-1 bg-soft-blue rounded-3xl p-8 h-80 flex items-center justify-center"
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
        >
          <div className="bg-card rounded-3xl p-6 shadow-lg max-w-xs space-y-4">
            <p className="text-sm font-medium text-foreground">What are your main goals?</p>
            <div className="space-y-2">
              {["Reduce stress & anxiety", "Improve yourself", "Sleep better", "Live healthier", "Break bad habits"].map((goal) => (
                <div key={goal} className="bg-muted rounded-full px-4 py-2 text-xs text-foreground flex items-center gap-2">
                  <span>😊</span> {goal}
                </div>
              ))}
            </div>
          </div>
        </motion.div>
        <motion.div
          className="flex-1 space-y-4"
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl font-bold text-foreground">
            Your privacy is <span className="bg-peach px-3 py-1 rounded-full text-primary">key</span>
          </h2>
          <p className="text-muted-foreground">
            No registration is required to use Digital Psychologist. This means that we have no personal data whatsoever about you. Your data belongs to you and only to you.
          </p>
          <p className="text-muted-foreground">
            We are not exposing it to third parties. Your data serves to support you and is used to build better tools for everyone who wants to manage anxiety in the future.
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default PrivacySection;
