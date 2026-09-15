import { NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth";
import prisma from "@/lib/db";
import { saveUpload } from "@/lib/upload";
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

    const contentType = request.headers.get("content-type") || "";
    const isMultipart = contentType.includes("multipart/form-data");

    const formData = isMultipart ? await request.formData() : null;
    const body = isMultipart ? null : await request.json();

    const conversationId = isMultipart
      ? (formData?.get("conversationId") as string | null)
      : typeof body?.conversationId === "string" ? body.conversationId : undefined;
    const subject = isMultipart
      ? ((formData?.get("subject") as string | null) || "").trim()
      : typeof body?.subject === "string" ? body.subject.trim() : "";
    const message = isMultipart
      ? ((formData?.get("message") as string | null) || "").trim()
      : typeof body?.message === "string" ? body.message.trim() : "";
    const screenshot = isMultipart ? (formData?.get("screenshot") as File | null) : null;

    if (!message || message.length > messageLimit) {
      return apiError(`Message is required and must be under ${messageLimit} characters`, 400);
    }

    if (!conversationId && (!subject || subject.length > subjectLimit)) {
      return apiError(`Subject is required and must be under ${subjectLimit} characters`, 400);
    }

    let screenshotPath: string | null = null;
    if (screenshot && screenshot.size > 0) {
      screenshotPath = await saveUpload(screenshot, "support", "public");
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
            screenshotPath,
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
            create: {
              senderId: session.id,
              senderRole: "USER",
              body: message,
              screenshotPath,
            },
          },
        },
      });
    }

    return apiSuccess({ message: "Message sent" }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
