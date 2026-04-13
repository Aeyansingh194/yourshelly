import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import shellyIdle from "@/assets/shelly-idle.png";

const ResetPasswordPage = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [canReset, setCanReset] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    let isMounted = true;

    const prepareRecoverySession = async () => {
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const searchParams = new URLSearchParams(window.location.search);
      const recoveryType = hashParams.get("type") ?? searchParams.get("type");
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");

      try {
        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) throw error;
          window.history.replaceState({}, document.title, window.location.pathname);
        }

        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!isMounted) return;
        setCanReset(recoveryType === "recovery" || Boolean(session?.user));
      } catch (error) {
        console.error("Recovery session error:", error);
        if (isMounted) setCanReset(false);
      } finally {
        if (isMounted) setChecking(false);
      }
    };

    void prepareRecoverySession();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 6) {
      toast({
        title: "Password too short",
        description: "Use at least 6 characters.",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Passwords do not match",
        description: "Please make sure both password fields match.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      toast({
        title: "Password updated",
        description: "Your password has been reset. Please sign in again.",
      });

      await supabase.auth.signOut();
      navigate("/auth", { replace: true });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Could not update your password.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <Card className="w-full max-w-md border-border shadow-lg">
        <CardHeader className="items-center text-center">
          <img src={shellyIdle} alt="Shelly" className="mb-3 h-16 w-16" />
          <CardTitle className="text-2xl font-bold text-foreground">Create a new password</CardTitle>
          <CardDescription className="text-muted-foreground">
            Choose a new password to get back into your account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {checking ? (
            <div className="py-6 text-center text-sm text-muted-foreground">Checking your reset link...</div>
          ) : canReset ? (
            <form onSubmit={handleSubmit} className="space-y-3">
              <Input
                type="password"
                placeholder="New password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
              <Input
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
              />
              <Button type="submit" className="w-full rounded-full" disabled={loading}>
                {loading ? "Updating..." : "Update password"}
              </Button>
            </form>
          ) : (
            <div className="space-y-4">
              <p className="rounded-2xl border border-border bg-muted px-4 py-3 text-sm text-muted-foreground">
                This reset link is invalid or expired. Request a new one to continue.
              </p>
              <Button asChild className="w-full rounded-full">
                <Link to="/forgot-password">Request a new reset link</Link>
              </Button>
            </div>
          )}

          <Button asChild variant="ghost" className="w-full rounded-full">
            <Link to="/auth">
              <ArrowLeft className="h-4 w-4" />
              Back to sign in
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPasswordPage;
