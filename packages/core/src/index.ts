/**
 * @packageDocumentation
 * @module @use-africa-pay/core
 * 
 * A unified React hook for African payment gateways.
 * 
 * This package provides a simple, type-safe way to integrate multiple
 * African payment providers (Paystack, Flutterwave, Monnify, Remita)
 * into your React web applications.
 * 
 * @example
 * Basic usage:
 * ```tsx
 * import { useAfricaPay, PaystackAdapter } from '@use-africa-pay/core';
 * 
 * function PaymentButton() {
 *   const { initializePayment, loading, error } = useAfricaPay();
 * 
 *   const handlePayment = () => {
 *     initializePayment({
 *       provider: 'paystack',
 *       adapter: PaystackAdapter,
 *       publicKey: 'pk_test_xxx',
 *       amount: 100000, // 1000 NGN in kobo
 *       currency: 'NGN',
 *       reference: `TXN_${Date.now()}`,
 *       user: { email: 'customer@example.com' },
 *       onSuccess: (response) => console.log('Success:', response),
 *       onClose: () => console.log('Closed')
 *     });
 *   };
 * 
 *   return (
 *     <button onClick={handlePayment} disabled={loading}>
 *       {loading ? 'Processing...' : 'Pay Now'}
 *     </button>
 *   );
 * }
 * ```
 */

export * from './types';
export * from './useAfricaPay';
export * from './adapters/paystack';
export * from './adapters/flutterwave';
export * from './adapters/monnify';
export * from './adapters/remita';
