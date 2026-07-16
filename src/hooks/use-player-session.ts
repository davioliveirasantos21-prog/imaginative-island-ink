import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getPlayerSession } from "@/lib/player-sync";

export type PlayerSession = { id: string; username: string } | null;

export function usePlayerSession(): { session: PlayerSession; loading: boolean } {
  const [session, setSession] = useState<PlayerSession>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    void getPlayerSession().then((s) => {
      if (!mounted) return;
      setSession(s);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
        const s = await getPlayerSession();
        if (mounted) setSession(s);
      }
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return { session, loading };
}
