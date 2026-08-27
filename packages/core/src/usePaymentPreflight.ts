import { useState, useCallback } from 'react';
import { InitializePaymentProps, PaymentProvider } from './types';

export interface PreflightCheckResult {
  isValid: boolean;
  issues: string[];
  warnings: string[];
  canProceed: boolean;
}

export interface PreflightConfig {
  amount?: number;
  currency?: string;
  provider?: PaymentProvider;
  user?: {
    email?: string;
    name?: string;
    phonenumber?: string;
  };
}

/**
 * Smart preflight validation hook that checks payment feasibility before UI rendering
 * Prevents user frustration by catching issues early
 */
export const usePaymentPreflight = () => {
  const [checking, setChecking] = useState(false);

  const validateEmail = (email?: string): boolean => {
    if (!email) return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone?: string): boolean => {
    if (!phone) return true; // Phone is optional for some providers
    const phoneRegex = /^\+?[0-9]{10,15}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  };

  const validateAmount = (amount?: number): boolean => {
    if (!amount) return false;
    return amount > 0 && amount <= 1000000000; // Max 1B in lowest denomination
  };

  const checkPreflight = useCallback((config: PreflightConfig): PreflightCheckResult => {
    const issues: string[] = [];
    const warnings: string[] = [];

    // Critical validations
    if (!validateAmount(config.amount)) {
      issues.push('Amount must be greater than 0 and less than 1 billion');
    }

    if (!validateEmail(config.user?.email)) {
      issues.push('Invalid email address format');
    }

    // Provider-specific checks
    if (config.provider === 'flutterwave' && !validatePhone(config.user?.phonenumber)) {
      issues.push('Phone number is required for Flutterwave (10-15 digits)');
    }

    if (config.provider === 'monnify' && !config.user?.name) {
      issues.push('Customer name is required for Monnify');
    }

    if (config.provider === 'remita' && !config.user?.name) {
      issues.push('Customer name is required for Remita');
    }

    // Warnings (non-blocking but helpful)
    if (config.amount && config.amount > 50000000) {
      warnings.push('Large amount detected - ensure you have proper authorization');
    }

    if (!config.currency) {
      warnings.push('No currency specified - will default to NGN');
    }

    return {
      isValid: issues.length === 0,
      issues,
      warnings,
      canProceed: issues.length === 0,
    };
  }, []);

  const simulatePayment = useCallback(async (config: PreflightConfig): Promise<boolean> => {
    setChecking(true);
    try {
      // Simulate a quick network check (in production, this could ping provider health)
      await new Promise(resolve => setTimeout(resolve, 300));
      setChecking(false);
      return true;
    } catch {
      setChecking(false);
      return false;
    }
  }, []);

  return {
    checkPreflight,
    simulatePayment,
    checking,
  };
};
