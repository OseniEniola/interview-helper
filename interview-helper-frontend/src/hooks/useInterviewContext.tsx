// InterviewContext.tsx
import React, { createContext, useContext } from 'react';
import { useInterview } from './useInterview';

const InterviewContext = createContext(null);

export const InterviewProvider = ({ children }: { children: React.ReactNode }) => {
  const interview = useInterview();

  return (
    <InterviewContext.Provider value={interview}>
      {children}
    </InterviewContext.Provider>
  );
};

export const useInterviewContext = () => {
  const context = useContext(InterviewContext);
  if (!context) {
    throw new Error('useInterviewContext must be used within an InterviewProvider');
  }
  return context;
};
