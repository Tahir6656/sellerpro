import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import prisma from "@/lib/db";
import { createNotification } from "@/lib/notifications";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response";

const messageLimit = 5000;

const conversationInclude = {
  user: { select: { id: true, username: true, email: true, mobile: true } },
  messages: {
    orderBy: { createdAt: "asc" as const },
    include: { sender: { select: { username: true, role: true } } },
  },
};

export async function GET() {
  try {
    await requireAuth("ADMIN");
    const conversations = await prisma.supportConversation.findMany({
      orderBy: { updatedAt: "desc" },
      include: conversationInclude,
    });

    await prisma.supportMessage.updateMany({
      where: { senderRole: "USER", readByAdmin: false },
      data: { readByAdmin: true },
    });

    return apiSuccess(conversations);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAuth("ADMIN");
    const body = await request.json();
    const conversationId = typeof body.conversationId === "string" ? body.conversationId : "";
    const message = typeof body.message === "string" ? body.message.trim() : "";

    if (!conversationId || !message || message.length > messageLimit) {
      return apiError(`Conversation and message under ${messageLimit} characters are required`, 400);
    }

    const conversation = await prisma.supportConversation.findUnique({ where: { id: conversationId } });
    if (!conversation) return apiError("Conversation not found", 404);

    await prisma.$transaction([
      prisma.supportMessage.create({
        data: {
          conversationId,
          senderId: admin.id,
          senderRole: "ADMIN",
          body: message,
        },
      }),
      prisma.supportConversation.update({
        where: { id: conversationId },
        data: { status: "OPEN" },
      }),
    ]);

    await createNotification(
      conversation.userId,
      "Support replied",
      `An agent replied to your support request: ${message.slice(0, 120)}`
    );

    return apiSuccess({ message: "Reply sent" }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await requireAuth("ADMIN");
    const body = await request.json();
    const conversationId = typeof body.conversationId === "string" ? body.conversationId : "";
    const status = body.status === "CLOSED" ? "CLOSED" : body.status === "OPEN" ? "OPEN" : null;

    if (!conversationId || !status) return apiError("Conversation and valid status required", 400);

    await prisma.supportConversation.update({ where: { id: conversationId }, data: { status } });
    return apiSuccess({ message: `Conversation ${status === "CLOSED" ? "closed" : "reopened"}` });
  } catch (error) {
    return handleApiError(error);
  }
}
