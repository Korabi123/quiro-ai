import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { executeCode, compareOutput } from "@/lib/execute";
import { generateHiddenTestCases } from "@/lib/test-case-generator";
import type { TestCaseResult } from "@/lib/problems";

const parseTestInput = (input: string): string[] => {
  const args: string[] = [];
  let currentArg = "";
  let depth = 0;

  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    if (char === '[') depth++;
    if (char === ']') depth--;

    if (char === ',' && depth === 0) {
      args.push(currentArg.trim());
      currentArg = "";
    } else {
      currentArg += char;
    }
  }

  if (currentArg.trim()) {
    args.push(currentArg.trim());
  }

  // Strip named arguments (e.g., "nums1 = [1,2]" -> "[1,2]")
  return args.map(arg => {
    const parts = arg.split('=');
    if (parts.length > 1) {
      // Check if the left side looks like a variable name
      if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(parts[0].trim())) {
        return parts.slice(1).join('=').trim();
      }
    }
    return arg;
  });
};

const wrapCodeForExecution = (code: string, language: string, testInput: string): string => {
  const lang = language.toLowerCase();
  const args = parseTestInput(testInput);

  if (lang === "javascript" || lang === "typescript") {
    const lines = code.split('\n');
    const cleanParts = lines.filter(line => {
      const trimmed = line.trim();
      return !trimmed.startsWith('// Test') && !trimmed.startsWith('console.log');
    });
    const cleanCode = cleanParts.join('\n');

    const funcMatch = cleanCode.match(/function\s+(\w+)|var\s+(\w+)\s*=/);
    const funcName = funcMatch?.[1];

    if (funcName && testInput) {
      return `${cleanCode}\n\nconsole.log(JSON.stringify(${funcName}(${args.join(', ')})));`;
    }
  }

  if (lang === "python") {
    const lines = code.split('\n');
    const cleanParts = lines.filter(line => !line.trim().startsWith('#') && !line.trim().startsWith('print'));
    const cleanCode = cleanParts.join('\n');
    const funcMatch = cleanCode.match(/def\s+(\w+)\s*\(/);
    const funcName = funcMatch?.[1];

    if (funcName && testInput) {
      const isMethod = cleanCode.match(new RegExp(`def\\s+${funcName}\\s*\\(\\s*self`));
      const hasSolutionClass = cleanCode.includes('class Solution');

      if (hasSolutionClass && isMethod) {
        return `${cleanCode}\n\nsol = Solution()\nprint(sol.${funcName}(${args.join(', ')}))`;
      }
      return `${cleanCode}\n\nprint(${funcName}(${args.join(', ')}))`;
    }
  }

  if (lang === "rust") {
    // Don't filter out lines anymore, it's too dangerous and breaks valid code.
    // Instead, just use the code as is.
    const cleanCode = code;

    // Improved regex to find the main function name while ignoring visibility modifiers
    const funcMatch = cleanCode.match(/(?:pub\s+)?fn\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/);
    const funcName = funcMatch?.[1];

    const rustArgs = args.map(arg => {
      const trimmed = arg.trim();
      // Recursive function to wrap arrays in vec![]
      const wrapInVec = (val: string): string => {
        val = val.trim();
        if (val.startsWith('[') && val.endsWith(']')) {
          const inner = val.slice(1, -1);
          let depth = 0;
          let parts = [];
          let current = "";
          for (let i = 0; i < inner.length; i++) {
            if (inner[i] === '[') depth++;
            if (inner[i] === ']') depth--;
            if (inner[i] === ',' && depth === 0) {
              parts.push(current.trim());
              current = "";
            } else {
              current += inner[i];
            }
          }
          if (current.trim()) parts.push(current.trim());
          return `vec![${parts.map(wrapInVec).join(', ')}]`;
        }
        return val;
      };
      return wrapInVec(trimmed);
    });

    if (funcName && testInput) {
      const isImpl = cleanCode.includes('impl Solution');
      const needsStruct = isImpl && !cleanCode.includes('struct Solution');
      // Check if it's a method (has &self or self) or a static function
      const isMethod = cleanCode.match(new RegExp(`fn\\s+${funcName}\\s*\\(\\s*&?self`));

      return `
${needsStruct ? 'struct Solution;' : ''}
${cleanCode}

fn main() {
    ${isImpl && isMethod ? 'let sol = Solution;' : ''}
    println!("{:?}", ${isImpl ? (isMethod ? 'sol.' : 'Solution::') : ''}${funcName}(${rustArgs.join(', ')}));
}
      `;
    }
  }

  if (lang === "java") {
    const cleanCode = code.replace(/public\s+class\s+\w+/, 'class Solution');
    const funcMatch = cleanCode.match(/(?:public|private|static|\s)+\w+\s+(\w+)\s*\(/);
    const funcName = funcMatch?.[1];

    if (funcName && testInput) {
      const javaArgs = args.map(arg => {
        const trimmed = arg.trim();
        if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
          return `new int[]${trimmed.replace(/\[/g, '{').replace(/\]/g, '}')}`;
        }
        return trimmed;
      });

      return `
import java.util.*;

${cleanCode}

public class Main {
    public static void main(String[] args) {
        Solution sol = new Solution();
        Object result = sol.${funcName}(${javaArgs.join(', ')});
        if (result instanceof int[]) {
            System.out.println(Arrays.toString((int[])result));
        } else if (result instanceof Object[]) {
            System.out.println(Arrays.deepToString((Object[])result));
        } else {
            System.out.println(result);
        }
    }
}
      `;
    }
  }

  if (lang === "cpp") {
    // Improved regex to capture return type and function name, handling templates like vector<int>
    const funcMatch = code.match(/((?:[\w:<>&*]+\s+)+)(\w+)\s*\(/);
    const funcName = funcMatch?.[2];
    const returnType = funcMatch?.[1].trim();

    if (funcName && testInput) {
      let declarations = "";
      let callArgs: string[] = [];
      
      args.forEach((arg, i) => {
        const trimmed = arg.trim();
        const varName = `arg_${i}`;
        if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
          declarations += `    vector<int> ${varName} = {${trimmed.slice(1, -1)}};\n`;
          callArgs.push(varName);
        } else {
          callArgs.push(trimmed);
        }
      });

      const isVectorReturn = returnType?.includes('vector');

      return `
#include <iostream>
#include <vector>
#include <string>
#include <algorithm>
#include <map>
#include <set>
#include <queue>
#include <stack>
#include <unordered_map>
#include <unordered_set>

using namespace std;

${code}

int main() {
    Solution sol;
${declarations}
    ${isVectorReturn ? 'auto result = ' : 'auto result = ' }sol.${funcName}(${callArgs.join(', ')});
    
    ${isVectorReturn ? `
    cout << "[";
    for (size_t i = 0; i < result.size(); ++i) {
        cout << result[i] << (i == result.size() - 1 ? "" : ",");
    }
    cout << "]" << endl;
    ` : `cout << result << endl;`}
    return 0;
}
      `;
    }
  }

  if (lang === "csharp") {
    const funcMatch = code.match(/(?:public|private|static|\s)+\w+\s+(\w+)\s*\(/);
    const funcName = funcMatch?.[1];

    if (funcName && testInput) {
      const csArgs = args.map(arg => {
        const trimmed = arg.trim();
        if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
          return `new int[]${trimmed.replace(/\[/g, '{').replace(/\]/g, '}')}`;
        }
        return trimmed;
      });

      return `
using System;
using System.Collections.Generic;
using System.Linq;

${code}

public class Program {
    public static void Main() {
        Solution sol = new Solution();
        object result = sol.${funcName}(${csArgs.join(', ')});
        if (result is Array arr) {
            Console.WriteLine("[" + string.Join(",", arr.Cast<object>()) + "]");
        } else {
            Console.WriteLine(result);
        }
    }
}
      `;
    }
  }

  if (lang === "go") {
    const funcMatch = code.match(/func\s+(\w+)\s*\(/);
    const funcName = funcMatch?.[1];

    if (funcName && testInput) {
      const goArgs = args.map(arg => {
        const trimmed = arg.trim();
        if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
          return `[]int${trimmed.replace(/\[/g, '{').replace(/\]/g, '}')}`;
        }
        return trimmed;
      });

      return `
package main
import (
    "fmt"
)

${code}

func main() {
    fmt.Println(${funcName}(${goArgs.join(', ')}))
}
      `;
    }
  }

  if (lang === "c") {
    // Improved regex to capture return type, name, and parameters
    const funcMatch = code.match(/((?:\w+[\s*&]+)+)(\w+)\s*\(([^)]*)\)/);
    if (funcMatch && testInput) {
      const returnType = funcMatch[1].trim();
      const funcName = funcMatch[2];
      const paramsStr = funcMatch[3];
      
      let declarations = "";
      let callArgs: string[] = [];
      let argIdx = 0;

      // Split parameters to understand the signature
      const params = paramsStr.split(',').map(p => p.trim());
      
      params.forEach((param) => {
        if (param.toLowerCase().includes('returnsize')) {
          declarations += `    int returnSize = 0;\n`;
          callArgs.push(`&returnSize`);
        } else if (param.toLowerCase().endsWith('size')) {
          // This is handled by the previous array argument
        } else {
          // This is a "logical" argument from our parsed testInput
          const arg = args[argIdx++];
          if (!arg) return;

          const trimmed = arg.trim();
          if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
            const inner = trimmed.slice(1, -1);
            const arrayName = `arr_${argIdx}`;
            declarations += `    int ${arrayName}[] = {${inner}};\n`;
            callArgs.push(arrayName);
            
            // If the NEXT parameter is a Size parameter, pass the length
            const nextParam = params[params.indexOf(param) + 1];
            if (nextParam && nextParam.toLowerCase().endsWith('size')) {
              const elements = inner.split(',').filter(s => s.trim());
              callArgs.push(`${elements.length}`);
            }
          } else {
            callArgs.push(trimmed);
          }
        }
      });

      const isPointerReturn = returnType.includes('*');

      return `
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <math.h>

${code}

int main() {
${declarations}
    ${isPointerReturn ? returnType + ' result = ' : 'int result = '}${funcName}(${callArgs.join(', ')});
    
    ${isPointerReturn ? `
    printf("[");
    for (int i = 0; i < returnSize; i++) {
        printf("%d%s", result[i], (i == returnSize - 1) ? "" : ",");
    }
    printf("]\\n");
    free(result);
    ` : `printf("%d\\n", result);`}
    return 0;
}
      `;
    }
  }

  return code;
};

