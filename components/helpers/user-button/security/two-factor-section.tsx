"use client";

import * as z from "zod";

import QrCode from "react-qr-code";
import { ErrorCard } from "@/components/auth/error-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { Ellipsis, Eye, EyeOff, Loader, Mail } from "lucide-react";
import { useState } from "react";
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from "@/components/ui/input-otp";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useAutoSubmit } from "@/hooks/use-auto-submit";
import { SplitOTP } from "@/components/ui/split-otp";

const twoFactorPasswordSchema = z.object({
  currentPassword: z.string().min(8),
});

const totpCodeSchema = z.object({
  otp: z.string().min(6, {
    message: "Code must be 6 digits long",
  }),
});

const removeTwoFactorSchema = z.object({
  currentPassword: z.string().min(8),
});

export const TwoFactorSection = ({
  user,
}: {
  user: any; // Using any because custom prisma schema fields
}) => {
  const [localUser, setLocalUser] = useState(user);
  const [animate] = useAutoAnimate();
  const router = useRouter();
  const [isTwoFactorBoxOpen, setIsTwoFactorBoxOpen] = useState(false);
  const [isRemoveTwoFactorBoxOpen, setIsRemoveTwoFactorBoxOpen] = useState(false);
  const [twoFactorStage, setTwoFactorStage] = useState(1);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [totpUri, setTotpUri] = useState("");
  const [provider, setProvider] = useState<"totp" | "email">("totp");
  const toggleVisibility = () =>
    setIsPasswordVisible((prevState) => !prevState);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  // Sync custom tracking fields
  const sync2FAState = async (action: "enable" | "disable" | "setDefault", prov: "totp" | "email", pwd?: string) => {
    // Optimistically update local UI state
    setLocalUser((prev: any) => {
      const next = { ...prev };
      if (action === "enable") {
        next.twoFactorEnabled = true;
        if (prov === "totp") {
          next.totpTwoFactorEnabled = true;
          if (!next.defaultTwoFactorMethod) next.defaultTwoFactorMethod = "totp";
        } else {
          next.emailTwoFactorEnabled = true;
          if (!next.defaultTwoFactorMethod) next.defaultTwoFactorMethod = "email";
        }
      } else if (action === "disable") {
        if (prov === "totp") {
           next.totpTwoFactorEnabled = false;
           if (next.defaultTwoFactorMethod === "totp") {
             next.defaultTwoFactorMethod = next.emailTwoFactorEnabled ? "email" : null;
           }
        } else {
           next.emailTwoFactorEnabled = false;
           if (next.defaultTwoFactorMethod === "email") {
             next.defaultTwoFactorMethod = next.totpTwoFactorEnabled ? "totp" : null;
           }
        }
        if (!next.totpTwoFactorEnabled && !next.emailTwoFactorEnabled) {
          next.twoFactorEnabled = false;
        }
      } else if (action === "setDefault") {
        next.defaultTwoFactorMethod = prov;
      }
      return next;
    });

    try {
      await fetch("/api/user/update-2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, provider: prov, password: pwd }),
      });
      router.refresh();
    } catch (err) {
      console.error(err);
    }
  };

  const twoFactorForm = useForm<z.infer<typeof twoFactorPasswordSchema>>({
    resolver: zodResolver(twoFactorPasswordSchema),
    defaultValues: {
      currentPassword: "",
    },
  });

  const totpCodeForm = useForm<z.infer<typeof totpCodeSchema>>({
    resolver: zodResolver(totpCodeSchema),
    defaultValues: {
      otp: "",
    },
  });

  const removeTwoFactorForm = useForm<z.infer<typeof removeTwoFactorSchema>>({
    resolver: zodResolver(removeTwoFactorSchema),
    defaultValues: {
      currentPassword: "",
    },
  });

  const onTwoFactorPasswordSubmit = async (
    data: z.infer<typeof twoFactorPasswordSchema>
  ) => {
    const res = await authClient.twoFactor.enable(
      {
        password: data.currentPassword,
      },
      {
        onRequest: () => {
          setIsLoading(true);
        },
        onError: (ctx) => {
          setError(ctx.error.message);
          setIsLoading(false);
        },
      }
    );

    if (res.error) return;

    if (provider === "totp") {
      setTotpUri(res.data?.totpURI!);
      setIsLoading(false);
      setTwoFactorStage(2);
    } else {
      // Email OTP Provider
      await sync2FAState("enable", "email");
      setIsLoading(false);
      setTwoFactorStage(4);
      router.refresh();
    }
  };

  const onTotpCodeSubmit = async (data: z.infer<typeof totpCodeSchema>) => {
    const handlers = {
      onRequest: () => {
        setIsLoading(true);
      },
      onSuccess: async () => {
        await sync2FAState("enable", "totp");
        setIsLoading(false);
        setTwoFactorStage(4);
        router.refresh();
      },
      onError: (ctx: any) => {
        setError(ctx.error.message);
        setIsLoading(false);
      },
    };

    if (provider === "totp") {
      await authClient.twoFactor.verifyTotp({ code: data.otp }, handlers);
    } else {
      await authClient.twoFactor.verifyOtp({ code: data.otp }, handlers);
    }
  };

  useAutoSubmit({
    trigger: totpCodeForm.trigger,
    watch: totpCodeForm.watch,
    onSubmit: totpCodeForm.handleSubmit(onTotpCodeSubmit),
  });

  const onRemoveTwoFactorSubmit = async (
    data: z.infer<typeof removeTwoFactorSchema>
  ) => {
    setIsLoading(true);
    // Determine if this is the ONLY method enabled
    const isOnlyMethod = (provider === "email" && !user.totpTwoFactorEnabled) || 
                         (provider === "totp" && !user.emailTwoFactorEnabled);

    if (isOnlyMethod) {
      // Use Better Auth native disable
      const res = await authClient.twoFactor.disable({ password: data.currentPassword });
      if (res.error) {
         setError(res.error.message);
         setIsLoading(false);
         return;
      }
    }
    
    // Call custom API to update fields
    const updateRes = await fetch("/api/user/update-2fa", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "disable", provider, password: data.currentPassword }),
    });

    if (!updateRes.ok) {
       setError("Invalid password");
       setIsLoading(false);
       return;
    }

    setIsLoading(false);
    setIsRemoveTwoFactorBoxOpen(false);
    setTwoFactorStage(1);
    router.refresh();
  };

  return (
    <div className="flex w-full flex-col gap-3 border-b border-zinc-200 dark:border-zinc-800 py-6">
      <p className="text-[13px] font-semibold text-zinc-900 dark:text-zinc-100">Two-step verification</p>
      <div ref={animate} className="w-full">
        {!isTwoFactorBoxOpen && !isRemoveTwoFactorBoxOpen ? (
          <div className="flex items-start justify-between gap-4 w-full">
            <div className="flex flex-col items-start gap-2 w-full">
              {localUser.totpTwoFactorEnabled && (
                <div className="flex items-center gap-2 group">
                  <svg
                    fill="currentColor"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 16 16"
                    className="text-zinc-700 size-4"
                  >
                    <path d="M7 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"></path>
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M4 2c-1.105 0-2 .895-2 2v8c0 1.105.895 2 2 2h8c1.105 0 2-.895 2-2V4c0-1.105-.895-2-2-2H4Zm3 9a3.002 3.002 0 0 0 2.906-2.25H12a.75.75 0 0 0 0-1.5H9.906A3.002 3.002 0 0 0 4 8c0 .941.438 1.785 1.117 2.336A2.985 2.985 0 0 0 7 11Z"
                    ></path>
                  </svg>
                  <p className="text-[13px] text-zinc-600 mr-2">Authenticator app</p>
                  {localUser.defaultTwoFactorMethod === "totp" && <Badge variant={"outline"} className="scale-[0.85]">Default</Badge>}
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant={"ghost"} size="icon" className="h-6 w-6">
                            <Ellipsis className="h-4 w-4 text-zinc-400 group-hover:text-zinc-800 transition" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl shadow-lg py-0 px-0 min-w-fit">
                          {localUser.defaultTwoFactorMethod !== "totp" && (
                            <DropdownMenuItem
                              className="cursor-pointer px-3 py-1 text-zinc-600 focus:text-zinc-800 transition-all"
                              onClick={() => sync2FAState("setDefault", "totp")}
                            >
                              <p className="text-[13px]">Set as default</p>
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            className="cursor-pointer px-3 py-1 text-zinc-600 focus:text-zinc-800 transition-all"
                            onClick={() => {
                              setProvider("totp");
                              setIsRemoveTwoFactorBoxOpen(true);
                              setTwoFactorStage(10);
                            }}
                          >
                            <p className="text-[13px] text-destructive">Remove</p>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )}

                  {localUser.emailTwoFactorEnabled && (
                    <div className="flex items-center gap-2 group">
                      <Mail className="text-zinc-700 size-4" />
                      <p className="text-[13px] text-zinc-600 mr-2">Email verification</p>
                      {localUser.defaultTwoFactorMethod === "email" && <Badge variant={"outline"} className="scale-[0.85]">Default</Badge>}
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant={"ghost"} size="icon" className="h-6 w-6">
                            <Ellipsis className="h-4 w-4 text-zinc-400 group-hover:text-zinc-800 transition" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl shadow-lg py-0 px-0 min-w-fit">
                          {localUser.defaultTwoFactorMethod !== "email" && (
                            <DropdownMenuItem
                              className="cursor-pointer px-3 py-1 text-zinc-600 focus:text-zinc-800 transition-all"
                              onClick={() => sync2FAState("setDefault", "email")}
                            >
                              <p className="text-[13px]">Set as default</p>
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            className="cursor-pointer px-3 py-1 text-zinc-600 focus:text-zinc-800 transition-all"
                            onClick={() => {
                              setProvider("email");
                              setIsRemoveTwoFactorBoxOpen(true);
                              setTwoFactorStage(10);
                            }}
                          >
                            <p className="text-[13px] text-destructive">Remove</p>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )}

                  {(!localUser.totpTwoFactorEnabled || !localUser.emailTwoFactorEnabled) && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant={"ghost"} size={"sm"} className="text-[13px] h-8 px-0 hover:bg-transparent">
                          {(!localUser.totpTwoFactorEnabled && !localUser.emailTwoFactorEnabled) ? "Add two-step verification" : "Add another method"}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-xl shadow-lg p-0">
                        {!localUser.totpTwoFactorEnabled && (
                          <DropdownMenuItem 
                            className="cursor-pointer"
                            onClick={() => {
                              setProvider("totp");
                              setIsTwoFactorBoxOpen(true);
                            }}
                          >
                            <svg
                              fill="currentColor"
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 16 16"
                              className="text-zinc-700 mr-2 size-4"
                            >
                              <path d="M7 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"></path>
                              <path
                                fillRule="evenodd"
                                clipRule="evenodd"
                                d="M4 2c-1.105 0-2 .895-2 2v8c0 1.105.895 2 2 2h8c1.105 0 2-.895 2-2V4c0-1.105-.895-2-2-2H4Zm3 9a3.002 3.002 0 0 0 2.906-2.25H12a.75.75 0 0 0 0-1.5H9.906A3.002 3.002 0 0 0 4 8c0 .941.438 1.785 1.117 2.336A2.985 2.985 0 0 0 7 11Z"
                              ></path>
                            </svg>
                            <p className="text-sm text-zinc-600">Authenticator app</p>
                          </DropdownMenuItem>
                        )}
                        {!localUser.emailTwoFactorEnabled && (
                          <DropdownMenuItem 
                            className="cursor-pointer"
                            onClick={() => {
                              setProvider("email");
                              setIsTwoFactorBoxOpen(true);
                            }}
                          >
                            <Mail className="text-zinc-700 mr-2 size-4" />
                            <p className="text-sm text-zinc-600">Email verification</p>
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
          </div>
        ) : (
          <>
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="text-sm tracking-tight">
                  {twoFactorStage === 1 && "First enter your current password"}
                  {twoFactorStage === 10 && "First enter your current password"}
                  {twoFactorStage === 2 && provider === "totp" && "Add authenticator application"}
                  {twoFactorStage === 3 && (provider === "totp" ? "Add authenticator application" : "Enter Email Code")}
                  {twoFactorStage === 4 && (provider === "totp" ? "Authenticator app enabled" : "Email Verification Enabled")}
                </CardTitle>
                {twoFactorStage === 2 && (
                  <CardDescription className="text-xs">
                    Set up a new sign-in method in your authenticator app and
                    scan the following QR code to link it to your account.
                  </CardDescription>
                )}
                {twoFactorStage === 10 && (
                  <CardDescription className="text-xs">
                    To remove {provider === "totp" ? "Authenticator app" : "Email verification"}, enter your current password.
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                {(twoFactorStage === 1 || twoFactorStage === 10) && (
                  <>
                    <div ref={animate}>
                      {error && <ErrorCard size="sm" error={error} />}
                    </div>
                    <Form {...(twoFactorStage === 10 ? removeTwoFactorForm : twoFactorForm)}>
                      <form
                        className="space-y-6"
                        onSubmit={
                          twoFactorStage === 10 
                            ? removeTwoFactorForm.handleSubmit(onRemoveTwoFactorSubmit)
                            : twoFactorForm.handleSubmit(onTwoFactorPasswordSubmit)
                        }
                      >
                        <FormField
                          control={twoFactorStage === 10 ? removeTwoFactorForm.control : twoFactorForm.control}
                          name="currentPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm">
                                Current Password
                              </FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Input
                                    {...field}
                                    autoCorrect="off"
                                    autoComplete="off"
                                    disabled={isLoading}
                                    type={
                                      isPasswordVisible ? "text" : "password"
                                    }
                                    className="pe-9"
                                  />
                                  <button
                                    className="absolute inset-y-0 end-0 flex h-full w-9 items-center justify-center rounded-e-lg text-muted-foreground/80 outline-offset-2 transition-colors hover:text-foreground focus:z-10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring/70 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
                                    type="button"
                                    onClick={toggleVisibility}
                                    aria-label={
                                      isPasswordVisible
                                        ? "Hide password"
                                        : "Show password"
                                    }
                                    aria-pressed={isPasswordVisible}
                                    aria-controls="password"
                                  >
                                    {isPasswordVisible ? (
                                      <EyeOff
                                        size={16}
                                        strokeWidth={2}
                                        aria-hidden="true"
                                      />
                                    ) : (
                                      <Eye
                                        size={16}
                                        strokeWidth={2}
                                        aria-hidden="true"
                                      />
                                    )}
                                  </button>
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button
                          size={"sm"}
                          variant={"ghost"}
                          type="button"
                          disabled={isLoading}
                          className="mt-4 mr-2"
                          onClick={() => {
                            setIsTwoFactorBoxOpen(false);
                            setIsRemoveTwoFactorBoxOpen(false);
                            twoFactorForm.reset();
                            removeTwoFactorForm.reset();
                            setError("");
                            setTwoFactorStage(1);
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          size={"sm"}
                          type="submit"
                          disabled={isLoading}
                          className="mt-4"
                        >
                          {isLoading && (
                            <Loader className="mr-1 size-2 text-muted-foreground animate-spin" />
                          )}
                          Save
                        </Button>
                      </form>
                    </Form>
                  </>
                )}
                {twoFactorStage === 2 && (
                  <>
                    <div className="flex flex-col items-center justify-center">
                      <QrCode value={totpUri || ""} className="size-[170px]" />
                    </div>
                    <Button
                      size={"sm"}
                      variant={"ghost"}
                      type="button"
                      disabled={isLoading}
                      className="mt-10 mr-2"
                      onClick={() => {
                        setIsTwoFactorBoxOpen(false);
                        twoFactorForm.reset();
                        setError("");
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      size={"sm"}
                      type="button"
                      disabled={isLoading}
                      className="mt-10"
                      onClick={() => {
                        setTwoFactorStage(3);
                      }}
                    >
                      {isLoading && (
                        <Loader className="mr-1 size-2 text-muted-foreground animate-spin" />
                      )}
                      Continue
                    </Button>
                  </>
                )}
                {twoFactorStage === 3 && (
                  <>
                    <div ref={animate}>
                      {error && <ErrorCard size="sm" error={error} />}
                    </div>
                    <Form {...totpCodeForm}>
                      <form
                        className="space-y-6 flex flex-col items-center justify-center"
                        onSubmit={totpCodeForm.handleSubmit(
                          () => onTotpCodeSubmit
                        )}
                      >
                        <FormField
                          control={totpCodeForm.control}
                          name="otp"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                {/* @ts-expect-error Just a simple type error */}
                                <SplitOTP
                                  {...field}
                                  maxLength={6}
                                  disabled={isLoading}
                                />
                              </FormControl>
                              <FormDescription className="text-xs">
                                {provider === "totp" 
                                  ? "Enter the code in your authenticator app."
                                  : "Check your email for the 6-digit verification code."}
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="self-start">
                          <Button
                            size={"sm"}
                            variant={"ghost"}
                            type="button"
                            disabled={isLoading}
                            className="mt-4 mr-2"
                            onClick={() => {
                              setIsTwoFactorBoxOpen(false);
                              twoFactorForm.reset();
                              totpCodeForm.reset();
                              setTwoFactorStage(1);
                              setError("");
                            }}
                          >
                            Cancel
                          </Button>
                          <Button
                            size={"sm"}
                            type="button"
                            disabled={isLoading}
                            onClick={() => {
                              onTotpCodeSubmit({
                                otp: totpCodeForm.getValues().otp,
                              });
                            }}
                            className="mt-4"
                          >
                            {isLoading && (
                              <Loader className="mr-1 size-2 text-muted-foreground animate-spin" />
                            )}
                            Continue
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </>
                )}
                {twoFactorStage === 4 && (
                  <div className="flex flex-col">
                    <CardDescription className="text-xs">
                      {provider === "totp" 
                        ? "Two-step verification is now enabled. When signing in, you will need to enter a verification code from this authenticator as an additional step."
                        : "Email verification is now enabled. When signing in, you will be sent a 6-digit code to your email address as an additional step."}
                    </CardDescription>
                    <Button
                      size={"sm"}
                      type="button"
                      disabled={isLoading}
                      className="mt-4 self-end"
                      onClick={() => {
                        setIsTwoFactorBoxOpen(false);
                        twoFactorForm.reset();
                        totpCodeForm.reset();
                        setError("");
                      }}
                    >
                      Finish
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
