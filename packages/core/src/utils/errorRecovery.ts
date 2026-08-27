import { PaymentProvider, PaymentError } from '../types';

export interface RecoveryAction {
  label: string;
  action: () => void;
  type: 'primary' | 'secondary';
}

export interface ErrorRecoverySuggestion {
  title: string;
  message: string;
  actions: RecoveryAction[];
  severity: 'low' | 'medium' | 'high';
}

/**
 * Smart error recovery system that provides context-aware suggestions
 * based on error type, provider, and user context
 */
export class ErrorRecovery {
  private static recoveryMap: Record<string, ErrorRecoverySuggestion> = {
    NETWORK_ERROR: {
      title: 'Connection Issue',
      message: 'Unable to connect to payment provider. This might be a temporary network issue.',
      actions: [
        { label: 'Try Again', action: () => {}, type: 'primary' },
        { label: 'Check Connection', action: () => {}, type: 'secondary' },
      ],
      severity: 'medium',
    },
    VALIDATION_ERROR: {
      title: 'Invalid Configuration',
      message: 'Some payment details are missing or incorrect.',
      actions: [
        { label: 'Fix Details', action: () => {}, type: 'primary' },
        { label: 'Contact Support', action: () => {}, type: 'secondary' },
      ],
      severity: 'high',
    },
    PROVIDER_ERROR: {
      title: 'Provider Issue',
      message: 'The payment provider returned an error.',
      actions: [
        { label: 'Try Again', action: () => {}, type: 'primary' },
        { label: 'Switch Provider', action: () => {}, type: 'secondary' },
      ],
      severity: 'high',
    },
    TIMEOUT_ERROR: {
      title: 'Payment Timeout',
      message: 'The payment request took too long to respond.',
      actions: [
        { label: 'Retry', action: () => {}, type: 'primary' },
        { label: 'Check Status', action: () => {}, type: 'secondary' },
      ],
      severity: 'medium',
    },
  };

  private static providerSpecificRecovery: Record<
    PaymentProvider,
    Record<string, Partial<ErrorRecoverySuggestion>>
  > = {
    paystack: {
      VALIDATION_ERROR: {
        message: 'Paystack requires a valid public key and customer email.',
        actions: [
          { label: 'Update API Key', action: () => {}, type: 'primary' },
          { label: 'Verify Email', action: () => {}, type: 'secondary' },
        ],
      },
    },
    flutterwave: {
      VALIDATION_ERROR: {
        message: 'Flutterwave requires public key, email, and phone number.',
        actions: [
          { label: 'Add Phone Number', action: () => {}, type: 'primary' },
          { label: 'Check API Key', action: () => {}, type: 'secondary' },
        ],
      },
    },
    monnify: {
      VALIDATION_ERROR: {
        message: 'Monnify requires contract code and customer name.',
        actions: [
          { label: 'Add Contract Code', action: () => {}, type: 'primary' },
          { label: 'Add Customer Name', action: () => {}, type: 'secondary' },
        ],
      },
    },
    remita: {
      VALIDATION_ERROR: {
        message: 'Remita requires merchant ID, service type ID, and customer name.',
        actions: [
          { label: 'Add Merchant Details', action: () => {}, type: 'primary' },
          { label: 'Check Service Type', action: () => {}, type: 'secondary' },
        ],
      },
    },
  };

  static getSuggestion(
    error: PaymentError,
    provider?: PaymentProvider
  ): ErrorRecoverySuggestion {
    const baseSuggestion = this.recoveryMap[error.code] || this.recoveryMap.PROVIDER_ERROR;
    
    if (!baseSuggestion) {
      return {
        title: 'Unknown Error',
        message: 'An unexpected error occurred.',
        actions: [
          { label: 'Try Again', action: () => {}, type: 'primary' },
          { label: 'Contact Support', action: () => {}, type: 'secondary' },
        ],
        severity: 'high',
      };
    }
    
    let providerSpecific: Partial<ErrorRecoverySuggestion> = {};
    if (provider) {
      providerSpecific = this.providerSpecificRecovery[provider]?.[error.code] || {};
    }

    const providerActions = (providerSpecific as any).actions || [];
    const baseActions = baseSuggestion.actions || [];

    return {
      title: baseSuggestion.title,
      message: providerSpecific.message || baseSuggestion.message,
      severity: baseSuggestion.severity,
      actions: [...providerActions, ...baseActions],
    };
  }

  static getRecoveryActions(
    error: PaymentError,
    provider?: PaymentProvider,
    customActions?: RecoveryAction[]
  ): RecoveryAction[] {
    const suggestion = this.getSuggestion(error, provider);
    
    if (customActions && customActions.length > 0) {
      return [...customActions, ...suggestion.actions];
    }
    
    return suggestion.actions;
  }

  static isRetryable(error: PaymentError): boolean {
    const retryableCodes = ['NETWORK_ERROR', 'TIMEOUT_ERROR', 'PROVIDER_ERROR'];
    return retryableCodes.includes(error.code);
  }

  static getRetryDelay(attempt: number): number {
    // Exponential backoff: 1s, 2s, 4s, 8s, max 16s
    return Math.min(1000 * Math.pow(2, attempt), 16000);
  }
}
