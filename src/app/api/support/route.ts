import { NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth";
import prisma from "@/lib/db";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response";

const messageLimit = 5000;
const subjectLimit = 150;

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session) return apiError("Authentication required", 401);

    const conversations = await prisma.supportConversation.findMany({
      where: { userId: session.id },
      orderBy: { updatedAt: "desc" },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
          include: { sender: { select: { username: true, role: true } } },
        },
      },
    });

    await prisma.supportMessage.updateMany({
      where: { conversation: { userId: session.id }, senderRole: "ADMIN", readByUser: false },
      data: { readByUser: true },
    });

    return apiSuccess(conversations);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session) return apiError("Authentication required", 401);

    const body = await request.json();
    const conversationId = typeof body.conversationId === "string" ? body.conversationId : undefined;
    const subject = typeof body.subject === "string" ? body.subject.trim() : "";
    const message = typeof body.message === "string" ? body.message.trim() : "";

    if (!message || message.length > messageLimit) {
      return apiError(`Message is required and must be under ${messageLimit} characters`, 400);
    }

    if (!conversationId && (!subject || subject.length > subjectLimit)) {
      return apiError(`Subject is required and must be under ${subjectLimit} characters`, 400);
    }

    if (conversationId) {
      const conversation = await prisma.supportConversation.findFirst({
        where: { id: conversationId, userId: session.id },
      });
      if (!conversation) return apiError("Conversation not found", 404);

      await prisma.$transaction([
        prisma.supportMessage.create({
          data: {
            conversationId,
            senderId: session.id,
            senderRole: "USER",
            body: message,
          },
        }),
        prisma.supportConversation.update({
          where: { id: conversationId },
          data: { status: "OPEN" },
        }),
      ]);
    } else {
      await prisma.supportConversation.create({
        data: {
          userId: session.id,
          subject,
          messages: {
            create: { senderId: session.id, senderRole: "USER", body: message },
          },
        },
      });
    }

    return apiSuccess({ message: "Message sent" }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
