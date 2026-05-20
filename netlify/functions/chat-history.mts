import type { Config, Context } from "@netlify/functions";
import { db } from "../../db/index.js";
import { chatSessions, chatMessages } from "../../db/schema.js";
import { eq, asc, desc } from "drizzle-orm";

export default async (req: Request, _context: Context) => {
  const url = new URL(req.url);

  if (req.method === "GET") {
    const sessionId = url.searchParams.get("sessionId");

    if (sessionId) {
      const messages = await db
        .select()
        .from(chatMessages)
        .where(eq(chatMessages.sessionId, sessionId))
        .orderBy(asc(chatMessages.createdAt));

      return Response.json({ messages });
    }

    const sessions = await db
      .select()
      .from(chatSessions)
      .orderBy(desc(chatSessions.createdAt))
      .limit(50);

    return Response.json({ sessions });
  }

  return new Response("Method not allowed", { status: 405 });
};

export const config: Config = {
  path: "/api/chat-history",
  method: "GET",
};
