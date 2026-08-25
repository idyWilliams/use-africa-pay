"use client";

import React, { createContext, useContext } from 'react';
import { useAfricaPay, type InitializePaymentProps, type PaymentResponse } from '@use-africa-pay/core';

interface AfricaPayContextValue {
  initializePayment: (props: InitializePaymentProps) => void;
}

const AfricaPayContext = createContext<AfricaPayContextValue | null>(null);

export interface AfricaPayProviderProps extends Omit<InitializePaymentProps, 'onClose' | 'onSuccess'> {
  children: React.ReactNode;
  onSuccess?: (response: PaymentResponse) => void;
  onClose?: () => void;
}

export const AfricaPayProvider: React.FC<AfricaPayProviderProps> = ({ 
  children, 
  onSuccess,
  onClose,
  ...config 
}) => {
  const { initializePayment: coreInitializePayment } = useAfricaPay();

  const initializePayment = (props: InitializePaymentProps) => {
    coreInitializePayment({
      ...props,
      onSuccess: onSuccess || props.onSuccess,
      onClose: onClose || props.onClose,
    });
  };

  return (
    <AfricaPayContext.Provider value={{ initializePayment }}>
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
