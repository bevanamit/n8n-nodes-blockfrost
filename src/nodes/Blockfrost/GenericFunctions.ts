// Helper functions for Blockfrost node

export function validateStakeAddress(address: string): boolean {
  // Basic validation for Bech32 stake addresses
  return address.startsWith('stake1') && address.length === 59;
}

export function handleApiError(error: any): string {
  if (error.response) {
    const status = error.response.status;
    const message = error.response.data?.message || 'Unknown error';
    return `HTTP ${status}: ${message}`;
  }
  return error.message || 'Unknown error';
}