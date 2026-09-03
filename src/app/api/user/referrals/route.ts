import { NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth";
import prisma from "@/lib/db";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response";

interface TreeNode {
  id: string;
  username: string;
  accountStatus: string;
  planStatus: string;
  isVerified: boolean;
  isEligible: boolean;
  children: TreeNode[];
}

async function buildReferralTree(userId: string, depth = 0): Promise<TreeNode[]> {
  if (depth > 5) return [];

  const referrals = await prisma.user.findMany({
    where: { referrerId: userId },
    include: {
      activePlan: true,
      referredVerifications: true,
    },
  });

  const nodes: TreeNode[] = [];
  for (const ref of referrals) {
    const verification = ref.referredVerifications;
    nodes.push({
      id: ref.id,
      username: ref.username,
      accountStatus: ref.accountStatus,
      planStatus: ref.activePlan?.status || "NONE",
      isVerified: verification?.isVerified || false,
      isEligible:
        verification?.isVerified === true &&
        ref.activePlan?.status === "APPROVED",
      children: await buildReferralTree(ref.id, depth + 1),
    });
  }
  return nodes;
}

function getAppUrl(request: NextRequest): string | null {
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, "");

  if (configuredUrl) {
    try {
      const hostname = new URL(configuredUrl).hostname;
      const isLocalhost = hostname === "localhost" ||
        hostname === "127.0.0.1" ||
        hostname === "::1";

      if (!isLocalhost) return configuredUrl;
    } catch {
      // Fall back to the request origin when the configured URL is invalid.
    }
  }

  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0].trim();
  const host = forwardedHost || request.headers.get("host");
  if (!host) return null;

  const forwardedProtocol = request.headers.get("x-forwarded-proto")?.split(",")[0].trim();
  const protocol = forwardedProtocol || request.nextUrl.protocol.replace(":", "");
  return `${protocol}://${host}`;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session) return apiError("Authentication required", 401);

    const user = await prisma.user.findUnique({
      where: { id: session.id },
      select: {
        referralCode: true,
        referralEarnings: true,
        referrals: {
          select: {
            id: true,
            username: true,
            accountStatus: true,
            registrationDate: true,
            activePlan: { select: { status: true } },
            referredVerifications: true,
          },
        },
      },
    });

    const tree = await buildReferralTree(session.id);
    const appUrl = getAppUrl(request);

    if (!user?.referralCode) {
      return apiError("Referral code not available", 404);
    }

    if (!appUrl) {
      return apiError("Public app URL could not be determined", 500);
    }

    return apiSuccess({
      referralLink: `${appUrl}/register?ref=${encodeURIComponent(user.referralCode)}`,
      referralCode: user.referralCode,
      referralEarnings: user.referralEarnings,
      directReferrals: user.referrals,
      tree,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
