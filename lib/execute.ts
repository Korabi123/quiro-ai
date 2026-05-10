import { fetcher } from "./fetcher";

interface ExecuteResult {
  stdout: string | null;
  stderr: string | null;
  compile_output: string | null;
  message: string | null;
  exit_code: number | null;
  time: string | null;
  memory: number | null;
  status: {
    id: number;
    description: string;
  };
}

const LANGUAGE_IDS: Record<string, number> = {
  javascript: 63,
  typescript: 74,
  python: 71,
  java: 62,
  cpp: 54,
  c: 50,
  csharp: 51,
  go: 60,
  rust: 73,
};

export const getLanguageId = (language: string): number => {
  return LANGUAGE_IDS[language] || 71;
};

export const submitToJudge0 = async (
  sourceCode: string,
  languageId: number,
  stdin: string = ""
): Promise<{ token: string }> => {
  const response = await fetch(`${process.env.JUDGE0_API_URL}/submissions`, {
    method: "POST",
    headers: {
      "X-Auth-Token": process.env.JUDGE0_TOKEN!,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      source_code: sourceCode,
      language_id: languageId,
      stdin: stdin,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Submit failed:", response.status, errorText);
    throw new Error(`Failed to submit: ${response.statusText}`);
  }

  return response.json();
};

export const getExecutionResult = async (token: string): Promise<ExecuteResult> => {
  let result: ExecuteResult;
  let attempts = 0;
  const maxAttempts = 20;
  
  do {
    const response = await fetch(
      `${process.env.JUDGE0_API_URL}/submissions/${token}`,
      {
        headers: {
          "X-Auth-Token": process.env.JUDGE0_TOKEN!,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to get result: ${response.statusText}`);
    }

    result = await response.json();
    console.log("Poll result:", result.status.description, "attempt:", attempts + 1);
    
    if (result.status.id === 1 || result.status.id === 2) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      attempts++;
    } else {
      break;
    }
  } while (attempts < maxAttempts);
  
  return result!;
};

export const executeCode = async (
  sourceCode: string,
  language: string,
  stdin: string = ""
): Promise<ExecuteResult> => {
  const languageId = getLanguageId(language);
  
  const { token } = await submitToJudge0(sourceCode, languageId, stdin);
  console.log("Got token:", token);
  
  const result = await getExecutionResult(token);
  console.log("Got result:", result.status);
  
  return result;
};

export const compareOutput = (actual: string | null | undefined, expected: string | null | undefined): boolean => {
  const normalize = (str: string | null | undefined) => (str || "").trim().replace(/\r\n/g, "\n");
  return normalize(actual) === normalize(expected);
};