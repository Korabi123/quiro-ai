interface Constraint {
  variable: string;
  min: number;
  max: number;
  type: 'array' | 'number' | 'matrix';
}

interface GeneratedTestCase {
  input: string;
  expectedOutput?: string;
}

const parseConstraints = (content: string): Constraint[] => {
  const constraints: Constraint[] = [];

  const constraintsSectionMatch = content.match(/Constraints:([\s\S]*?)(?:\n\n|$)/i);
  if (!constraintsSectionMatch) return constraints;

  const constraintsText = constraintsSectionMatch[1];

  const lengthMatches = constraintsText.matchAll(/(\w+)\s*=\s*(\d+)\s*,\s*(\w+)\s*=\s*(\d+)|(\w+)\.length\s*,\s*(\w+)\.length|(\w+)\[(\w+)\]\s*,\s*(\w+)\[(\w+)\]/g);

  const arrayLengthPattern = /(\w+)\.length\s*,\s*(\w+)\.length\s*<=\s*(\d+)/g;
  let arrMatch;
  while ((arrMatch = arrayLengthPattern.exec(constraintsText)) !== null) {
    constraints.push({
      variable: `${arrMatch[1]}_length, ${arrMatch[2]}_length`,
      min: 1,
      max: parseInt(arrMatch[3]),
      type: 'array',
    });
  }

  const singleArrayPattern = /(\w+)\.length\s*<=\s*(\d+)/g;
  let singleMatch;
  while ((singleMatch = singleArrayPattern.exec(constraintsText)) !== null) {
    constraints.push({
      variable: `${singleMatch[1]}_length`,
      min: 1,
      max: parseInt(singleMatch[2]),
      type: 'array',
    });
  }

  const numberPattern = /(\w+)\s*<=\s*(\w+)\s*<=\s*(\d+)|(\d+)\s*<=\s*(\w+)\s*<=\s*(\d+)/g;
  let numMatch;
  while ((numMatch = numberPattern.exec(constraintsText)) !== null) {
    const min = parseInt(numMatch[1] || numMatch[4] || '1');
    const max = parseInt(numMatch[3] || numMatch[6] || numMatch[2] || '100');
    const varName = numMatch[2] || numMatch[5];
    if (varName && !varName.includes('length')) {
      constraints.push({
        variable: varName,
        min,
        max,
        type: 'number',
      });
    }
  }

  return constraints;
};

const getFunctionArgNames = (code: string, language: string): string[] => {
  if (language === 'javascript' || language === 'typescript') {
    const match = code.match(/function\s+\w+\s*\(([^)]+)\)|(?:var|const|let)\s+(\w+)\s*=\s*(?:function\s*)?\(([^)]+)\)/);
    if (match) {
      const argsStr = match[1] || match[3];
      if (argsStr) {
        return argsStr.split(',').map((a: string) => {
          const trimmed = a.trim();
          const colonIndex = trimmed.indexOf(':');
          return colonIndex > 0 ? trimmed.substring(0, colonIndex).trim() : trimmed;
        });
      }
    }

    const arrowMatch = code.match(/(?:const|let|var)\s+(\w+)\s*=\s*(?:\([^)]+\)|(?:\w+))\s*=>/);
    if (arrowMatch) {
      return [arrowMatch[1]];
    }
  }

  if (language === 'python') {
    const match = code.match(/def\s+(\w+)\s*\(([^)]+)\)/);
    if (match) {
      return match[2]
        .split(',')
        .map((a: string) => a.trim().split('=')[0].trim())
        .filter((a: string) => a !== 'self');
    }
  }

  if (language === 'rust') {
    const match = code.match(/fn\s+\w+\s*\(([^)]+)\)/);
    if (match) {
      return match[1]
        .split(',')
        .map((a: string) => {
          const parts = a.trim().split(':');
          return parts[0].trim().replace(/mut\s+/, '');
        })
        .filter((a: string) => a !== 'self' && a !== '&self' && a !== '&mut self');
    }
  }

  if (language === 'java' || language === 'csharp') {
    const match = code.match(/(?:public|private|static|\s)+\w+\s+\w+\s*\(([^)]+)\)/);
    if (match) {
      return match[1].split(',').map((a: string) => {
        const parts = a.trim().split(/\s+/);
        return parts[parts.length - 1];
      });
    }
  }

  if (language === 'cpp' || language === 'c') {
    const match = code.match(/(?:\w+[\s*&]+)+\w+\s*\(([^)]+)\)/);
    if (match) {
      return match[1].split(',').map((a: string) => {
        const parts = a.trim().split(/[\s*&]+/);
        return parts[parts.length - 1];
      }).filter((a: string) => {
        const lower = a.toLowerCase();
        return !lower.endsWith('size') && !lower.includes('returnsize');
      });
    }
  }

  if (language === 'go') {
    const match = code.match(/func\s+\w+\s*\(([^)]+)\)/);
    if (match) {
      return match[1].split(',').map((a: string) => {
        const parts = a.trim().split(/\s+/);
        return parts[0];
      });
    }
  }

  return ['nums', 'nums1', 'nums2', 'arr'];
};

