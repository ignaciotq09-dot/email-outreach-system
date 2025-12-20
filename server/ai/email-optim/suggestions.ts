export function generateImprovementSuggestions(subject: string, body: string, aiSuggestions: string[]): Array<{ category: string; issue: string; suggestion: string; impact: string }> {
  const improvements: Array<{ category: string; issue: string; suggestion: string; impact: string }> = [];
  aiSuggestions?.forEach((suggestion, index) => { improvements.push({ category: 'AI Optimization', issue: `Optimization ${index + 1}`, suggestion, impact: 'High' }); });
  if (subject.length > 50) { improvements.push({ category: 'Subject Line', issue: 'Too long', suggestion: 'Shorten to 44 characters for optimal open rates', impact: '+15% open rate' }); }
  if (subject.length < 30) { improvements.push({ category: 'Subject Line', issue: 'Too short', suggestion: 'Add more specificity or intrigue', impact: '+10% open rate' }); }
  const wordCount = body.split(' ').length;
  if (wordCount > 125) { improvements.push({ category: 'Body Length', issue: 'Too long', suggestion: 'Reduce to 75-125 words', impact: '+12% response rate' }); }
  if (!body.includes('?')) { improvements.push({ category: 'Call to Action', issue: 'No question', suggestion: 'End with a clear question', impact: '+18% response rate' }); }
  return improvements;
}

export function generateBasicImprovements(subject: string, body: string): Array<{ category: string; issue: string; suggestion: string; impact: string }> {
  const improvements: Array<{ category: string; issue: string; suggestion: string; impact: string }> = [];
  if (subject.length > 50) { improvements.push({ category: 'Subject Line', issue: 'Length exceeds optimal', suggestion: 'Shorten to 44 characters', impact: '+15% open rate' }); }
  const wordCount = body.split(' ').length;
  if (wordCount > 125) { improvements.push({ category: 'Body', issue: 'Too long', suggestion: 'Reduce word count to 75-125', impact: '+12% response rate' }); }
  if (!body.toLowerCase().includes('because')) { improvements.push({ category: 'Persuasion', issue: 'Missing reasoning', suggestion: 'Add "because" to explain value', impact: '+10% engagement' }); }
  return improvements;
}
