/**
 * @packageDocumentation
 * @module @use-africa-pay/core
 * 
 * Script loading utilities for dynamically loading payment provider SDKs.
 */

/** Cache of loaded script promises to prevent duplicate loading */
const LOADED_SCRIPTS: Record<string, Promise<void>> = {};

/** Default timeout for script loading (30 seconds) */
const SCRIPT_TIMEOUT = 30000;

/** Maximum number of retry attempts */
const MAX_RETRIES = 3;

/** Base delay between retries (1 second) */
const RETRY_DELAY = 1000;

/**
 * Options for script loading.
 * 
 * @category Utilities
 */
interface ScriptLoadOptions {
  /** CSP nonce for script tag */
  nonce?: string;
  /** Timeout in milliseconds */
  timeout?: number;
  /** Number of retry attempts */
  retries?: number;
}

/**
 * Creates a promise that resolves after a specified duration.
 * 
 * @param ms - Duration in milliseconds
 * @returns Promise that resolves after the delay
 * @internal
 */
const delay = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Dynamically loads an external JavaScript file with timeout, retry logic, and CSP support.
 * 
 * Features:
 * - Automatic caching to prevent duplicate loads
 * - Configurable timeout (default: 30 seconds)
 * - Exponential backoff retry logic (default: 3 attempts)
 * - CSP nonce support for Content Security Policy compliance
 * - HTTPS enforcement for security
 * 
 * @category Utilities
 * @param src - URL of the script to load (must be HTTPS)
 * @param options - Loading options
 * @returns Promise that resolves when the script is loaded
 * @throws Error if the script fails to load after all retries
 * 
 * @example
 * Basic usage:
 * ```typescript
 * await loadScript('https://js.paystack.co/v1/inline.js');
 * // Script is now loaded and available
 * ```
 * 
 * @example
 * With options:
 * ```typescript
 * await loadScript('https://sdk.monnify.com/plugin/monnify.js', {
 *   timeout: 15000,
 *   retries: 5,
 *   nonce: 'abc123' // For CSP compliance
 * });
 * ```
 */
export const loadScript = (
  src: string,
  options: ScriptLoadOptions = {}
): Promise<void> => {
  // Validate URL to prevent injection
  if (!src || typeof src !== 'string') {
    return Promise.reject(new Error('Invalid script URL'));
  }

  // Ensure HTTPS (except localhost for development)
  if (!src.startsWith('https://') && !src.includes('localhost')) {
    return Promise.reject(new Error('Script must be loaded over HTTPS'));
  }

  // Return existing promise if script is already loading/loaded
  if (LOADED_SCRIPTS[src] !== undefined) {
    return LOADED_SCRIPTS[src];
  }

  const timeout = options.timeout || SCRIPT_TIMEOUT;
  const maxRetries = options.retries !== undefined ? options.retries : MAX_RETRIES;

  const loadWithRetry = async (attempt: number = 0): Promise<void> => {
    return new Promise((resolve, reject) => {
      // Check if script already exists in DOM
      if (document.querySelector(`script[src="${src}"]`)) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = src;
      script.async = true;

      // Add CSP nonce if provided
      if (options.nonce) {
        script.nonce = options.nonce;
      }

      // Set up timeout
      const timeoutId = setTimeout(() => {
        script.remove();
        reject(new Error(`Script loading timeout: ${src}`));
      }, timeout);

      script.onload = () => {
        clearTimeout(timeoutId);
        resolve();
      };

      script.onerror = async () => {
        clearTimeout(timeoutId);
        script.remove();

        // Retry logic
        if (attempt < maxRetries) {
          const retryDelay = RETRY_DELAY * Math.pow(2, attempt); // Exponential backoff
          console.warn(
            `[use-africa-pay] Script load failed, retrying in ${retryDelay}ms (attempt ${attempt + 1}/${maxRetries})`
          );
          await delay(retryDelay);
          try {
            await loadWithRetry(attempt + 1);
            resolve();
          } catch (err) {
            reject(err);
          }
        } else {
          reject(new Error(`Failed to load script after ${maxRetries} attempts: ${src}`));
        }
      };

      document.body.appendChild(script);
    });
  };

  // Store the promise
  LOADED_SCRIPTS[src] = loadWithRetry();

  return LOADED_SCRIPTS[src];
};

/**
 * Clears the loaded scripts cache.
 * Useful for testing or when you need to force reload scripts.
 * 
 * @category Utilities
 * @example
 * ```typescript
 * // Clear cache before reloading
 * clearScriptCache();
 * await loadScript('https://js.paystack.co/v1/inline.js');
 * ```
 */
export const clearScriptCache = (): void => {
  Object.keys(LOADED_SCRIPTS).forEach((key) => delete LOADED_SCRIPTS[key]);
};
