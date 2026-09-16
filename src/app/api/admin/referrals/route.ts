import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import prisma from "@/lib/db";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response";
import { createAuditLog } from "@/lib/audit";
import { createTransaction } from "@/lib/transactions";
import { getConfig } from "@/lib/config";
import { getClientIp } from "@/lib/rate-limit";

interface TreeNode {
  id: string;
  username: string;
  accountStatus: string;
  planStatus: string;
  referrerId: string | null;
  isVerified: boolean;
  isEligible: boolean;
  rewardPaid: boolean;
  children: TreeNode[];
}

async function buildAdminForest(): Promise<TreeNode[]> {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      username: true,
      role: true,
      accountStatus: true,
      referrerId: true,
      activePlan: { select: { status: true } },
      referredVerifications: { select: { isVerified: true, rewardPaid: true } },
    },
    orderBy: { username: "asc" },
  });

  const nodes = new Map<string, TreeNode>();
  for (const user of users) {
    const verification = user.referredVerifications;
    nodes.set(user.id, {
      id: user.id,
      username: user.username,
      accountStatus: user.accountStatus,
      planStatus: user.activePlan?.status || "NONE",
      referrerId: user.referrerId,
      isVerified: verification?.isVerified || false,
      isEligible: verification?.isVerified === true && user.activePlan?.status === "APPROVED",
      rewardPaid: verification?.rewardPaid || false,
      children: [],
    });
  }

  const roots: TreeNode[] = [];
  for (const user of users) {
    const node = nodes.get(user.id);
    const parent = user.referrerId ? nodes.get(user.referrerId) : undefined;
    if (node && parent) parent.children.push(node);
    else if (node && user.role !== "ADMIN") roots.push(node);
  }

  return roots;
}

function findTreeNode(nodes: TreeNode[], userId: string): TreeNode | undefined {
  for (const node of nodes) {
    if (node.id === userId) return node;
    const match = findTreeNode(node.children, userId);
    if (match) return match;
  }
  return undefined;
}

export async function GET(request: NextRequest) {
  try {
    await requireAuth("ADMIN");
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const view = searchParams.get("view");

    if (userId) {
      const tree = findTreeNode(await buildAdminForest(), userId)?.children || [];
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, username: true },
      });
      return apiSuccess({ user, tree });
    }

    const verifications = await prisma.referralVerification.findMany({
      include: {
        referrer: { select: { id: true, username: true } },
        referred: {
          select: {
            id: true,
            username: true,
            accountStatus: true,
            activePlan: { select: { status: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    if (view === "tree") {
      return apiSuccess({ verifications, tree: await buildAdminForest() });
    }

    return apiSuccess(verifications);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const admin = await requireAuth("ADMIN");
    const body = await request.json();
    const { verificationId, action } = body;

    if (!verificationId || !action) {
      return apiError("Verification ID and action required", 400);
    }

    const verification = await prisma.referralVerification.findUnique({
      where: { id: verificationId },
      include: {
        referrer: true,
        referred: { include: { activePlan: true } },
      },
    });

    if (!verification) return apiError("Verification not found", 404);

    const ip = getClientIp(request);

    if (action === "verify") {
      if (verification.referred.activePlan?.status !== "APPROVED") {
        return apiError("Referred user must have an active approved plan", 400);
      }

      await prisma.referralVerification.update({
        where: { id: verificationId },
        data: {
          isVerified: true,
          verifiedBy: admin.id,
          verifiedAt: new Date(),
        },
      });

      if (!verification.rewardPaid) {
        const rewardAmount =
          parseFloat(await getConfig("referral_reward_amount")) || 50;
        await createTransaction({
          userId: verification.referrerId,
          type: "REFERRAL_REWARD",
          amount: rewardAmount,
          description: `Referral reward for ${verification.referred.username}`,
          relatedId: verification.id,
          source: admin.id,
        });
        await prisma.user.update({
          where: { id: verification.referrerId },
          data: { referralEarnings: { increment: rewardAmount } },
        });
        await prisma.referralVerification.update({
          where: { id: verificationId },
          data: { rewardPaid: true, rewardAmount },
        });
      }

      await createAuditLog({
        adminId: admin.id,
        action: "REFERRAL_VERIFIED",
        targetUserId: verification.referredId,
        ipAddress: ip,
      });
    } else if (action === "unverify") {
      await prisma.referralVerification.update({
        where: { id: verificationId },
        data: { isVerified: false, verifiedBy: admin.id, verifiedAt: new Date() },
      });

      await createAuditLog({
        adminId: admin.id,
        action: "REFERRAL_UNVERIFIED",
        targetUserId: verification.referredId,
        ipAddress: ip,
      });
    } else {
      return apiError("Invalid action", 400);
    }

    return apiSuccess({ message: `Referral ${action} successful` });
  } catch (error) {
    return handleApiError(error);
  }
}
