// context/OnboardingContext.tsx
import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface OnboardingData {
  course_of_study: string;
  subjects: string;
  generated_subjects?: any[];
  level_of_study: string;
  daily_attention_target: number;
}

interface OnboardingContextType {
  data: OnboardingData;
  updateData: (updates: Partial<OnboardingData>) => void;
  resetData: () => void;
  isComplete: boolean;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

const initialData: OnboardingData = {
  course_of_study: '',
  subjects: '',
  level_of_study: '',
  daily_attention_target: 30,
};

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<OnboardingData>(initialData);

  const updateData = (updates: Partial<OnboardingData>) => {
    setData(prev => ({ ...prev, ...updates }));
    console.log('📝 Onboarding data updated:', updates);
  };

  const resetData = () => {
    setData(initialData);
    console.log('🔄 Onboarding data reset');
  };

  const isComplete = !!(
    data.course_of_study &&
    data.subjects &&
    data.level_of_study &&
    data.daily_attention_target
  );

  const value: OnboardingContextType = {
    data,
    updateData,
    resetData,
    isComplete,
  };

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding(): OnboardingContextType {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
}