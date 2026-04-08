import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, LogOut, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import shellyIdle from "@/assets/shelly-idle.png";
import { useAuth } from "@/contexts/AuthContext";

const navItems = [
  { to: "/", label: "Home" },
  { to: "/chat", label: "Chat" },
  { to: "/voice", label: "Voice" },
  { to: "/mood", label: "Mood" },
  { to: "/journal", label: "Journal" },
  { to: "/meditation", label: "Meditate" },
];

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-md supports-[backdrop-filter]:bg-background/80">
      <div className="container mx-auto flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link to="/" className="flex min-w-0 items-center gap-3">
          <img src={shellyIdle} alt="Shelly" className="h-9 w-9 shrink-0" />
          <div className="min-w-0">
            <span className="block truncate text-sm font-bold text-foreground sm:text-lg">Digital Psychologist</span>
            <span className="hidden text-xs text-muted-foreground sm:block">Grounded mental wellness support</span>
          </div>
        </Link>

        <div className="hidden lg:flex items-center gap-1">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                location.pathname === item.to
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {user ? (
            <Button variant="ghost" size="sm" className="hidden gap-1 rounded-full sm:inline-flex" onClick={handleSignOut}>
              <LogOut className="h-4 w-4" /> Sign Out
            </Button>
          ) : (
            <Button asChild className="hidden rounded-full px-4 sm:inline-flex lg:px-6">
              <Link to="/auth">Sign In</Link>
            </Button>
          )}

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="rounded-full lg:hidden" aria-label="Open navigation menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full max-w-xs border-l border-border px-5">
              <SheetHeader className="mb-6">
                <SheetTitle>Navigate</SheetTitle>
              </SheetHeader>

              <div className="flex flex-col gap-2">
                {navItems.map((item) => (
                  <Button
                    key={item.to}
                    asChild
                    variant={location.pathname === item.to ? "default" : "ghost"}
                    className="h-auto justify-start rounded-xl px-4 py-3 text-base"
                  >
                    <Link to={item.to} onClick={() => setOpen(false)}>
                      {item.label}
                    </Link>
                  </Button>
                ))}

                {user ? (
                  <Button variant="destructive" className="mt-4 w-full rounded-full" onClick={() => { handleSignOut(); setOpen(false); }}>
                    Sign Out
                  </Button>
                ) : (
                  <Button asChild className="mt-4 w-full rounded-full">
                    <Link to="/auth" onClick={() => setOpen(false)}>
                      Sign In
                    </Link>
                  </Button>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
