import React from 'react';
import { KaryaLogo } from '../ui/KaryaLogo';

export const AuthLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
    <div className="w-full max-w-[400px] space-y-8 animate-slide-up">
      <div className="flex flex-col items-center justify-center">
        <KaryaLogo showText size={42} />
      </div>
      <div className="bg-surface rounded-lg p-6 md:p-8">
        {children}
      </div>
    </div>
  </div>
);

export default AuthLayout;
