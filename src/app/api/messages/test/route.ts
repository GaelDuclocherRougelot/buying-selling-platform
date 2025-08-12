import { NextResponse } from "next/server";

export async function GET() {
	return NextResponse.json({
		message: "API de messagerie REST fonctionnelle",
		timestamp: new Date().toISOString(),
		endpoints: {
			conversations: "/api/messages/conversations",
			send: "/api/messages/send",
			messages: "/api/messages/conversations/[conversationId]/messages",
			read: "/api/messages/conversations/[conversationId]/read",
		},
		architecture: "REST API",
		realtime: "Polling automatique (5 secondes)",
	});
}
