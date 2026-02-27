import User from '../models/User.js';
import { barCouncilDataset } from '../data/barCouncilData.js';

// ─────────────────────────────────────────────────────────────────────────────
// CONFIGURATION
// ─────────────────────────────────────────────────────────────────────────────

const OLLAMA_URL   = process.env.OLLAMA_URL   || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'phi:latest';
const OLLAMA_API   = `${OLLAMA_URL}/api/generate`;
const TIMEOUT_MS   = 60000;

// ─────────────────────────────────────────────────────────────────────────────
// STATE → SPECIALIZATION MAP
// ─────────────────────────────────────────────────────────────────────────────

const STATE_SPEC_MAP = {
  Maharashtra:     ['Property Law', 'Civil Law', 'Corporate Law'],
  Delhi:           ['Criminal Law', 'Civil Law', 'Corporate Law'],
  Karnataka:       ['Property Law', 'Corporate Law', 'Labour Law'],
  'Tamil Nadu':    ['Family Law', 'Consumer Law', 'Civil Law'],
  'Uttar Pradesh': ['Civil Law', 'Criminal Law', 'Property Law'],
  Gujarat:         ['Corporate Law', 'Tax Law', 'Civil Law'],
  'West Bengal':   ['Civil Law', 'Family Law', 'Criminal Law'],
  Rajasthan:       ['Property Law', 'Civil Law', 'Criminal Law'],
};

// ─────────────────────────────────────────────────────────────────────────────
// DATA LAYER — merge barCouncilData + MongoDB
// ─────────────────────────────────────────────────────────────────────────────

function cleanName(name = '') {
  return name.replace(/^(adv\.?\s*|advocate\s*)+/i, '').trim();
}

function mergeLawyerData(dbDoc, barEntry) {
  const r = {
    name: '', email: '', specializations: [], rating: null,
    reviewCount: null, barCouncilNumber: '', state: '',
    enrollmentDate: '', barStatus: 'active',
  };
  if (barEntry) {
    r.name             = cleanName(barEntry.lawyerName);
    r.barCouncilNumber = barEntry.barCouncilNumber;
    r.state            = barEntry.state;
    r.enrollmentDate   = barEntry.enrollmentDate;
    r.barStatus        = barEntry.status || 'active';
    r.specializations  = STATE_SPEC_MAP[barEntry.state] || ['General Consultation'];
  }
  if (dbDoc) {
    r.name             = cleanName(dbDoc.name) || r.name;
    r.email            = dbDoc.email            || '';
    r.rating           = dbDoc.rating           || null;
    r.reviewCount      = dbDoc.reviewCount      || null;
    r.barCouncilNumber = dbDoc.barCouncilNumber || r.barCouncilNumber;
    if (dbDoc.specializations?.length) r.specializations = dbDoc.specializations;
  }
  return r;
}

async function getAllLawyers() {
  let dbLawyers = [];
  try {
    dbLawyers = await User.find({ role: 'lawyer' })
      .select('name email specializations rating reviewCount barCouncilNumber')
      .lean();
  } catch (err) {
    console.error('[chatEngine] DB error:', err.message);
  }

  const barMap = new Map(barCouncilDataset.map(e => [e.barCouncilNumber.toUpperCase(), e]));
  const dbByBC = new Map(
    dbLawyers.filter(l => l.barCouncilNumber)
      .map(l => [l.barCouncilNumber.toUpperCase(), l])
  );

  const merged = barCouncilDataset
    .filter(e => e.status === 'active')
    .map(e => mergeLawyerData(dbByBC.get(e.barCouncilNumber.toUpperCase()) || null, e));

  for (const dbDoc of dbLawyers) {
    const key = (dbDoc.barCouncilNumber || '').toUpperCase();
    if (!key || !barMap.has(key)) merged.push(mergeLawyerData(dbDoc, null));
  }
  return merged;
}

// ─────────────────────────────────────────────────────────────────────────────
// BUILD LAWYER CONTEXT STRING — injected into every Ollama prompt
// ─────────────────────────────────────────────────────────────────────────────

function buildLawyerContext(lawyers) {
  return lawyers.map((l, i) => {
    const parts = [
      `${i + 1}. Name: Adv. ${l.name}`,
      `   Specializations: ${l.specializations.join(', ')}`,
      `   State: ${l.state}`,
      `   Bar Council No: ${l.barCouncilNumber}`,
      `   Enrolled: ${l.enrollmentDate}`,
      `   Status: ${l.barStatus}`,
    ];
    if (l.rating)    parts.push(`   Rating: ${l.rating}/5${l.reviewCount ? ` (${l.reviewCount} reviews)` : ''}`);
    if (l.email)     parts.push(`   Email: ${l.email}`);
    return parts.join('\n');
  }).join('\n\n');
}

// ─────────────────────────────────────────────────────────────────────────────
// EXTRACT REQUESTED COUNT  ("top 5", "list 3", "6 lawyers")
// ─────────────────────────────────────────────────────────────────────────────

