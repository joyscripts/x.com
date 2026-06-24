import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  clearAuthSession,
  getStoredAuthSession,
  type StoredAuthSession,
} from "@/lib/auth";

type AuthSessionContextValue = {
  isAuthenticated: boolean;
  isLoading: boolean;
  reloadSession: () => Promise<void>;
  session: StoredAuthSession;
  signOut: () => Promise<void>;
};

const AuthSessionContext = createContext<AuthSessionContextValue | null>(null);

export function AuthSessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<StoredAuthSession>(null);
  const [isLoading, setIsLoading] = useState(true);

  const reloadSession = useCallback(async () => {
    setIsLoading(true);
    try {
      setSession(await getStoredAuthSession());
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    await clearAuthSession();
    setSession(null);
  }, []);

  useEffect(() => {
    void reloadSession();
  }, [reloadSession]);

  const value = useMemo(
    () => ({
      isAuthenticated: Boolean(session),
      isLoading,
      reloadSession,
      session,
      signOut,
    }),
    [isLoading, reloadSession, session, signOut],
  );

  return (
    <AuthSessionContext.Provider value={value}>
      {children}
    </AuthSessionContext.Provider>
  );
}

export function useAuthSession() {
  const value = use(AuthSessionContext);

  if (!value) {
    throw new Error("useAuthSession must be used inside AuthSessionProvider");
  }

  return value;
}