export const POST = async (req: Request) => {
  try {
    const session = await auth.api.getSession(req);

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { code, language, testCases, problemContent, generateHidden } = await req.json();

    let activeTestCases = testCases || [];

    if (generateHidden && code && language && problemContent) {
      const hiddenCases = generateHiddenTestCases(code, language, problemContent, 30);
      activeTestCases = [
        ...testCases || [],
        ...hiddenCases.map(h => ({ input: h.input, output: '' }))
      ];
    }

    if (!code || !language || !activeTestCases || !Array.isArray(activeTestCases)) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    const results: TestCaseResult[] = [];

    for (const testCase of activeTestCases) {
      try {
        const wrappedCode = wrapCodeForExecution(code, language, testCase.input);
        const execResult = await executeCode(wrappedCode, language, "");

        let actualOutput = (execResult.stdout || "").trim();
        try {
          // Try to parse if it's JSON (common for array outputs)
          const parsed = JSON.parse(actualOutput);
          actualOutput = JSON.stringify(parsed);
        } catch {}

        const hasExpected = testCase.output && testCase.output.trim() !== '';
        const isHidden = !hasExpected;

        // Collect all error information
        const errorDetails = [
          execResult.compile_output,
          execResult.stderr,
          execResult.message
        ].filter(Boolean).join("\n").trim();

        let passed = execResult.status.id === 3; // Must be "Accepted" status

        if (passed) {
          if (hasExpected) {
            passed = compareOutput(actualOutput, testCase.output);
          } else {
            // For hidden cases, we just need a non-empty output and no errors
            passed = actualOutput.length > 0;
          }
        }

        results.push({
          input: testCase.input,
          expectedOutput: testCase.output,
          actualOutput,
          passed,
          stderr: errorDetails || undefined,
          time: execResult.time || "0",
          memory: execResult.memory || 0,
          isHidden,
        });
      } catch (error) {
        results.push({
          input: testCase.input,
          expectedOutput: testCase.output,
          actualOutput: "",
          passed: false,
          stderr: error instanceof Error ? error.message : "Execution failed",
        });
      }
    }

    const visibleResults = results.filter(r => !r.isHidden);
    const hiddenResults = results.filter(r => r.isHidden);

    const visiblePassed = visibleResults.filter(r => r.passed).length;
    const visibleTotal = visibleResults.length;
    const hiddenPassed = hiddenResults.filter(r => r.passed).length;
    const hiddenTotal = hiddenResults.length;
    const passedCount = results.filter(r => r.passed).length;
    const totalCount = results.length;

    return NextResponse.json({
      results,
      summary: {
        passed: passedCount,
        total: totalCount,
        allPassed: passedCount === totalCount,
        visiblePassed,
        visibleTotal,
        hiddenPassed,
        hiddenTotal,
      }
    });
  } catch (error) {
    console.log("ERROR EXECUTING BATCH: ", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
};
