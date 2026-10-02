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
  /**
   * True when polling gave up while Judge0 was still In Queue or Processing.
   *
   * Added because a pending status used to be indistinguishable from a terminal
   * one, so a slow submission was reported to the user as a failed test.
   */
  timedOut?: boolean;
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
/**
 * Judge0 status ids.
 *
 * 1 and 2 are *not* terminal. Exposing them as named constants matters because
 * the polling loop below used to be able to return one of them to a caller that
 * then treated the run as a genuine failure.
 */
const JUDGE0_IN_QUEUE = 1;
const JUDGE0_PROCESSING = 2;
const JUDGE0_ACCEPTED = 3;

/** True when Judge0 has actually finished with the submission. */
const isPendingStatus = (statusId: number): boolean =>
  statusId === JUDGE0_IN_QUEUE || statusId === JUDGE0_PROCESSING;

/**
 * Polls until Judge0 reports a terminal status.
 *
 * `maxAttempts` bounds the wait so a stuck submission cannot hang a worker
 * forever. When the budget is exhausted while the run is still In Queue or
 * Processing, the pending status is preserved on the result as `timedOut`
 * rather than being flattened into a failure.
 *
 * This distinction is the whole point: the caller computes `passed` from
 * `status.id === 3`, so returning a pending status from an exhausted poll loop
 * reported "your solution failed this test" for a run that had simply not
 * finished yet.
 */
export const getExecutionResult = async (
  token: string,
  { maxAttempts = 20, pollIntervalMs = 1000 } = {}
): Promise<ExecuteResult> => {
  let result!: ExecuteResult;
  let attempts = 0;
  let timedOut = false;

  do {
    const response = await fetch(
      `${process.env.JUDGE0_API_URL}/submissions/${token}`,
      {
        headers: {
          "X-Auth-Token": process.env.JUDGE0_TOKEN!,
        },
        //* Without this, an unresponsive Judge0 holds the socket open until the
        //* platform's own timeout, well past the step's budget.
        signal: AbortSignal.timeout(15_000),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to get result: ${response.statusText}`);
    }

    result = await response.json();
    console.log("Poll result:", result.status.description, "attempt:", attempts + 1);

    if (isPendingStatus(result.status.id)) {
      await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
      attempts++;
    } else {
      break;
    }
  } while (attempts < maxAttempts);

  if (isPendingStatus(result?.status?.id)) {
    timedOut = true;
  }

  return { ...result, timedOut };
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