"use client";

import React, { createContext, useContext, useState, useCallback } from 'react';
import { 
  useAfricaPay, 
  usePaymentPreflight, 
  usePaymentRetry,
  type InitializePaymentProps, 
  type PaymentResponse,
  type PreflightCheckResult,
  type RetryState
} from '@use-africa-pay/core';

interface AfricaPayContextValue {
  initializePayment: (props?: InitializePaymentProps) => void;
  preflight: PreflightCheckResult | null;
  isCheckingPreflight: boolean;
  retry: RetryState & {
    retryPayment: () => void;
    resetRetry: () => void;
  };
}

const AfricaPayContext = createContext<AfricaPayContextValue | null>(null);

export interface AfricaPayProviderProps extends Omit<InitializePaymentProps, 'onClose' | 'onSuccess'> {
  children: React.ReactNode;
  onSuccess?: (response: PaymentResponse) => void;
  onClose?: () => void;
  autoValidate?: boolean;
  maxRetries?: number;
}

export const AfricaPayProvider: React.FC<AfricaPayProviderProps> = ({ 
  children, 
  autoValidate = true,
  maxRetries = 3,
  onSuccess,
  onClose,
  ...config 
}) => {
  const { initializePayment: coreInitializePayment } = useAfricaPay();
  const { checkPreflight, checking: isCheckingPreflight } = usePaymentPreflight();
  const { executeWithRetry, retryState, reset: resetRetry } = usePaymentRetry({ 
    maxAttempts: maxRetries 
  });

  const [preflightResult, setPreflightResult] = useState<PreflightCheckResult | null>(null);

  const initializePayment = useCallback((props?: InitializePaymentProps) => {
    const mergedProps = props ? { ...config, ...props } : config;
    
    if (autoValidate) {
      const result = checkPreflight({
        amount: mergedProps.amount,
        currency: mergedProps.currency,
        provider: mergedProps.provider,
        user: mergedProps.user,
      });
      setPreflightResult(result);

      if (!result.isValid) {
        return;
      }
    }

    coreInitializePayment({
      ...mergedProps,
      onSuccess: onSuccess || props?.onSuccess,
      onClose: onClose || props?.onClose,
    } as InitializePaymentProps);
  }, [config, autoValidate, checkPreflight, coreInitializePayment, onSuccess, onClose]);

  const retryPayment = useCallback(() => {
    executeWithRetry(async () => {
      initializePayment();
    });
  }, [executeWithRetry, initializePayment]);

  return (
    <AfricaPayContext.Provider value={{ 
      initializePayment,
      preflight: preflightResult,
      isCheckingPreflight,
      retry: {
        ...retryState,
        retryPayment,
        resetRetry,
      },
    }}>
      {children}
    </AfricaPayContext.Provider>
  );
};

export const useAfricaPayNext = () => {
  const context = useContext(AfricaPayContext);
  if (!context) {
    throw new Error('useAfricaPayNext must be used within an AfricaPayProvider');
  }
  return context;
};
