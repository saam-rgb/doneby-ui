import { supabase } from "../lib/supabase";

export const signUp = (email: string, password: string, name: string) =>
  supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
        initials: name
          .split(" ")
          .map((w) => w[0])
          .join("")
          .toUpperCase()
          .slice(0, 2),
      },
    },
  });

export const signIn = (email: string, password: string) =>
  supabase.auth.signInWithPassword({ email, password });

export const signOut = () => supabase.auth.signOut();

export const getSession = () => supabase.auth.getSession();
