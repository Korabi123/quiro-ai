import prismadb from "@/lib/prismadb";

export async function updateStreak(userId: string) {
  try {
    const subscription = await prismadb.subscription.findFirst({
      where: {
        referenceId: userId,
        status: "active",
        plan: "pro",
      },
    });

    if (!subscription) {
      return;
    }

    const user = await prismadb.user.findUnique({
      where: { id: userId },
      select: { streak: true, lastStreakUpdate: true },
    });

    if (!user) {
      return;
    }

    const now = new Date();
    const lastUpdate = user.lastStreakUpdate ? new Date(user.lastStreakUpdate) : null;
    
    let newStreak = user.streak;
    
    if (!lastUpdate) {
      newStreak = 1;
    } else {
      const msDiff = now.getTime() - lastUpdate.getTime();
      const twentyFourHours = 1000 * 60 * 60 * 24;
      if (msDiff >= twentyFourHours) {
        newStreak = 1;
      } else {
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const lastUpdateDate = new Date(lastUpdate.getFullYear(), lastUpdate.getMonth(), lastUpdate.getDate());
        const diffTime = Math.abs(today.getTime() - lastUpdateDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays === 0) {
          return;
        } else if (diffDays === 1) {
          newStreak += 1;
        } else {
          newStreak = 1;
        }
      }
    }

    await prismadb.user.update({
      where: { id: userId },
      data: {
        streak: newStreak,
        lastStreakUpdate: now,
      },
    });
    
  } catch (error) {
    console.error("Error updating streak:", error);
  }
}
