import { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';

interface ClockContextType {
  lastClockUpdate: number;
  notifyClockChange: () => void;
}

const ClockContext = createContext<ClockContextType | undefined>(undefined);

export function ClockProvider({ children }: { children: ReactNode }) {
  const [lastClockUpdate, setLastClockUpdate] = useState(Date.now());

  const notifyClockChange = useCallback(() => {
    setLastClockUpdate(Date.now());
  }, []);

  return (
    <ClockContext.Provider value={{ lastClockUpdate, notifyClockChange }}>
      {children}
    </ClockContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useClock() {
  const context = useContext(ClockContext);
  if (context === undefined) {
    throw new Error('useClock must be used within a ClockProvider');
  }
  return context;
}
