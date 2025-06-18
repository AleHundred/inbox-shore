import { NextResponse } from 'next/server';

import { messageStore } from '@/lib/store/messageStore';

/**
 * Handles POST requests to create a new reply for a specific request
 * @param request - The incoming HTTP request
 * @param params - Route parameters containing the requestId
 * @returns JSON response with the created reply details
 */
export async function POST(request: Request, { params }: { params: { requestId: string } }) {
  try {
    const body = await request.json();
    const newMessage = {
      id: `reply-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorType: 'agent' as const,
      actorName: 'You',
      entryType: 'chat' as const,
      text: body.text,
      chatId: `chat-${Date.now()}`,
      components: [
        {
          type: 'text' as const,
          text: body.text,
        },
      ],
    };

    messageStore.addMessage(params.requestId, newMessage);

    return NextResponse.json({
      success: true,
      message: {
        id: newMessage.id,
        content: body.text,
        createdAt: {
          iso8601: newMessage.timestamp,
        },
      },
      chatId: newMessage.chatId,
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
