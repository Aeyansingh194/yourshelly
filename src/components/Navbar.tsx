import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Navbar = () => {
  return (
    <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto flex items-center justify-between py-4 px-6">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-2xl">🐼</span>
          <span className="text-xl font-bold text-foreground">Digital Psychologist</span>
        </Link>
        <div className="hidden md:flex items-center gap-6">
          <Link to="/" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Home</Link>
          <Link to="/chat" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Chat</Link>
          <Link to="/voice" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Voice</Link>
          <Link to="/mood" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Mood</Link>
          <Link to="/journal" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Journal</Link>
          <Link to="/meditation" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Meditate</Link>
        </div>
        <Link to="/chat">
          <Button className="rounded-full px-6">Chat With Panda</Button>
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;
