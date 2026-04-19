import useSWR from "swr";
import { fetcher } from "./fetcher";

export interface ProblemType {
  questionId: string;
  title: string;
  slug: string;
  content: string;
  likes: number;
  dislikes: number;
  stats: string;
  categoryTitle: string;
  hints: string[];
  topicTags: string[];
  difficulty: string;
  solution: {
    content: string;
  };
  codeSnippets: {
    lang: string;
    langSlug: string;
    code: string;
  }[];
  exampleTestcases: string;
}

export interface TestCase {
  input: string;
  output: string;
  explanation?: string;
}

export interface TestCaseResult {
  input: string;
  expectedOutput: string;
  actualOutput: string;
  passed: boolean;
  stderr?: string;
  time?: string;
  memory?: number;
  isHidden?: boolean;
}

const decodeHtmlEntities = (str: string): string => {
  return str
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&apos;/g, "'")
    .replace(/&#39;/g, "'");
};

const extractTestCases = (content: string, exampleTestcases?: string): TestCase[] => {
  const testCases: TestCase[] = [];
  
  const exampleRegex = /<strong>Input:<\/strong>\s*([^<]+)<strong>Output:<\/strong>\s*([^<]+)/g;
  let match;
  while ((match = exampleRegex.exec(content)) !== null) {
    const input = decodeHtmlEntities(match[1].replace(/<code>/g, '').replace(/<\/code>/g, '').trim());
    const output = decodeHtmlEntities(match[2].replace(/<code>/g, '').replace(/<\/code>/g, '').trim());
    
    const explanationMatch = content.substring(match.index).match(/<strong>Explanation:<\/strong>\s*([^<]+)<\/p>/);
    const explanation = explanationMatch ? decodeHtmlEntities(explanationMatch[1].trim()) : undefined;
    
    testCases.push({ input, output, explanation });
  }
  
  if (testCases.length === 0 && exampleTestcases) {
    const lines = exampleTestcases.split('\n').filter(line => line.trim());
    for (let i = 0; i < lines.length; i += 2) {
      if (lines[i + 1]) {
        testCases.push({
          input: lines[i].trim(),
          output: lines[i + 1].trim()
        });
      }
    }
  }
  
  return testCases;
};

export const useProblem = (slug: string) => {
  const { data, error, isLoading } = useSWR<ProblemType>(
    `https://leetcode-api-pied.vercel.app/problem/${slug}`,
    fetcher,
  );
  
  const testCases = data 
    ? extractTestCases(data.content, data.exampleTestcases)
    : [];
  
  return { 
    data: data ? { ...data, testCases } : undefined, 
    error, 
    isLoading 
  };
};

interface RawProblem {
  questionId: string;
  title: string;
  titleSlug: string;
  difficulty: string;
}

interface DailyProblemResponse {
  question: {
    questionFrontendId: string;
    title: string;
    titleSlug: string;
    difficulty: string;
  };
}

export interface Problem {
  id: string;
  title: string;
  slug: string;
  difficulty: "Easy" | "Medium" | "Hard";
  isDaily?: boolean;
}

const formatDifficulty = (d: string): "Easy" | "Medium" | "Hard" => {
  return d.charAt(0).toUpperCase() + d.slice(1).toLowerCase() as "Easy" | "Medium" | "Hard";
};

export const useProblems = () => {
  const { data, error, isLoading } = useSWR<Problem[]>(
    "problems-list",
    async () => {
      const [problemsRes, dailyRes] = await Promise.all([
        fetch("https://leetcode-api-pied.vercel.app/problems"),
        fetch("https://leetcode-api-pied.vercel.app/daily"),
      ]);

      const [rawProblems, dailyProblem]: [RawProblem[], DailyProblemResponse] = await Promise.all([
        problemsRes.json(),
        dailyRes.json(),
      ]);

      const dailyProblemData: Problem | null = dailyProblem.question ? {
        id: dailyProblem.question.questionFrontendId,
        title: dailyProblem.question.title,
        slug: dailyProblem.question.titleSlug,
        difficulty: formatDifficulty(dailyProblem.question.difficulty),
        isDaily: true,
      } : null;

      const formattedProblems: Problem[] = rawProblems.map((problem: RawProblem) => ({
        id: problem.questionId,
        title: problem.title,
        slug: problem.titleSlug,
        difficulty: formatDifficulty(problem.difficulty),
      }));

      return dailyProblemData 
        ? [dailyProblemData, ...formattedProblems] 
        : formattedProblems;
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  return { data, error, isLoading };
};
