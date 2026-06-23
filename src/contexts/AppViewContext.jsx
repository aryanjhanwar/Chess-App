import { createContext, useContext, useState } from 'react';

const AppViewContext = createContext();

export function AppViewProvider({ children }) {
  const [currentView, setCurrentView] = useState('play');

  return (
    <AppViewContext.Provider
      value={{
        currentView,
        setCurrentView,
      }}
    >
      {children}
    </AppViewContext.Provider>
  );
}

export function useAppView() {
  return useContext(AppViewContext);
}