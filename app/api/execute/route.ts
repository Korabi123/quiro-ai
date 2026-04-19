import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { executeCode, compareOutput } from "@/lib/execute";

export const POST = async (req: Request) => {
  try {
    const session = await auth.api.getSession(req);

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { code, language, stdin, expectedOutput, problemId, problemSlug } = await req.json();

    console.log("Execute request:", { 
      codeLength: code?.length || 0, 
      language, 
      stdin: (stdin || '').substring(0, 100),
      expectedOutput: expectedOutput?.substring(0, 50) || 'empty' 
    });

    if (!code || !language) {
      console.log("Missing code or language");
      return new NextResponse("Missing required fields", { status: 400 });
    }

    console.log("Executing code:", { language, stdin: (stdin || '').substring(0, 100) });
    
    const result = await executeCode(code, language, stdin || "");
    console.log("Execution result:", result.status);

    const isCorrect = expectedOutput 
      ? compareOutput(result.stdout, expectedOutput)
      : null;

    return NextResponse.json({
      output: result?.stdout || "",
      stderr: result?.stderr || "",
      time: result?.time || "0",
      memory: result?.memory || 0,
      status: result?.status?.description || "Unknown",
      isCorrect,
    });
  } catch (error) {
    console.log("ERROR EXECUTING CODE: ", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
};