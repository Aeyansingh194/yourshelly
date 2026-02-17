import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    q: "HOW DOES AN AI CHAT BOT WORK IN MENTAL HEALTH SUPPORT?",
    a: "Our AI chatbot uses advanced natural language processing to understand your emotions and provide supportive, empathetic responses. It can help you process thoughts, suggest coping strategies, and guide you through self-care exercises.",
  },
  {
    q: "CAN AN AI CHAT BOT REPLACE A PSYCHOLOGIST?",
    a: "No. Our AI panda is designed as a supplementary support tool, not a replacement for professional mental health care. For serious mental health concerns, we always recommend consulting with a licensed therapist or counselor.",
  },
  {
    q: "CAN DIGITAL PSYCHOLOGIST DIAGNOSE MENTAL HEALTH CONDITIONS?",
    a: "No. Digital Psychologist does not diagnose, treat, or provide medical advice. It offers emotional support and self-care tools to help you better understand and manage your feelings.",
  },
  {
    q: "WHAT DOES THE FREE VERSION OFFER?",
    a: "The free version includes AI chat support, mood tracking, journaling, breathing exercises, and guided meditation sessions. All core features are available to help you on your wellness journey.",
  },
  {
    q: "CAN DIGITAL PSYCHOLOGIST PERSONALIZE ITS THERAPY ADVICE?",
    a: "Yes! The AI learns from your conversations and mood patterns to provide increasingly personalized suggestions and support over time.",
  },
  {
    q: "IS MY DATA PRIVATE AND SECURE?",
    a: "Absolutely. We don't require registration, store no personal data, and never share information with third parties. Your privacy is our top priority.",
  },
];

const FAQSection = () => {
  return (
    <section className="py-20 px-6 bg-muted">
      <div className="container mx-auto max-w-3xl">
        <h2 className="text-3xl font-bold mb-12 text-foreground">FAQ</h2>
        <Accordion type="single" collapsible className="space-y-2">
          {faqs.map((faq, i) => (
            <AccordionItem key={i} value={`faq-${i}`} className="border-b border-border">
              <AccordionTrigger className="text-sm font-semibold text-foreground uppercase tracking-wide py-5">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground pb-4">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};

export default FAQSection;