function extractRequestedCount(text) {
  const m = text.match(/\b(?:top|best|give\s+me|show\s+me|list|suggest)?\s*(\d+)\s*(?:lawyer|advocate|attorney)?s?\b/i);
  if (m) {
    const n = parseInt(m[1]);
    if (n >= 1 && n <= 10) return n;
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// OLLAMA — single call, no fallback, throws on failure
// ─────────────────────────────────────────────────────────────────────────────

async function askOllama(prompt) {
  const controller = new AbortController();
  const tid = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    console.log(`[chatEngine] → Ollama (${OLLAMA_MODEL}) prompt: ${prompt.length} chars`);
    const res = await fetch(OLLAMA_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt,
        stream: false,
        options: { temperature: 0.7, num_predict: 500 },
      }),
      signal: controller.signal,
    });
    clearTimeout(tid);

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`Ollama HTTP ${res.status}: ${body.slice(0, 200)}`);
    }

    const data = await res.json();
    const text = data.response?.trim();
    if (!text || text.length < 5) throw new Error('Ollama returned empty response');

    console.log(`[chatEngine] ✅ Ollama replied (${text.length} chars)`);
    return text;

  } catch (err) {
    clearTimeout(tid);
    const reason = err.name === 'AbortError' ? `Timeout after ${TIMEOUT_MS/1000}s` : err.message;
    console.error(`[chatEngine] ❌ Ollama FAILED: ${reason}`);
    console.error(`[chatEngine]    URL:   ${OLLAMA_API}`);
    console.error(`[chatEngine]    Model: ${OLLAMA_MODEL}`);
    throw new Error(reason);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// BUILD PROMPT — all lawyer data from DB + barCouncilData injected
// ─────────────────────────────────────────────────────────────────────────────

function buildPrompt(userMessage, allLawyers, history, requestedCount) {
  const lawyerContext = buildLawyerContext(allLawyers);
  const historyText = history.length > 0
    ? '\nCONVERSATION SO FAR:\n' + history.slice(-6)
        .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
        .join('\n') + '\n'
    : '';

  const countInstruction = requestedCount
    ? `The user asked for ${requestedCount} lawyers. Show EXACTLY ${requestedCount} from the list.`
    : 'Show all relevant lawyers unless a specific number is requested.';

  return `You are CaseBridge AI, a helpful Indian legal assistant. You have a verified lawyer database below.

LAWYER DATABASE (from MongoDB + Bar Council of India records):
${lawyerContext}

YOUR RULES:
- ONLY use lawyers from the database above. Never invent names or details.
- For lawyer LIST requests ("list lawyers", "top N lawyers", "show lawyers"):
  ${countInstruction}
  Format: numbered list with Name, Specializations, State, BC No, Enrolled, Email.
  End with: "Would you like me to connect you with any of them?"
- For FILTERING by law area ("who handles family law", "divorce lawyer", "criminal lawyer"):
  Show ONLY lawyers whose Specializations match. Example: "Family Law" query → show only lawyers who have "Family Law" in their Specializations.
  Explain why each one matches.
- For SPECIFIC LAWYER queries ("tell me about Adv. Meera Iyer"):
  Show all their details and what cases they are suited for.
- For BEST/RECOMMEND queries:
  Pick ONE lawyer. State clearly why (specialization match, experience, enrollment date).
- For LEGAL QUESTIONS (not about lawyers):
  Answer in 3-4 sentences citing Indian law. Suggest a relevant lawyer at the end.
- Be warm, concise. Max 200 words for non-list answers.
${historyText}
User: ${userMessage}
Assistant:`;
}

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC API
// ─────────────────────────────────────────────────────────────────────────────

export async function processMessage(userMessage, history = [], language = 'en') {
  const lower = userMessage.toLowerCase().trim();

  // Greetings — no Ollama needed
  const GREETINGS = ['hello', 'hi', 'hey', 'good morning', 'good evening', 'namaste'];
  if (GREETINGS.some(g => lower === g || lower === g + '!') && lower.length < 25) {
    return {
      response: "Hello! Welcome to CaseBridge. I'm here to help you with your legal questions. What's on your mind?",
      category: 'other', urgency: 'normal',
      entities: { amounts: [], dates: [] }, lawyers: [],
    };
  }

  // Load all lawyers (barCouncilData + MongoDB)
  const allLawyers     = await getAllLawyers();
  const requestedCount = extractRequestedCount(userMessage);
  const prompt         = buildPrompt(userMessage, allLawyers, history, requestedCount);

  try {
    const response = await askOllama(prompt);
    return {
      response,
      category: 'other', urgency: 'normal',
      entities: { amounts: [], dates: [] }, lawyers: [],
    };
  } catch (err) {
    // Ollama is offline — return a clear actionable error, NOT a fake answer
    const count = allLawyers.length;
    return {
      response: `⚠️ AI engine is currently unavailable (${err.message}).\n\nTo fix this:\n1. Open PowerShell and run: ollama serve\n2. Set OLLAMA_MODEL=phi:latest in your .env file (only 1.6 GB)\n3. Restart your Node server\n\nOnce the AI is running, I can answer all questions about our ${count} verified lawyers.`,
      category: 'other', urgency: 'normal',
      entities: { amounts: [], dates: [] }, lawyers: [],
    };
  }
}

export { getAllLawyers };