import prismadb from "@/lib/prismadb";

export async function updateStreak(userId: string) {
  try {
    // 1. Check if user has active Pro subscription
    // We check for any active subscription that is "pro"
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

    // 2. Get user's current streak info
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
      // First time updating streak
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

    // 3. Update user
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
