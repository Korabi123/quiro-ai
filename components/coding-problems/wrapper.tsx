"use client";

import { Suspense, useState, useMemo, useEffect } from "react";
import dynamic from "next/dynamic";
import { CodingProblemHeading } from "./heading";
import { useProblem } from "../../lib/problems";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { Loader2, CheckCircle2, XCircle, Sparkles, Check, Terminal, BookOpenText, FileCode, TestTube2 } from "lucide-react";
import SanitizedContent from "../sanitized-content";
import type { TestCase, TestCaseResult } from "@/lib/problems";
import { formatProblemTitle, cn } from "@/lib/utils";

const LANGUAGES = [
  { value: "javascript", label: "JavaScript", color: "bg-yellow-400" },
  { value: "typescript", label: "TypeScript", color: "bg-blue-400" },
  { value: "python", label: "Python", color: "bg-green-400" },
  { value: "java", label: "Java", color: "bg-orange-500" },
  { value: "cpp", label: "C++", color: "bg-blue-500" },
  { value: "c", label: "C", color: "bg-gray-400" },
  { value: "csharp", label: "C#", color: "bg-purple-400" },
  { value: "go", label: "Go", color: "bg-cyan-400" },
  { value: "rust", label: "Rust", color: "bg-orange-600" },
];

const Editor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-full text-muted-foreground">Loading editor...</div>,
});

const generateCodeTemplate = (language: string, problemTitle: string): string => {
  const templates: Record<string, string> = {
    javascript: `// ${problemTitle} - JavaScript Solution
/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number[]}
 */
var twoSum = function(nums, target) {
    // TODO: Implement your solution here
    const map = new Map();
    for (let i = 0; i < nums.length; i++) {
        const complement = target - nums[i];
        if (map.has(complement)) {
            return [map.get(complement), i];
        }
        map.set(nums[i], i);
    }
    return [];
};`,
    typescript: `// ${problemTitle} - TypeScript Solution
function twoSum(nums: number[], target: number): number[] {
    // TODO: Implement your solution here
    const map = new Map<number, number>();
    for (let i = 0; i < nums.length; i++) {
        const complement = target - nums[i];
        if (map.has(complement)) {
            return [map.get(complement)!, i];
        }
        map.set(nums[i], i);
    }
    return [];
}`,
    python: `# ${problemTitle} - Python Solution
from typing import List

def twoSum(nums: List[int], target: int) -> List[int]:
    # TODO: Implement your solution here
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    return []

# Test
print(twoSum([2,7,11,15], 9)) # Expected: [0,1]`,
    java: `// ${problemTitle} - Java Solution
class Solution {
    public int[] twoSum(int[] nums, int target) {
        // TODO: Implement your solution here
        HashMap<Integer, Integer> map = new HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            int complement = target - nums[i];
            if (map.containsKey(complement)) {
                return new int[] { map.get(complement), i };
            }
            map.put(nums[i], i);
        }
        return new int[] {};
    }
}

// Test
Solution sol = new Solution();
System.out.println(Arrays.toString(sol.twoSum(new int[]{2,7,11,15}, 9))); // Expected: [0,1]`,
    cpp: `// ${problemTitle} - C++ Solution
class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        // TODO: Implement your solution here
        unordered_map<int, int> map;
        for (int i = 0; i < nums.size(); i++) {
            int complement = target - nums[i];
            if (map.find(complement) != map.end()) {
                return {map[complement], i};
            }
            map[nums[i]] = i;
        }
        return {};
    }
};

// Test
Solution sol;
vector<int> nums = {2,7,11,15};
auto result = sol.twoSum(nums, 9);
for (int idx : result) cout << idx << " "; // Expected: 0 1`,
    c: `// ${problemTitle} - C Solution
/**
 * Note: The returned array must be either in order.
 */
int* twoSum(int* nums, int numsSize, int target, int* returnSize) {
    // TODO: Implement your solution here
    *returnSize = 2;
    int* result = (int*)malloc(2 * sizeof(int));
    for (int i = 0; i < numsSize; i++) {
        for (int j = i + 1; j < numsSize; j++) {
            if (nums[i] + nums[j] == target) {
                result[0] = i;
                result[1] = j;
                return result;
            }
        }
    }
    return result;
}

// Test
// int nums[] = {2,7,11,15};
// int returnSize;
// int* result = twoSum(nums, 4, 9, &returnSize);`,
    csharp: `// ${problemTitle} - C# Solution
public class Solution {
    public int[] TwoSum(int[] nums, int target) {
        // TODO: Implement your solution here
        var dict = new Dictionary<int, int>();
        for (int i = 0; i < nums.Length; i++) {
            int complement = target - nums[i];
            if (dict.ContainsKey(complement)) {
                return new int[] { dict[complement], i };
            }
            dict[nums[i]] = i;
        }
        return Array.Empty<int>();
    }
}

// Test
var sol = new Solution();
var result = sol.TwoSum(new int[] {2,7,11,15}, 9);
Console.WriteLine(string.Join(", ", result)); // Expected: 0, 1`,
    go: `// ${problemTitle} - Go Solution
func twoSum(nums []int, target int) []int {
    // TODO: Implement your solution here
    seen := make(map[int]int)
    for i, num := range nums {
        complement := target - num
        if j, ok := seen[complement]; ok {
            return []int{j, i}
        }
        seen[num] = i
    }
    return []int{}
}

// Test
result := twoSum([]int{2,7,11,15}, 9)
fmt.Println(result) // Expected: [0 1]`,
    rust: `// ${problemTitle} - Rust Solution
use std::collections::HashMap;

struct Solution;

impl Solution {
    pub fn two_sum(nums: Vec<i32>, target: i32) -> Vec<i32> {
        // TODO: Implement your solution here
        let mut map = HashMap::new();
        for (i, &num) in nums.iter().enumerate() {
            let complement = target - num;
            if let Some(&j) = map.get(&complement) {
                return vec![j, i as i32];
            }
            map.insert(num, i as i32);
        }
        vec![]
    }
}

// Test
// let result = Solution::two_sum(vec![2,7,11,15], 9);
// println!("{:?}", result); // Expected: [0, 1]`,
  };
  return templates[language] || templates.typescript;
};

