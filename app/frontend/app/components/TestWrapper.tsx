import React from 'react';
import { AuthProvider } from '../context/AuthContext';

export function wrapper({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
