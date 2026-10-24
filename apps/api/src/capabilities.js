export const capabilities = [
  { id: 'image-to-pdf', name: 'Image to PDF', description: 'Combine PNG and JPEG images into a downloadable PDF.', category: 'Documents', mode: 'verified', status: 'ready' },
  { id: 'csv-summary', name: 'CSV quick analysis', description: 'Summarize a CSV file and its columns.', category: 'Data', mode: 'verified', status: 'planned' },
  { id: 'custom-tool', name: 'Custom capability', description: 'A future generation pipeline for custom tools, validated in isolated cloud workers.', category: 'Custom', mode: 'generated', status: 'not-configured' }
];

export function routeRequest(prompt = '') {
  const p = prompt.toLowerCase();
  if (/\b(pdf|images? to pdf|combine images|merge images)\b/.test(p)) return { capabilityId: 'image-to-pdf', strategy: 'verified' };
  if (/\b(csv|spreadsheet|analy[sz]e data)\b/.test(p)) return { capabilityId: 'csv-summary', strategy: 'verified' };
  return { capabilityId: 'custom-tool', strategy: 'generated', requiresGenerationProvider: true };
}