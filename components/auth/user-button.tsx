"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogHeader,
} from "@/components/ui/dialog";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

import {
  CreditCard,
  Loader,
  PlusCircle,
  Shield,
  UserIcon,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { User } from "@prisma/client";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useAutoAnimate } from "@formkit/auto-animate/react";

import { Session } from "better-auth";
import { cn } from "@/lib/utils";
import { ProfileSection } from "../helpers/user-button/profile-section";
import { SecuritySection } from "../helpers/user-button/security/security-section";
import { BillingSection } from "../helpers/user-button/billing/billing-section";
import { ConnectionsSection } from "../helpers/user-button/security/connections-section";
import { Badge } from "../ui/badge";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { useSubscription } from "@/lib/subscription";

export const UserButton = ({
  user,
  session,
  showExtraInfo = false,
  className = "",
  textStyles = "",
  align = "center",
}: {
  user: User;
  session: Session;
  showExtraInfo?: boolean;
  className?: string;
  textStyles?: string;
  align?: "start" | "center" | "end";
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [sessionSubscriptions, setSessionSubscriptions] = useState<Record<string, string>>({});
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"profile" | "security" | "billing">("profile");
  const { data: subscription } = useSubscription();

  const { data: streakData } = useSWR("/api/user/streak", fetcher, {
    fallbackData: {
      streak: user?.streak || 0,
      // @ts-ignore
      lastStreakUpdate: user?.lastStreakUpdate || null,
    },
  });

  const isStreakActive = () => {
    if (!streakData || streakData.streak === 0) return false;
    if (!streakData.lastStreakUpdate) return false;

    const now = new Date();
    const lastUpdate = new Date(streakData.lastStreakUpdate);

    return (
      now.getFullYear() === lastUpdate.getFullYear() &&
      now.getMonth() === lastUpdate.getMonth() &&
      now.getDate() === lastUpdate.getDate()
    );
  };

  const isActive = isStreakActive();

  const currentSession = authClient.useSession();

  const [animate] = useAutoAnimate();

  const router = useRouter();

  useEffect(() => {
    if (!isMenuOpen || sessions.length > 0) return;

    const getSessions = async () => {
      await authClient.multiSession.listDeviceSessions()
        // @ts-expect-error Just a simple type error
        .then(async (res) => {
          setSessions(res.data);
          try {
            const userIds = res.data.map((s: any) => s.user.id);
            const subRes = await fetch("/api/user/subscriptions", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ userIds })
            });
            if (subRes.ok) {
              const data = await subRes.json();
              const subMap: Record<string, string> = {};
              for (const [uid, sub] of Object.entries(data)) {
                subMap[uid] = (sub as any).plan;
              }
              setSessionSubscriptions(subMap);
            }
          } catch (e) {
            console.error("Failed to fetch session subscriptions", e);
          }
        });
    };

    getSessions();
  }, [isMenuOpen, sessions.length]);

  if (!user) {
    return "Unauthorized";
  }

  return (
    <Dialog>
      <DropdownMenu onOpenChange={setIsMenuOpen}>
        <DropdownMenuTrigger
          className={cn(
            "inline-flex items-center focus-visible:outline-none active:ring-2 active:ring-ring/25 active:ring-offset-2 focus-visible:ring-2 focus-visible:ring-ring/25 rounded-full ring-offset-2 transition-all",
            className
          )}
        >
          <Avatar>
            {/* @ts-expect-error Just a simple type error */}
            <AvatarImage src={user?.image} />
            <AvatarFallback className="bg-gradient-to-b from-gray-700 via-gray-900 to-black text-white">
              <UserIcon className="size-4" />
            </AvatarFallback>
          </Avatar>
          {showExtraInfo && (
            <span
              className={cn(
                "ml-2 text-start text-sm font-medium text-black/50",
                textStyles
              )}
            >
              {user?.name}{" "}
              {subscription?.plan === "pro" && (
                <div
                  className={cn(
                    "inline-flex items-center justify-center gap-1 ml-1 px-2 py-0.5 rounded-full border text-xs font-medium",
                    isActive
                      ? "bg-orange-500/10 text-orange-600 border-orange-500/20"
                      : "bg-gray-500/10 text-gray-600 border-gray-500/20"
                  )}
                >
                  <Zap
                    className={cn(
                      "size-3",
                      isActive ? "fill-orange-600" : "fill-gray-600"
                    )}
                  />
                  {streakData?.streak || 0}
                </div>
              )}
              {subscription?.status === "active" && (
                <Badge
                  className="ml-1 py-1 px-3 text-xs font-medium rounded-full bg-gradient-to-r from-[#ffd43e] via-[#ea721b] to-[#2f2722] text-white border-0 dark:bg-green-900/50 dark:text-green-300 dark:border-green-700"
                  variant="outline"
                >
                  {subscription?.plan?.charAt(0)?.toUpperCase() ?? ""}{subscription?.plan?.slice(1)}
                </Badge>
              )}
              <br />
              <span>{user?.email}</span>
            </span>
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align={align}
          className="md:w-96 w-80 rounded-xl shadow-lg p-0"
        >
          <DropdownMenuLabel className="p-3 px-6">
            <div className="flex items-center gap-4">
              <Avatar>
                {/* @ts-expect-error Just a simple type error */}
                <AvatarImage src={user?.image} />
                <AvatarFallback className="bg-gradient-to-b from-gray-700 via-gray-900 to-black text-white">
                  <UserIcon className="size-4" />
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-sm font-[460] inline-flex items-center gap-2">
                  {user.name}
                  {subscription !== null && (
                    <Badge
                      className="py-1 px-3 text-xs font-medium rounded-full bg-gradient-to-r from-[#ffd43e] via-[#ea721b] to-[#2f2722] text-white border-0 dark:bg-green-900/50 dark:text-green-300 dark:border-green-700"
                      variant="outline"
                    >
                      {subscription?.plan?.charAt(0)?.toUpperCase() ?? ""}{subscription?.plan?.slice(1)}
                    </Badge>
                  )}
                </span>
                <p className="text-xs font-[460]">{user.email}</p>
              </div>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="p-0 m-0" />
          <DialogTrigger asChild>
            <DropdownMenuItem
              disabled={isLoading}
              className="py-4 group px-6 font-medium text-black/70 cursor-pointer"
            >
              <svg
                fill="currentColor"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 16 16"
                className="text-zinc-600 group-hover:text-zinc-800 transition-all w-4 h-4"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M6.559 2.536A.667.667 0 0 1 7.212 2h1.574a.667.667 0 0 1 .653.536l.22 1.101c.466.178.9.429 1.287.744l1.065-.36a.667.667 0 0 1 .79.298l.787 1.362a.666.666 0 0 1-.136.834l-.845.742c.079.492.079.994 0 1.486l.845.742a.666.666 0 0 1 .137.833l-.787 1.363a.667.667 0 0 1-.791.298l-1.065-.36c-.386.315-.82.566-1.286.744l-.22 1.101a.666.666 0 0 1-.654.536H7.212a.666.666 0 0 1-.653-.536l-.22-1.101a4.664 4.664 0 0 1-1.287-.744l-1.065.36a.666.666 0 0 1-.79-.298L2.41 10.32a.667.667 0 0 1 .136-.834l.845-.743a4.7 4.7 0 0 1 0-1.485l-.845-.742a.667.667 0 0 1-.137-.833l.787-1.363a.667.667 0 0 1 .791-.298l1.065.36c.387-.315.821-.566 1.287-.744l.22-1.101ZM7.999 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"
                ></path>
              </svg>
              <span className="ml-2 p-0">Manage Account</span>
            </DropdownMenuItem>
          </DialogTrigger>
          <DropdownMenuSeparator className="p-0 m-0" />
          <DropdownMenuItem
            onClick={() => {
              setIsLoading(true);
              setTimeout(() => {
                authClient.multiSession.revoke(
                  {
                    sessionToken: currentSession.data?.session.token!,
                  },
                  {
                    onRequest: () => {
                      setIsLoading(true);
                    },
                    onError: (ctx) => {
                      console.log(ctx.error.message);
                      setIsLoading(false);
                    },
                    onSuccess: () => {
                      setIsLoading(false);
                      window.location.reload();
                    },
                  }
                );
              }, 1000);
            }}
            onSelect={(e) => e.preventDefault()}
            disabled={isLoading}
            className="py-4 px-6 font-medium text-black/70 cursor-pointer"
          >
            <span ref={animate}>
              {!isLoading ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 16 16"
                  className="text-zinc-600 group-hover:text-zinc-800 transition-all size-[18px]"
                >
                  <path
                    fill="currentColor"
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M2.6 2.604A2.045 2.045 0 0 1 4.052 2h3.417c.544 0 1.066.217 1.45.604.385.387.601.911.601 1.458v.69c0 .413-.334.75-.746.75a.748.748 0 0 1-.745-.75v-.69a.564.564 0 0 0-.56-.562H4.051a.558.558 0 0 0-.56.563v7.875a.564.564 0 0 0 .56.562h3.417a.558.558 0 0 0 .56-.563v-.671c0-.415.333-.75.745-.75s.746.335.746.75v.671c0 .548-.216 1.072-.6 1.459a2.045 2.045 0 0 1-1.45.604H4.05a2.045 2.045 0 0 1-1.45-.604A2.068 2.068 0 0 1 2 11.937V4.064c0-.548.216-1.072.6-1.459Zm8.386 3.116a.743.743 0 0 1 1.055 0l1.74 1.75a.753.753 0 0 1 0 1.06l-1.74 1.75a.743.743 0 0 1-1.055 0 .753.753 0 0 1 0-1.06l.467-.47H5.858A.748.748 0 0 1 5.112 8c0-.414.334-.75.746-.75h5.595l-.467-.47a.753.753 0 0 1 0-1.06Z"
                  ></path>
                </svg>
              ) : (
                <Loader className="mr-1 size-4 text-muted-foreground animate-spin" />
              )}
            </span>
            <span className="ml-2 p-0">Sign Out</span>
          </DropdownMenuItem>
          {sessions.length > 1 && (
            <>
              <DropdownMenuSeparator className="p-0 m-0" />
              {sessions.map((session: any) => {
                const activeSession = session.user.id === user.id;

                return (
                  <div key={session.session.id}>
                    <DropdownMenuItem
                      className={cn(
                        "p-3 px-6 cursor-pointer",
                        activeSession && "hidden"
                      )}
                      disabled={isLoading}
                      onClick={async () => {
                        await authClient.multiSession.setActive(
                          {
                            sessionToken: session.session.token,
                          },
                          {
                            onRequest: () => {
                              setIsLoading(true);
                            },
                            onSuccess: () => {
                              setIsLoading(false);
                              window.location.reload();
                            },
                          }
                        );
                      }}
                    >
                      <div className="flex items-center gap-4">
                        <Avatar>
                          <AvatarImage src={session.user.image} />
                          <AvatarFallback className="bg-gradient-to-b from-gray-700 via-gray-900 to-black text-white">
                            <UserIcon className="size-4" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="text-sm font-[460] inline-flex items-center gap-2">
                            {session.user.name}
                            {sessionSubscriptions[session.user.id] && (
                              <Badge
                                className="py-0.5 px-2 text-[10px] leading-tight font-medium rounded-full bg-gradient-to-r from-[#ffd43e] via-[#ea721b] to-[#2f2722] text-white border-0 dark:bg-green-900/50 dark:text-green-300 dark:border-green-700"
                                variant="outline"
                              >
                                {sessionSubscriptions[session.user.id].charAt(0).toUpperCase()}{sessionSubscriptions[session.user.id].slice(1)}
                              </Badge>
                            )}
                          </span>
                          <p className="text-xs font-[460]">
                            {session.user.email}
                          </p>
                        </div>
                      </div>
                    </DropdownMenuItem>
                  </div>
                );
              })}
            </>
          )}
          <DropdownMenuSeparator className="p-0 m-0" />
          <DropdownMenuItem
            className={cn("py-4 px-6 font-medium text-black/70 cursor-pointer")}
            onClick={() => {
              router.push("/login");
            }}
            disabled={isLoading}
          >
            <PlusCircle className="size-4 mr-2" />
            Add account
          </DropdownMenuItem>
          {sessions.length > 1 && (
            <>
              <DropdownMenuSeparator className="p-0 m-0" />
              <DropdownMenuItem
                onClick={() => {
                  setIsLoading(true);
                  setTimeout(() => {
                    authClient.signOut(
                      {},
                      {
                        onSuccess: () => {
                          router.refresh();
                        },
                      }
                    );
                  }, 1000);
                }}
                onSelect={(e) => e.preventDefault()}
                disabled={isLoading}
                className="py-4 px-6 font-medium text-black/70 cursor-pointer"
              >
                <span ref={animate}>
                  {!isLoading ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 16 16"
                      className="text-zinc-600 group-hover:text-zinc-800 transition-all size-[18px]"
                    >
                      <path
                        fill="currentColor"
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M2.6 2.604A2.045 2.045 0 0 1 4.052 2h3.417c.544 0 1.066.217 1.45.604.385.387.601.911.601 1.458v.69c0 .413-.334.75-.746.75a.748.748 0 0 1-.745-.75v-.69a.564.564 0 0 0-.56-.562H4.051a.558.558 0 0 0-.56.563v7.875a.564.564 0 0 0 .56.562h3.417a.558.558 0 0 0 .56-.563v-.671c0-.415.333-.75.745-.75s.746.335.746.75v.671c0 .548-.216 1.072-.6 1.459a2.045 2.045 0 0 1-1.45.604H4.05a2.045 2.045 0 0 1-1.45-.604A2.068 2.068 0 0 1 2 11.937V4.064c0-.548.216-1.072.6-1.459Zm8.386 3.116a.743.743 0 0 1 1.055 0l1.74 1.75a.753.753 0 0 1 0 1.06l-1.74 1.75a.743.743 0 0 1-1.055 0 .753.753 0 0 1 0-1.06l.467-.47H5.858A.748.748 0 0 1 5.112 8c0-.414.334-.75.746-.75h5.595l-.467-.47a.753.753 0 0 1 0-1.06Z"
                      ></path>
                    </svg>
                  ) : (
                    <Loader className="mr-1 size-4 text-muted-foreground animate-spin" />
                  )}
                </span>
                <span className="ml-2 p-0">Sign Out of all Accounts</span>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <DialogContent className="md:min-w-[850px] md:h-[620px] p-0 overflow-hidden w-full flex flex-col md:flex-row rounded-2xl gap-0 border border-zinc-200 dark:border-zinc-800 shadow-2xl bg-[#f9fafb] dark:bg-zinc-950">
        {/* Sidebar */}
        <div className="md:w-[260px] bg-transparent flex flex-col p-8 gap-6 h-auto md:h-full shrink-0">
          <div>
            <DialogTitle className="text-[22px] font-bold tracking-tight">Account</DialogTitle>
            <DialogDescription className="text-[13px] text-muted-foreground mt-1.5">
              Manage your account info.
            </DialogDescription>
          </div>
          
          <div className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible pb-2 md:pb-0">
            <button 
              onClick={() => setActiveTab('profile')} 
              className={cn("flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors shrink-0", activeTab === 'profile' ? "bg-black/5 dark:bg-white/10 text-foreground" : "hover:bg-black/5 dark:hover:bg-white/5 text-muted-foreground hover:text-foreground")}
            >
              <UserIcon className="size-[18px]" />
              Profile
            </button>
            <button 
              onClick={() => setActiveTab('security')} 
              className={cn("flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors shrink-0", activeTab === 'security' ? "bg-black/5 dark:bg-white/10 text-foreground" : "hover:bg-black/5 dark:hover:bg-white/5 text-muted-foreground hover:text-foreground")}
            >
              <Shield className="size-[18px]" />
              Security
            </button>
            <button 
              onClick={() => setActiveTab('billing')} 
              className={cn("flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors shrink-0", activeTab === 'billing' ? "bg-black/5 dark:bg-white/10 text-foreground" : "hover:bg-black/5 dark:hover:bg-white/5 text-muted-foreground hover:text-foreground")}
            >
              <CreditCard className="size-[18px]" />
              Billing
            </button>
          </div>
        </div>
        
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col px-10 py-8 overflow-y-auto relative w-full h-full bg-white dark:bg-[#0f0f0f] border-l border-zinc-200 dark:border-zinc-800 md:rounded-l-[24px] shadow-[-4px_0_24px_rgba(0,0,0,0.02)] dark:shadow-[-4px_0_24px_rgba(0,0,0,0.2)]">
          <div className="max-w-[800px] w-full">
            {activeTab === 'profile' && (
              <div className="flex flex-col animate-in fade-in slide-in-from-right-2 duration-300">
                <h3 className="text-lg font-semibold tracking-tight mb-6">Profile details</h3>
                <ProfileSection user={user} />
                <ConnectionsSection user={user} />
              </div>
            )}
            {activeTab === 'security' && (
              <div className="flex flex-col animate-in fade-in slide-in-from-right-2 duration-300">
                <h3 className="text-lg font-semibold tracking-tight mb-6">Security</h3>
                <SecuritySection user={user} />
              </div>
            )}
            {activeTab === 'billing' && (
              <div className="flex flex-col animate-in fade-in slide-in-from-right-2 duration-300">
                <h3 className="text-lg font-semibold tracking-tight mb-6">Billing</h3>
                <BillingSection user={user} />
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
