/**
 * OpenAI integration for:
 * 1. Auto-classification of tickets
 * 2. Priority scoring
 * 3. AI-drafted responses grounded in the BookLeaf knowledge base
 *
 * Cost-conscious decisions:
 * - We use gpt-4o-mini (cheapest capable model)
 * - Classification + priority use a single combined call (1 API call vs 2)
 * - The knowledge base is embedded in the SYSTEM prompt, not repeated per call
 * - Draft response only fetches the relevant ticket + author book data (not full history)
 * - We cache the draft on the ticket record so repeated opens don't re-call the API
 */

import OpenAI from "openai";

// Lazy client — only initialised when first called so the module is safe to
// import even when OPENAI_API_KEY is not yet set (e.g. build time).
let _client: OpenAI | null = null;
function getClient(): OpenAI {
    if (!_client) {
        if (!process.env.OPENAI_API_KEY) {
            throw new Error("OPENAI_API_KEY environment variable is not set");
        }
        _client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }
    return _client;
}

// ── Ticket categories & priorities ────────────────────────────────────────

export type TicketCategory =
    | "Royalty & Payments"
    | "ISBN & Metadata Issues"
    | "Printing & Quality"
    | "Distribution & Availability"
    | "Book Status & Production Updates"
    | "General Inquiry";

export type TicketPriority = "Critical" | "High" | "Medium" | "Low";

// ── BookLeaf Knowledge Base (injected into every prompt) ─────────────────

const KNOWLEDGE_BASE = `
BOOKLEAF PUBLISHING — INTERNAL KNOWLEDGE BASE
Use this to answer author queries accurately.

## Company
- Self-publishing company, India & US.
- Packages: Standard Free (no upfront cost), Bestseller Breakthrough (paid, includes marketing & distribution add-ons).
- Services: cover design, typesetting, ISBN assignment, printing, distribution, royalty management.
- In-house printing + warehouse in Delhi. External partners: Repro India, Epitome Books.

## Royalty Policy
- 80/20 split: 80% of net profit to author, 20% to BookLeaf.
- Net profit = MRP − printing cost − platform commission (Amazon/Flipkart) − shipping charges.
- Royalties calculated quarterly, paid within 45 days of quarter end.
- Minimum payout threshold: ₹1,000. Below that, rolls over to next quarter.
- Payouts via bank transfer to account linked in author dashboard.
- Authors can view per-platform sales breakdown in dashboard.

## ISBN Policy
- Every BookLeaf book gets a unique ISBN under BookLeaf's publisher imprint.
- Author's own imprint ISBN must be obtained independently.
- ISBN errors (duplicate, wrong book linked) = high-priority, escalated to production team.

## Printing & Quality
- Standard turnaround: 5–7 business days from order confirmation.
- Quality issues (misprints, binding defects, color inconsistency) → free reprint after photo verification.

## Distribution & Availability
- Listed on: Amazon India, Flipkart, Amazon US, Amazon UK, BookLeaf Store.
- New listings live within 7–10 business days after publication.
- "Unavailable" on platform = stock sync issue; re-sync within 24–48 hours.

## Production Stages
Manuscript Received → Editing (if opted) → Cover Design → Typesetting → Proofreading → ISBN Assignment → Printing → Distribution Setup → Published & Live.
Authors updated by email at each stage. Typical delays: Cover Design (author approval) and Proofreading (revision rounds).

## Communication Tone Guidelines
- Always empathetic and professional. Authors are partners, not customers to manage.
- Acknowledge the concern before jumping to solutions.
- Be specific: include actual numbers, dates, and statuses.
- If it's BookLeaf's fault, own it directly — no deflection.
- Escalation timeline: "Our team will look into this and get back to you within 48 hours."
- Always end with a clear next step.
`.trim();

// ── Combined classify + prioritise ───────────────────────────────────────

interface ClassifyResult {
    category: TicketCategory;
    priority: TicketPriority;
    reasoning: string;
}

export async function classifyAndPrioritise(
    subject: string,
    description: string
): Promise<ClassifyResult> {
    const client = getClient();

    const prompt = `You are a support ticket triage system for BookLeaf Publishing.

Analyse the following support ticket and return JSON with:
- category: one of exactly ["Royalty & Payments", "ISBN & Metadata Issues", "Printing & Quality", "Distribution & Availability", "Book Status & Production Updates", "General Inquiry"]
- priority: one of exactly ["Critical", "High", "Medium", "Low"]
  - Critical: financial disputes, legal threats, data corruption (wrong ISBN, missing royalty for 6+ months)
  - High: quality defects affecting sales, urgent distribution issues, overdue royalties
  - Medium: production status queries, minor metadata issues, moderate delays
  - Low: general questions, bio updates, information requests
- reasoning: one sentence explaining your classification

Ticket Subject: ${subject}
Ticket Description: ${description}

Respond with valid JSON only, no markdown fences.`;

    const response = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1, // deterministic classification
        max_tokens: 200,
    });

    const content = response.choices[0]?.message?.content ?? "{}";
    try {
        return JSON.parse(content) as ClassifyResult;
    } catch {
        // Fallback if JSON is malformed
        return {
            category: "General Inquiry",
            priority: "Medium",
            reasoning: "Could not parse AI response",
        };
    }
}

// ── Draft response generation ─────────────────────────────────────────────

interface DraftContext {
    subject: string;
    description: string;
    category: string;
    priority: string;
    authorName: string;
    bookTitle?: string | null;
    bookStatus?: string | null;
    royaltyPending?: number | null;
    royaltyPaid?: number | null;
}

export async function generateDraftResponse(
    ctx: DraftContext
): Promise<string> {
    const client = getClient();

    // Build a minimal context string — only relevant book data, no full history
    // This keeps token count low while giving the AI enough to be specific.
    const bookContext = ctx.bookTitle
        ? `Related book: "${ctx.bookTitle}" (Status: ${ctx.bookStatus ?? "Unknown"}, Royalty Pending: ₹${ctx.royaltyPending ?? 0}, Royalty Paid: ₹${ctx.royaltyPaid ?? 0})`
        : "Query is account-level / not tied to a specific book.";

    const systemPrompt = `You are a BookLeaf Publishing support representative.
Your name is the "BookLeaf Support Team". 
Write responses that are empathetic, professional, and specific.
Always acknowledge the concern first, then provide the solution or next steps.
Sign off as "Warm regards,\nBookLeaf Support Team".

${KNOWLEDGE_BASE}`;

    const userPrompt = `Draft a support response for this author ticket.

Author: ${ctx.authorName}
Category: ${ctx.category}
Priority: ${ctx.priority}
${bookContext}

Subject: ${ctx.subject}
Author's message: ${ctx.description}

Write a complete, ready-to-send response. Be specific with timelines and policies from the knowledge base.`;

    const response = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
        ],
        temperature: 0.4,
        max_tokens: 600,
    });

    return (
        response.choices[0]?.message?.content ??
        "Thank you for reaching out to BookLeaf Support. Our team will review your query and get back to you shortly.\n\nWarm regards,\nBookLeaf Support Team"
    );
}
