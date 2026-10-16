/**
 * Converts common Markdown and LaTeX-style AI output into clean, readable text.
 * This also cleans answers that were already saved in local chat history.
 */
export function formatStudyAnswer(input: string): string {
  let text = String(input || '').replace(/\r\n?/g, '\n').trim();
  if (!text) return '';

  // Remove fenced-code markers but keep the text inside them.
  text = text.replace(/\x60{3}[a-zA-Z0-9_-]*\s*\n?/g, '').replace(/\x60{3}/g, '');

  // Unwrap display/inline math and common LaTeX math environments.
  text = text
    .replace(/\\\[([\s\S]*?)\\\]/g, '$1')
    .replace(/\\\(([\s\S]*?)\\\)/g, '$1')
    .replace(/\$\$([\s\S]*?)\$\$/g, '$1')
    .replace(/\$([^$\n]+)\$/g, '$1')
    .replace(/\\begin\{(?:aligned|align\*?|equation\*?|displaymath)\}/g, '')
    .replace(/\\end\{(?:aligned|align\*?|equation\*?|displaymath)\}/g, '')
    .replace(/\\(?:left|right)\b/g, '')
    .replace(/\\(?:displaystyle|textstyle)\b/g, '')
    .replace(/\\(?:quad|qquad|,|;|:|!| )/g, ' ');

  // Turn frequent LaTeX commands into familiar symbols and words.
  text = text
    .replace(/\\(?:dfrac|tfrac)\b/g, '\\frac')
    .replace(/\\text\{([^{}]*)\}/g, '$1')
    .replace(/\\mathrm\{([^{}]*)\}/g, '$1')
    .replace(/\\mathbf\{([^{}]*)\}/g, '$1')
    .replace(/\\operatorname\{([^{}]*)\}/g, '$1')
    .replace(/\\sqrt\{([^{}]*)\}/g, '√($1)')
    .replace(/\\times\b/g, '×')
    .replace(/\\cdot\b/g, '·')
    .replace(/\\div\b/g, '÷')
    .replace(/\\pm\b/g, '±')
    .replace(/\\neq\b|\\ne\b/g, '≠')
    .replace(/\\leq\b|\\le\b/g, '≤')
    .replace(/\\geq\b|\\ge\b/g, '≥')
    .replace(/\\approx\b/g, '≈')
    .replace(/\\infty\b/g, '∞')
    .replace(/\\pi\b/g, 'π')
    .replace(/\\alpha\b/g, 'α')
    .replace(/\\beta\b/g, 'β')
    .replace(/\\theta\b/g, 'θ')
    .replace(/\\Delta\b/g, 'Δ')
    .replace(/\\degree\b/g, '°')
    .replace(/\\[{}]/g, (match) => match.slice(1));

  // Flatten common fractions in a readable form, including simple nested cases.
  for (let i = 0; i < 5; i += 1) {
    text = text.replace(/\\frac\{([^{}]*)\}\{([^{}]*)\}/g, '($1)/($2)');
  }

  // Convert simple powers/subscripts to typographic digits where possible.
  const superscripts: Record<string, string> = {
    '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
    '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
    '+': '⁺', '-': '⁻',
  };
  const subscripts: Record<string, string> = {
    '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄',
    '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉',
  };
  text = text
    .replace(/\^\{([0-9+-]+)\}/g, (_match, value: string) => [...value].map((char) => superscripts[char] || char).join(''))
    .replace(/\^([0-9])/g, (_match, value: string) => superscripts[value] || value)
    .replace(/_([0-9])/g, (_match, value: string) => subscripts[value] || value);

  // Tidy common Markdown decoration without removing the actual words.
  text = text
    .replace(/^\s{0,3}#{1,6}\s*/gm, '')
    .replace(/^\s{0,3}>\s?/gm, '')
    .replace(/^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/gm, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/\x60([^\x60]*)\x60/g, '$1')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '$1 — $2')
    .replace(/\\\\/g, '\n')
    .replace(/^\s*[-*+]\s+/gm, '• ')
    .replace(/[ \t]+\n/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return text;
}
