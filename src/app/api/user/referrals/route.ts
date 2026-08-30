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
    const verification = ref.referredVerifications[0];
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

export async function GET() {
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
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    return apiSuccess({
      referralLink: `${appUrl}/register?ref=${user?.referralCode}`,
      referralCode: user?.referralCode,
      referralEarnings: user?.referralEarnings,
      directReferrals: user?.referrals,
      tree,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
