import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { useWindowDimensions } from 'react-native';

interface SidebarContextValue {
  isOpen: boolean;
  sidebarWidth: number;
  openSidebar: () => void;
  closeSidebar: () => void;
  toggleSidebar: () => void;
}

const SidebarContext = createContext<SidebarContextValue | null>(null);

export function SidebarProvider({ children }: { children: ReactNode }) {
  const { width } = useWindowDimensions();
  const [isOpen, setIsOpen] = useState(false);

  const sidebarWidth = width * 0.5;

  const openSidebar = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeSidebar = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggleSidebar = useCallback(() => {
    setIsOpen((current) => !current);
  }, []);

  const value = useMemo(
    () => ({ isOpen, sidebarWidth, openSidebar, closeSidebar, toggleSidebar }),
    [isOpen, sidebarWidth, openSidebar, closeSidebar, toggleSidebar],
  );

  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>;
}

export function useSidebar(): SidebarContextValue {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within SidebarProvider');
  }
  return context;
}