export default function ProblemWrapper({ slug }: { slug: string }) {
  const { data, isLoading } = useProblem(slug);
  const [language, setLanguage] = useState(() => LANGUAGES[1].value);
  const [tab, setTab] = useState<"test-cases" | "ai-grade">("test-cases");

  const initialCode = useMemo(() => {
    return generateCodeTemplate(language, formatProblemTitle(data?.title || "Problem"));
  }, [data?.title]);

  const [editorCode, setEditorCode] = useState(initialCode);

  useEffect(() => {
    setEditorCode(generateCodeTemplate(language, formatProblemTitle(data?.title || "Problem")));
  }, [data?.title, language]);

  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage);
    setEditorCode(generateCodeTemplate(newLanguage, formatProblemTitle(data?.title || "Problem")));
  };

  const [isGrading, setIsGrading] = useState(false);
  const [gradingResult, setGradingResult] = useState<{
    correctnessScore: number;
    efficiencyScore: number;
    codeQualityScore: number;
    bestPracticeScore: number;
    totalScore: number;
    timeComplexity: string;
    spaceComplexity: string;
    summary: string;
    strengths: string[];
    improvements: string[];
  } | null>(null);
  const [testCaseResults, setTestCaseResults] = useState<TestCaseResult[]>([]);
  const [isRunningTest, setIsRunningTest] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sampleInput = data?.testCases?.[0]?.input || "";
  const sampleOutput = data?.testCases?.[0]?.output || "";
  const allTestCases = data?.testCases || [];

  useEffect(() => {
    if (gradingResult) {
      setTab("ai-grade");
    }
  }, [gradingResult]);

  const handleTest = async () => {
    const testCases = data?.testCases;
    if (!testCases || testCases.length === 0) {
      toast.error("No test cases available for this problem");
      return;
    }

    setIsRunningTest(true);
    setTestCaseResults([]);
    setTab("test-cases");

    const testPromise = (async () => {
      const response = await fetch("/api/execute-batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: editorCode,
          language,
          testCases: testCases,
        }),
      });

      const result = await response.json();

      if (response.ok && result.error) {
        throw new Error(result.error);
      }

      setTestCaseResults(result.results || []);

      const passedCount = result.summary?.passed || 0;
      const totalCount = result.summary?.total || 0;

      return `${passedCount}/${totalCount} tests passed`;
    })();

    toast.promise(testPromise, {
      loading: "Running tests...",
      success: (message) => message,
      error: (err) => err.message || "Failed to run tests",
    });

    try {
      await testPromise;
    } finally {
      setIsRunningTest(false);
    }
  };

  const handleSubmit = async () => {
    const testCases = data?.testCases;
    if (!testCases || testCases.length === 0) {
      toast.error("No test cases available for this problem");
      return;
    }

    setIsSubmitting(true);
    setTestCaseResults([]);
    setTab("test-cases");

    const submitPromise = (async () => {
      const response = await fetch("/api/execute-batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: editorCode,
          language,
          testCases: testCases,
          problemContent: data?.content || "",
          generateHidden: true,
        }),
      });

      const result = await response.json();

      if (response.ok && result.error) {
        throw new Error(result.error);
      }

      setTestCaseResults(result.results || []);

      const passedCount = result.summary?.passed || 0;
      const totalCount = result.summary?.total || 0;
      const allPassed = result.summary?.allPassed || false;
      const visiblePassed = result.summary?.visiblePassed || 0;
      const visibleTotal = result.summary?.visibleTotal || 0;
      const hiddenPassed = result.summary?.hiddenPassed || 0;
      const hiddenTotal = result.summary?.hiddenTotal || 0;
      const hasHidden = hiddenTotal > 0;

      if (allPassed) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      }

      await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problemSlug: slug,
          code: editorCode,
          language,
          output: result.results?.[0]?.actualOutput || "",
          isCorrect: allPassed,
          executionTime: result.results?.[0]?.time || "0",
          memoryUsage: result.results?.[0]?.memory?.toString() || "0",
          visiblePassedCount: visiblePassed,
          visibleTotalCount: visibleTotal,
          hiddenPassedCount: hiddenPassed,
          hiddenTotalCount: hiddenTotal,
        }),
      });

      if (allPassed) {
        return hasHidden
          ? `All tests passed! (${visiblePassed} sample, ${hiddenPassed} hidden)`
          : "All tests passed! Solution accepted!";
      }

      return hasHidden
        ? `${visiblePassed}/${visibleTotal} sample, ${hiddenPassed}/${hiddenTotal} hidden tests passed`
        : `${passedCount}/${totalCount} tests passed`;
    })();

    toast.promise(submitPromise, {
      loading: "Submitting...",
      success: (message) => message,
      error: (err) => err.message || "Failed to submit",
    });

    try {
      await submitPromise;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAIGrade = async () => {
    setIsGrading(true);
    const gradingPromise = fetch("/api/submissions/grade", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        problemSlug: slug,
        code: editorCode,
        language,
        output: testCaseResults[0]?.actualOutput || "",
        expectedOutput: sampleOutput,
      }),
    });

    toast.promise(gradingPromise, {
      loading: "Analyzing your code...",
      success: "Code review complete!",
      error: "Failed to analyze code",
    });

    try {
      const response = await gradingPromise;
      const grading = await response.json();
      setGradingResult(grading);
    } catch (error) {
      console.error("Grading error:", error);
    } finally {
      setIsGrading(false);
    }
  };

  return (
    <>
      {isLoading && <div>Loading...</div>}
      {data && (
        <Suspense>
          <div className="flex flex-col gap-4 h-[calc(100vh-140px)]">
            <div className="flex flex-col gap-4 md:px-10 px-4">
              <CodingProblemHeading secondary breadcrumb={formatProblemTitle(data.title)} />
              <div className="flex items-center gap-2">
                <Select value={language} onValueChange={handleLanguageChange}>
                  <SelectTrigger className="w-[180px] bg-white">
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    {LANGUAGES.map((lang) => (
                      <SelectItem key={lang.value} value={lang.value}>
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${lang.color}`} />
                          {lang.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  onClick={handleTest}
                  disabled={isRunningTest || isSubmitting}
                  variant="secondary"
                  className="gap-2 bg-white border"
                >
                  {isRunningTest ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Terminal className="size-4" />
                  )}
                  Test
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={isRunningTest || isSubmitting}
                  variant="default"
                  className="gap-2 bg-[#ea721b] hover:bg-[#ea721b]/90 text-white"
                >
                  {isSubmitting ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Check className="size-4" />
                  )}
                  Submit
                </Button>
                <Button
                  onClick={handleAIGrade}
                  disabled={isGrading || testCaseResults.length === 0}
                  variant="secondary"
                  className="gap-2 bg-white border"
                >
                  {isGrading ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Sparkles className="size-4 text-[#ea721b]" />
                  )}
                  AI Grade
                </Button>
              </div>
            </div>

            <ResizablePanelGroup direction="horizontal" className="flex-1 w-full gap-2 px-4 md:px-10 pb-4">
              <ResizablePanel defaultSize={40} minSize={20} className="w-0">
                <Card className="h-full w-full overflow-hidden flex flex-col border-border/50 bg-white">
                  <div className="px-4 -mt-3 flex items-center gap-2 border-b pb-3">
                    <BookOpenText className="size-4 text-[#ea721b]" />
                    <span className="text-sm font-semibold">Problem Instructions</span>
                  </div>
                  <CardContent className="flex-1 overflow-auto px-6">
                    <SanitizedContent htmlString={data.content} />
                  </CardContent>
                </Card>
              </ResizablePanel>

              <ResizableHandle withHandle />

              <ResizablePanel defaultSize={60} minSize={30} className="w-0">
                <ResizablePanelGroup direction="vertical" className="gap-2">
                  <ResizablePanel defaultSize={60} minSize={20}>
                    <Card className="h-full w-full overflow-hidden flex flex-col border-border/50 bg-white">
                      <div className="px-4 -mt-3 flex items-center gap-2 border-b pb-3">
                        <FileCode className="size-4 text-[#ea721b]" />
                        <span className="text-sm font-semibold">Code Editor</span>
                      </div>
                      <CardContent className="flex-1 p-0 overflow-hidden">
                        <Editor
                          height="100%"
                          width="100%"
                          language={language}
                          theme="vs-light"
                          value={editorCode}
                          onChange={(value) => setEditorCode(value || "")}
                          loading={<div className="p-4">Loading editor...</div>}
                          options={{
                            minimap: { enabled: false },
                            fontSize: 14,
                            scrollBeyondLastLine: false,
                            fontFamily: '"Fira Code", "Cascadia Code", Consolas, monospace',
                            fontLigatures: true,
                            automaticLayout: true,
                            cursorBlinking: "smooth",
                            smoothScrolling: true,
                            cursorSmoothCaretAnimation: "on",
                            contextmenu: true,
                            renderLineHighlight: "all",
                            lineHeight: 1.6,
                            letterSpacing: 0.5,
                            roundedSelection: true,
                            padding: { top: 10, bottom: 10 },
                            scrollbar: {
                              verticalScrollbarSize: 8,
                              horizontalScrollbarSize: 8
                            }
                          }}
                        />
                      </CardContent>
                    </Card>
                  </ResizablePanel>

                  <ResizableHandle withHandle />

                  <ResizablePanel defaultSize={10} minSize={10}>
                    <Card className="h-full w-full overflow-hidden flex flex-col border-border/50 bg-white">
                      <div className="px-4 -mt-3 flex items-center gap-4">
                        <Button
                          onClick={() => setTab("test-cases")}
                          variant={"ghost"}
                          className={cn(
                            "hover:bg-transparent rounded-none p-1 text-xs font-medium h-8 text-muted-foreground/70 flex items-center gap-1.5",
                            tab === "test-cases" &&
                              "border-b-2 border-b-[#ea721b] text-black"
                          )}
                        >
                          <TestTube2 className="size-3.5" />
                          Test Cases
                        </Button>
                        <Button
                          onClick={() => setTab("ai-grade")}
                          variant={"ghost"}
                          disabled={!gradingResult && !isGrading}
                          className={cn(
                            "hover:bg-transparent rounded-none p-1 text-xs font-medium h-8 text-muted-foreground/70 flex items-center gap-1.5",
                            tab === "ai-grade" &&
                              "border-b-2 border-b-[#ea721b] text-black"
                          )}
                        >
                          <Sparkles className="size-3.5" />
                          AI Grade
                        </Button>
                      </div>

                      <CardContent className="flex-1 overflow-auto px-4">
                        {tab === "test-cases" && (
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <h4 className="font-semibold text-sm">
                                {testCaseResults.length > 0
                                  ? (() => {
                                      const visible = testCaseResults.filter(r => !r.isHidden);
                                      const hidden = testCaseResults.filter(r => r.isHidden);
                                      const hasHidden = hidden.length > 0;
                                      const visiblePassed = visible.filter(r => r.passed).length;
                                      const hiddenPassed = hidden.filter(r => r.passed).length;
                                      return hasHidden
                                        ? `Test Results (${visiblePassed}/${visible.length} sample, ${hiddenPassed}/${hidden.length} hidden)`
                                        : `Test Results (${visiblePassed}/${visible.length} passed)`;
                                    })()
                                  : "Sample Test Cases"}
                              </h4>
                              {testCaseResults.length > 0 && (
                                <Badge
                                  variant={testCaseResults.every(r => r.passed) ? "default" : "destructive"}
                                  className={cn(
                                    testCaseResults.every(r => r.passed) ? "bg-green-500 hover:bg-green-600" : "bg-red-500 hover:bg-red-600",
                                    "gap-1"
                                  )}
                                >
                                  {testCaseResults.every(r => r.passed) ? (
                                    <><CheckCircle2 className="size-3" /> All Passed</>
                                  ) : (
                                    <><XCircle className="size-3" /> Failed</>
                                  )}
                                </Badge>
                              )}
                            </div>

                            {testCaseResults.length > 0 ? (
                              <div className="space-y-3">
                                {testCaseResults.filter(r => !r.isHidden).map((result, idx) => (
                                  <div key={idx} className="border border-border/60 rounded-xl p-3 bg-muted/10">
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="font-medium text-xs">Test Case {idx + 1}</span>
                                      {result.passed ? (
                                        <span className="text-green-600 text-[10px] font-bold uppercase tracking-wider bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20">Passed</span>
                                      ) : (
                                        <span className="text-red-600 text-[10px] font-bold uppercase tracking-wider bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">Failed</span>
                                      )}
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 text-xs">
                                      <div className="space-y-1">
                                        <p className="text-muted-foreground font-medium">Input</p>
                                        <pre className="bg-muted/50 p-2 rounded-lg border border-border/40 overflow-x-auto">{result.input}</pre>
                                      </div>
                                      <div className="space-y-1">
                                        <p className="text-muted-foreground font-medium">Expected</p>
                                        <pre className="bg-muted/50 p-2 rounded-lg border border-border/40 overflow-x-auto">{result.expectedOutput}</pre>
                                      </div>
                                    </div>
                                    {!result.passed && (
                                      <div className="mt-3 space-y-2">
                                        <div className="space-y-1">
                                          <p className="text-red-600 font-medium text-[10px] uppercase tracking-wider">Your Output</p>
                                          <pre className="bg-red-500/5 p-2 rounded-lg border border-red-500/10 text-red-600 overflow-x-auto text-[11px]">{result.actualOutput || "(empty)"}</pre>
                                        </div>
                                        {result.stderr && (
                                          <div className="space-y-1">
                                            <p className="text-amber-600 font-medium text-[10px] uppercase tracking-wider">Error Details</p>
                                            <pre className="bg-amber-500/5 p-2 rounded-lg border border-amber-500/10 text-amber-700 overflow-x-auto text-[11px]">{result.stderr}</pre>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="space-y-3">
                                {allTestCases.map((tc: TestCase, idx: number) => (
                                  <div key={idx} className="border border-border/60 rounded-xl p-3 bg-muted/10">
                                    <p className="font-medium text-xs mb-2">Test Case {idx + 1}</p>
                                    <div className="grid grid-cols-2 gap-3 text-xs">
                                      <div className="space-y-1">
                                        <p className="text-muted-foreground font-medium">Input</p>
                                        <pre className="bg-muted/50 p-2 rounded-lg border border-border/40 overflow-x-auto">{tc.input}</pre>
                                      </div>
                                      <div className="space-y-1">
                                        <p className="text-muted-foreground font-medium">Expected</p>
                                        <pre className="bg-muted/50 p-2 rounded-lg border border-border/40 overflow-x-auto">{tc.output}</pre>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {tab === "ai-grade" && (
                          <div className="space-y-4">
                            {isGrading ? (
                              <div className="flex flex-col items-center justify-center py-10 gap-3">
                                <Loader2 className="size-8 animate-spin text-[#ea721b]" />
                                <p className="text-sm text-muted-foreground">AI is analyzing your code...</p>
                              </div>
                            ) : gradingResult ? (
                              <div className="space-y-5 animate-in fade-in duration-500">
                                <div className="flex items-center justify-between">
                                  <h4 className="font-semibold text-sm">AI Performance Analysis</h4>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-medium text-muted-foreground">Overall Score:</span>
                                    <Badge variant="outline" className="bg-[#ea721b]/10 text-[#ea721b] border-[#ea721b]/30 px-3 py-1 text-sm font-bold">
                                      {gradingResult.totalScore}/100
                                    </Badge>
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                  {[
                                    { label: "Correctness", score: gradingResult.correctnessScore, color: "bg-blue-500" },
                                    { label: "Efficiency", score: gradingResult.efficiencyScore, color: "bg-green-500" },
                                    { label: "Code Quality", score: gradingResult.codeQualityScore, color: "bg-purple-500" },
                                    { label: "Best Practices", score: gradingResult.bestPracticeScore, color: "bg-orange-500" }
                                  ].map((item, i) => (
                                    <div key={i} className="bg-muted/30 p-3 rounded-xl border border-border/40 flex flex-col items-center gap-1">
                                      <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">{item.label}</span>
                                      <span className="text-xl font-bold">{item.score}</span>
                                      <div className="w-full h-1 bg-muted rounded-full mt-1">
                                        <div className={cn("h-full rounded-full", item.color)} style={{ width: `${item.score}%` }} />
                                      </div>
                                    </div>
                                  ))}
                                </div>

                                <div className="flex gap-4 text-xs bg-muted/20 p-3 rounded-xl border border-border/40">
                                  <div className="flex-1 space-y-1">
                                    <p className="text-muted-foreground font-medium uppercase tracking-tighter text-[10px]">Time Complexity</p>
                                    <code className="text-[#ea721b] font-bold">{gradingResult.timeComplexity}</code>
                                  </div>
                                  <div className="flex-1 space-y-1 border-l pl-4">
                                    <p className="text-muted-foreground font-medium uppercase tracking-tighter text-[10px]">Space Complexity</p>
                                    <code className="text-[#ea721b] font-bold">{gradingResult.spaceComplexity}</code>
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <h5 className="text-xs font-bold flex items-center gap-1.5">
                                    <CheckCircle2 className="size-3.5 text-green-500" /> Strengths
                                  </h5>
                                  <ul className="space-y-1.5">
                                    {gradingResult.strengths.slice(0, 3).map((s, i) => (
                                      <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                                        <div className="mt-1.5 size-1 rounded-full bg-green-500 shrink-0" />
                                        {s}
                                      </li>
                                    ))}
                                  </ul>
                                </div>

                                <div className="space-y-2">
                                  <h5 className="text-xs font-bold flex items-center gap-1.5">
                                    <Sparkles className="size-3.5 text-[#ea721b]" /> Suggestions for Improvement
                                  </h5>
                                  <ul className="space-y-1.5">
                                    {gradingResult.improvements.slice(0, 3).map((imp, i) => (
                                      <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                                        <div className="mt-1.5 size-1 rounded-full bg-[#ea721b] shrink-0" />
                                        {imp}
                                      </li>
                                    ))}
                                  </ul>
                                </div>

                                {gradingResult.summary && (
                                  <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 text-xs text-blue-900/80 leading-relaxed italic">
                                    &ldquo;{gradingResult.summary}&rdquo;
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
                                <Sparkles className="size-8 text-muted-foreground/30" />
                                <p className="text-sm text-muted-foreground">Submit your solution first, then click &quot;AI Grade&quot; to get a detailed analysis.</p>
                              </div>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </ResizablePanel>
                </ResizablePanelGroup>
              </ResizablePanel>
            </ResizablePanelGroup>
          </div>
        </Suspense>
      )}
    </>
  );
}
