/**
 * Parse markdown-formatted problem statement into structured sections
 * Handles LeetCode-style format with headers and code blocks
 */

export function parseProblemStatement(problemStatement) {
  if (!problemStatement) {
    return {
      title: '',
      description: '',
      inputFormat: '',
      constraints: '',
      outputFormat: '',
      samples: [],
      hint: ''
    };
  }

  const sections = {
    title: '',
    description: '',
    inputFormat: '',
    constraints: '',
    outputFormat: '',
    samples: [],
    hint: ''
  };

  // Extract title (first line or first **header**)
  const titleMatch = problemStatement.match(/^\*\*(.+?)\*\*/);
  if (titleMatch) {
    sections.title = titleMatch[1].trim();
  }

  // Extract Problem Description
  // Try format 1: **Problem Description:** or **Description:**
  let descMatch = problemStatement.match(/\*\*(?:Problem )?Description:\*\*\s*([\s\S]*?)(?=\*\*|$)/i);
  if (descMatch) {
    sections.description = descMatch[1].trim();
  } else {
    // Try format 2: [description in brackets] after title
    const bracketMatch = problemStatement.match(/^\*\*[^\*]+\*\*\s*\n\s*\[([^\]]+)\]/);
    if (bracketMatch) {
      sections.description = bracketMatch[1].trim();
    }
  }

  // Extract Input Format
  // Try both "**Input Format:**" and "**Input:**"
  const inputMatch = problemStatement.match(/\*\*Input(?:\s+Format)?:\*\*\s*([\s\S]*?)(?=\*\*|$)/i);
  if (inputMatch) {
    sections.inputFormat = inputMatch[1].trim();
  }

  // Extract Constraints
  const constraintsMatch = problemStatement.match(/\*\*Constraints:\*\*\s*([\s\S]*?)(?=\*\*|$)/i);
  if (constraintsMatch) {
    sections.constraints = constraintsMatch[1].trim();
  }

  // Extract Output Format
  // Try both "**Output Format:**" and "**Output:**"
  const outputMatch = problemStatement.match(/\*\*Output(?:\s+Format)?:\*\*\s*([\s\S]*?)(?=\*\*|$)/i);
  if (outputMatch) {
    sections.outputFormat = outputMatch[1].trim();
  }

  // Extract Sample Inputs/Outputs
  const samplePattern = /\*\*Sample Input (\d+):\*\*\s*```\s*([\s\S]*?)```\s*\*\*Sample Output \1:\*\*\s*```\s*([\s\S]*?)```\s*\*\*Explanation \1:\*\*\s*([\s\S]*?)(?=\*\*Sample|$)/gi;
  
  let sampleMatch;
  while ((sampleMatch = samplePattern.exec(problemStatement)) !== null) {
    sections.samples.push({
      index: sampleMatch[1],
      input: sampleMatch[2].trim(),
      output: sampleMatch[3].trim(),
      explanation: sampleMatch[4].trim()
    });
  }

  return sections;
}

/**
 * Format text content - handle bullet points and line breaks
 */
export function formatTextContent(text) {
  if (!text) return '';
  
  return text
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .join('\n');
}
