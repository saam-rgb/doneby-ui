import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { signIn, signOut, signUp } from "../api/auth";

interface AuthCtx {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, name: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const ctx: AuthCtx = {
    user: session?.user ?? null,
    session,
    loading,
    signIn: async (email, password) => {
      const { error } = await signIn(email, password);
      return { error: error as Error | null };
    },
    signUp: async (email, password, name) => {
      const { error } = await signUp(email, password, name);
      return { error: error as Error | null };
    },
    signOut: async () => {
      await signOut();
    },
  };

  return <AuthContext.Provider value={ctx}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthCtx {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

/* ── AuthGate: renders login form if no session ── */

export function AuthGate({ children }: { children: ReactNode }) {
  const { user, loading, signIn, signUp } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (loading) {
    return (
      <div className="auth-loading">
        <div className="spinner" />
      </div>
    );
  }

  if (user) return <>{children}</>;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setSubmitting(true);
    const result =
      mode === "login"
        ? await signIn(email, password)
        : await signUp(email, password, name);
    setSubmitting(false);
    if (result.error) setErr(result.error.message);
  };

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <h1 className="auth-logo">DoneBy</h1>
        <p className="auth-sub">{mode === "login" ? "Welcome back" : "Create your account"}</p>

        <form onSubmit={handleSubmit} className="auth-form">
          {mode === "signup" && (
            <input
              className="auth-input"
              type="text"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          )}
          <input
            className="auth-input"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            className="auth-input"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
          {err && <p className="auth-error">{err}</p>}
          <button className="auth-btn" type="submit" disabled={submitting}>
            {submitting ? "…" : mode === "login" ? "Sign in" : "Create account"}
          </button>
        </form>

        <button
          className="auth-switch"
          onClick={() => { setMode(mode === "login" ? "signup" : "login"); setErr(null); }}
        >
          {mode === "login" ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
        </button>
      </div>
    </div>
  );
}
