/* eslint-disable react-refresh/only-export-components */
import { createContext, type ReactNode, useContext, useState } from "react";

interface TitleBarState {
  extraContent: ReactNode | null;
  setExtraContent: (content: ReactNode | null) => void;
}

const TitleBarContext = createContext<TitleBarState>({
  extraContent: null,
  setExtraContent: () => undefined,
});

export const TitleBarProvider = ({ children }: { children: ReactNode }) => {
  const [extraContent, setExtraContent] = useState<ReactNode | null>(null);
  return (
    <TitleBarContext.Provider value={{ extraContent, setExtraContent }}>
      {children}
    </TitleBarContext.Provider>
  );
};

export const useTitleBar = () => useContext(TitleBarContext);
