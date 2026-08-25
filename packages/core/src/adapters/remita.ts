import { AdapterInterface, AdapterConfig, PaymentResponse, PaymentError } from "../types";
import { loadScript } from "../scriptLoader";
import { parseUserName } from "../utils/sanitize";

declare global {
  interface RmPaymentEngine {
    init: (config: any) => { showPaymentWidget: () => void };
  }
  interface Window {
    RmPaymentEngine: RmPaymentEngine;
  }
}

export const RemitaAdapter: AdapterInterface = {
  loadScript: async (options = { testMode: true }) => {
    // Default to Test Mode (Demo) if not specified, for safety
    const isTestMode = options.testMode !== false;
    const url = isTestMode
      ? "https://remitademo.net/payment/v1/remita-pay-inline.bundle.js"
      : "https://login.remita.net/payment/v1/remita-pay-inline.bundle.js";
    await loadScript(url);
  },
  initialize: (config: AdapterConfig) => {
    try {
      if (typeof window === 'undefined' || !window.RmPaymentEngine) {
        const error = new PaymentError(
          'Remita SDK script not loaded',
          'SDK_NOT_LOADED',
          'remita',
          'Please ensure the Remita SDK script is loaded before initializing payment.'
        );
        if (config.onError) config.onError(error);
        return;
      }

      if (!config.merchantId) {
        const error = new PaymentError(
          'Merchant ID is required for Remita',
          'VALIDATION_ERROR',
          'remita',
          'Please provide your Remita merchant ID'
        );
        if (config.onError) config.onError(error);
        return;
      }
      if (!config.serviceTypeId) {
        const error = new PaymentError(
          'Service Type ID is required for Remita',
          'VALIDATION_ERROR',
          'remita',
          'Please provide your Remita service type ID'
        );
        if (config.onError) config.onError(error);
        return;
      }
      const { firstName, lastName } = parseUserName(config.user);

      const paymentEngine = window.RmPaymentEngine.init({
        key: config.publicKey,
        merchantId: config.merchantId,
        serviceTypeId: config.serviceTypeId,
        amount: config.amount / 100, // Remita expects major currency unit (Naira)
        currency: config.currency,
        transactionId: config.reference,
        customerId: config.user.email,
        firstName,
        lastName,
        email: config.user.email,
        narration: config.metadata?.description || "Payment",
        onSuccess: (response: any) => {
          const paymentResponse: PaymentResponse = {
            status: "success",
            message: "Payment completed successfully",
            reference: config.reference,
            transactionId: response.transactionId || response.RRR,
            amount: config.amount,
            currency: config.currency,
            paidAt: new Date().toISOString(),
            customer: {
              email: config.user.email,
              name: config.user.name,
              phone: config.user.phonenumber || config.user.phone,
            },
            provider: "remita",
            metadata: config.metadata,
            raw: response,
          };
          config.onSuccess(paymentResponse);
        },
        onError: (response: any) => {
          const error = new PaymentError(
            response?.message || 'Transaction failed',
            'PAYMENT_FAILED',
            'remita',
            'The payment was not successful. Please try again.',
            response
          );
          if (config.onError) config.onError(error);
        },
        onClose: () => {
          config.onClose();
        },
      });

      paymentEngine.showPaymentWidget();
    } catch (error) {
      const paymentError = new PaymentError(
        error instanceof Error ? error.message : 'Failed to initialize Remita payment',
        'INITIALIZATION_ERROR',
        'remita',
        'An error occurred while setting up the payment. Please try again.',
        error
      );
      if (config.onError) config.onError(paymentError);
    }
  },
  getInstance: () => {
    return window.RmPaymentEngine;
  },
};
