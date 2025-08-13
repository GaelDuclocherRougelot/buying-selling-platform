import { resend } from "@/lib/resend";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const contactSchema = z.object({
	name: z.string().min(2).max(100),
	email: z.string().email().max(200),
	subject: z.string().min(3).max(150),
	message: z.string().min(10).max(5000),
	website: z.string().optional(), // Honeypot
});

export async function POST(request: NextRequest) {
	try {
		const json = await request.json();
		const parsed = contactSchema.safeParse(json);

		if (!parsed.success) {
			return NextResponse.json(
				{ error: "Invalid payload", details: parsed.error.flatten() },
				{ status: 400 }
			);
		}

		const { name, email, subject, message, website } = parsed.data;

		// Honeypot check
		if (website && website.trim() !== "") {
			return NextResponse.json({ success: true }, { status: 200 });
		}

		const toAddress =
			process.env.CONTACT_TO_EMAIL || "gaelduclocher.rougelot@gmail.com";
		const fromAddress =
			process.env.RESEND_FROM_EMAIL ||
			"ZONE <noreply@noreply.gael-dr.fr>";

		const html = `
			<div style="font-family:system-ui,Segoe UI,Roboto,Arial,sans-serif;line-height:1.6">
				<h2>📩 Nouveau message depuis le formulaire de contact</h2>
				<p><strong>Nom:</strong> ${escapeHtml(name)}</p>
				<p><strong>Email:</strong> ${escapeHtml(email)}</p>
				<p><strong>Sujet:</strong> ${escapeHtml(subject)}</p>
				<hr/>
				<p style="white-space:pre-wrap">${escapeHtml(message)}</p>
			</div>
		`;

		const text = `Nouveau message depuis le formulaire de contact\n\nNom: ${name}\nEmail: ${email}\nSujet: ${subject}\n\nMessage:\n${message}`;

		await resend.emails.send({
			from: fromAddress,
			to: [toAddress],
			subject: `Contact: ${subject}`,
			html,
			text,
			replyTo: [email],
		});

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("/api/contact error", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}

function escapeHtml(input: string): string {
	return input
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&#039;");
}
