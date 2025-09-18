import { useState, useEffect } from 'react';

const ONBOARDING_STORAGE_KEY = 'lovable-study-app-onboarding-completed';

export const useOnboarding = () => {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = () => {
    try {
      const completed = localStorage.getItem(ONBOARDING_STORAGE_KEY);
      setShowOnboarding(!completed);
    } catch (error) {
      console.warn('Error checking onboarding status:', error);
      setShowOnboarding(true); // Mostra onboarding em caso de erro
    } finally {
      setLoading(false);
    }
  };

  const completeOnboarding = () => {
    try {
      localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
      setShowOnboarding(false);
    } catch (error) {
      console.error('Error saving onboarding completion:', error);
    }
  };

  const resetOnboarding = () => {
    try {
      localStorage.removeItem(ONBOARDING_STORAGE_KEY);
      setShowOnboarding(true);
    } catch (error) {
      console.error('Error resetting onboarding:', error);
    }
  };

  const skipOnboarding = () => {
    completeOnboarding();
  };

  return {
    showOnboarding,
    loading,
    completeOnboarding,
    resetOnboarding,
    skipOnboarding
  };
};