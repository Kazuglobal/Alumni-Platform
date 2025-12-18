import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";

// This endpoint is designed to be called by Vercel Cron or external scheduler
// Configure in vercel.json:
// {
//   "crons": [{
//     "path": "/api/cron/publish-scheduled",
//     "schedule": "*/5 * * * *"
//   }]
// }

export async function GET(request: NextRequest) {
  // Verify cron secret in production
  const authHeader = request.headers.get("authorization");
  if (process.env.NODE_ENV === "production") {
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const now = new Date();

    // Find all scheduled posts that should be published
    const postsToPublish = await prisma.post.findMany({
      where: {
        status: "SCHEDULED",
        scheduledAt: {
          lte: now,
        },
      },
      select: {
        id: true,
        title: true,
        tenantId: true,
      },
    });

    if (postsToPublish.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No posts to publish",
        publishedCount: 0,
      });
    }

    // Update all posts to published status
    const result = await prisma.post.updateMany({
      where: {
        id: {
          in: postsToPublish.map((p) => p.id),
        },
      },
      data: {
        status: "PUBLISHED",
        publishedAt: now,
      },
    });

    // Log the published posts
    console.log(
      `Published ${result.count} scheduled posts:`,
      postsToPublish.map((p) => ({ id: p.id, title: p.title }))
    );

    return NextResponse.json({
      success: true,
      message: `Published ${result.count} posts`,
      publishedCount: result.count,
      posts: postsToPublish.map((p) => ({
        id: p.id,
        title: p.title,
      })),
    });
  } catch (error) {
    console.error("Failed to publish scheduled posts:", error);
    return NextResponse.json(
      { error: "Failed to publish scheduled posts" },
      { status: 500 }
    );
  }
}
