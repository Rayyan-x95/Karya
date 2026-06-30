/**
 * Generates the raw UPI URI parameters structure following NPCI specifications.
 */
export function buildUpiPayload(pa: string, pn: string, am: number, tn?: string): string {
  const params = new URLSearchParams();
  params.append('pa', pa);
  params.append('pn', pn);
  params.append('am', am.toFixed(2));
  params.append('cu', 'INR');
  
  if (tn) {
    params.append('tn', tn);
  }
  
  return `upi://pay?${params.toString()}`;
}
