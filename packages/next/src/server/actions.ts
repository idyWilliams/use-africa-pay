"use server";

export async function verifyTransaction(reference: string, provider: 'paystack' | 'flutterwave' | 'monnify' | 'remita') {
  // Retrieve the secret key from the secure Node environment
  const secretKey = process.env[`${provider.toUpperCase()}_SECRET_KEY`];
  
  if (!secretKey) {
    throw new Error(`Missing server-side secret key for ${provider}. Please configure your environment variables.`);
  }

  try {
    // Note: URL structure should be adapted to the actual provider's verification endpoint
    let url = '';
    let headers: Record<string, string> = {
      'Authorization': `Bearer ${secretKey}`,
      'Content-Type': 'application/json'
    };

    switch (provider) {
      case 'paystack':
        url = `https://api.paystack.co/transaction/verify/${reference}`;
        break;
      case 'flutterwave':
        url = `https://api.flutterwave.com/v3/transactions/${reference}/verify`;
        break;
      // Add more standard routing here as needed
      default:
        throw new Error(`Verification routing not implemented for ${provider}`);
    }

    const response = await fetch(url, { method: 'GET', headers });
    const data = await response.json();

    return {
      success: provider === 'paystack' ? data.data.status === 'success' : data.status === 'success',
      raw: data,
    };
  } catch (error) {
    console.error(`[use-africa-pay] Server Action Error: Failed to verify ${provider} transaction`, error);
    return { success: false, error: 'Verification failed' };
  }
}