const generateArray = (size: number, minVal: number, maxVal: number, sorted: boolean = false): number[] => {
  const arr: number[] = [];
  for (let i = 0; i < size; i++) {
    arr.push(Math.floor(Math.random() * (maxVal - minVal + 1)) + minVal);
  }
  if (sorted) {
    arr.sort((a, b) => b - a);
  }
  return arr;
};

const generateTestInput = (argNames: string[], constraints: Constraint[], problemContent: string): string => {
  const inputs: string[] = [];

  const argsLower = argNames.map(a => a.toLowerCase());

  const hasMultipleArrays = argNames.some(n => n.toLowerCase().includes('1') || n.toLowerCase().includes('2'));
  const isNonIncreasing = problemContent.toLowerCase().includes('non-increasing') || problemContent.toLowerCase().includes('nonincreasing');
  const isNonDecreasing = problemContent.toLowerCase().includes('non-decreasing') || problemContent.toLowerCase().includes('nondecreasing');
  const isSorted = problemContent.toLowerCase().includes('sorted');

  for (let i = 0; i < argNames.length; i++) {
    const argName = argNames[i].toLowerCase();

    let size: number;
    let minVal = 1;
    let maxVal = 100;

    const sizeConstraint = constraints.find(c => c.type === 'array');
    if (sizeConstraint) {
      size = Math.floor(Math.random() * Math.min(10, sizeConstraint.max - sizeConstraint.min + 1)) + Math.max(1, sizeConstraint.min);
    } else {
      size = Math.floor(Math.random() * 10) + 1;
    }

    const numConstraint = constraints.find(c => c.type === 'number');
    if (numConstraint) {
      minVal = numConstraint.min;
      maxVal = numConstraint.max;
    }

    if (argName.includes('nums') || argName.includes('arr')) {
      if (isNonIncreasing) {
        inputs.push(JSON.stringify(generateArray(size, minVal, maxVal, true)));
      } else if (isNonDecreasing) {
        const arr = generateArray(size, minVal, maxVal, false).sort((a, b) => a - b);
        inputs.push(JSON.stringify(arr));
      } else if (isSorted) {
        inputs.push(JSON.stringify(generateArray(size, minVal, maxVal, true)));
      } else {
        inputs.push(JSON.stringify(generateArray(size, minVal, maxVal)));
      }
    } else if (argName.includes('target') || argName.includes('k') || argName.includes('val')) {
      inputs.push(Math.floor(Math.random() * (maxVal - minVal + 1) + minVal).toString());
    } else {
      inputs.push(JSON.stringify(generateArray(size, minVal, maxVal)));
    }
  }

  return inputs.join(', ');
};

const generateEdgeCases = (argNames: string[], constraints: Constraint[]): string[] => {
  const cases: string[] = [];

  const sizeConstraint = constraints.find(c => c.type === 'array');
  const maxSize = sizeConstraint?.max || 100;

  cases.push(argNames.map(() => '[]').join(', '));

  if (maxSize >= 1) {
    cases.push(argNames.map((n, i) => i === 0 ? '[1]' : '[1]').join(', '));
  }

  if (maxSize >= 2) {
    cases.push(argNames.map((n, i) => '[1, 2]').join(', '));
  }

  const numConstraint = constraints.find(c => c.type === 'number');
  if (numConstraint) {
    cases.push(argNames.map((n, i) => i === 0 ? `[${numConstraint.max}]` : `[${numConstraint.max}]`).join(', '));
  }

  return cases;
};

export const generateHiddenTestCases = (
  code: string,
  language: string,
  problemContent: string,
  count: number = 30
): { input: string; isEdge: boolean }[] => {
  const constraints = parseConstraints(problemContent);
  const argNames = getFunctionArgNames(code, language);

  const testCases: { input: string; isEdge: boolean }[] = [];

  const edgeCases = generateEdgeCases(argNames, constraints);
  edgeCases.forEach(input => {
    testCases.push({ input, isEdge: true });
  });

  const remainingCount = count - testCases.length;
  for (let i = 0; i < remainingCount; i++) {
    const input = generateTestInput(argNames, constraints, problemContent);
    testCases.push({ input, isEdge: false });
  }

  return testCases;
};

export const parseConstraintsFromContent = parseConstraints;
