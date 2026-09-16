'use client';

import { createContext, useContext } from 'react';

const LogoContext = createContext('/brand/volley-pei.png');

export function LogoProvider({ logoUrl, children }: { logoUrl: string; children: React.ReactNode }) {
  return <LogoContext.Provider value={logoUrl}>{children}</LogoContext.Provider>;
}

export function useLogoUrl() { return useContext(LogoContext); }
