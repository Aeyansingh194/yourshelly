const Footer = () => {
  return (
    <footer className="py-8 px-6 border-t border-border">
      <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">🐼</span>
          <span className="font-semibold text-foreground">Digital Psychologist</span>
        </div>
        <p className="text-xs text-muted-foreground">
          © 2026 Digital Psychologist. This is not a substitute for professional mental health care.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
