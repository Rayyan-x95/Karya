/**
 * Formats data values into a structured text string representing simple document layout.
 */
export function buildDocumentTextStream(title: string, sections: Record<string, string>): string {
  const parts = [
    '========================================',
    title.toUpperCase().padStart(30),
    '========================================',
  ];

  for (const [key, val] of Object.entries(sections)) {
    parts.push(`${key.padEnd(15)} : ${val}`);
  }

  parts.push('----------------------------------------');
  parts.push(`Generated: ${new Date().toLocaleDateString()}`);
  parts.push('========================================');

  return parts.join('\n');
}
