// server/routes/chat.js
import express from 'express';
import fetch from 'node-fetch';
import { protect } from '../middleware/auth.js';
import User from '../models/User.js';
import Case from '../models/Case.js';

const router = express.Router();

// ─── Ollama helper ─────────────────────────────────────────────────────────────
const callOllama = async (systemPrompt, userMessage, history = []) => {
  const ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
  const ollamaModel = process.env.OLLAMA_MODEL || 'llama3';

  const historyText = history
    .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
    .join('\n');

  const parts = [systemPrompt];
  if (historyText) parts.push('\nConversation so far:\n' + historyText);
  parts.push('\nUser: ' + userMessage + '\nAssistant:');
  const prompt = parts.join('');

  try {
    const res = await fetch(`${ollamaUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: ollamaModel,
        prompt,
        stream: false,
        options: { temperature: 0.65, num_predict: 350 },
      }),
    });
    if (!res.ok) throw new Error('Ollama HTTP ' + res.status);
    const data = await res.json();
    return data.response?.trim() || null;
  } catch (err) {
    console.warn('[Ollama] unavailable:', err.message);
    return null;
  }
};

// ─── Guided question flows — 4 questions each, 4 options each ────────────────
const FLOWS = {
  family: [
    { id: 'issue_type', text: 'What is your family law issue?', options: ['Divorce / Separation', 'Child Custody', 'Domestic Violence', 'Maintenance / Alimony'] },
    { id: 'duration', text: 'How long has this situation been going on?', options: ['Less than 1 month', '1 to 6 months', '6 months to 1 year', 'More than 1 year'] },
    { id: 'children', text: 'Are children under 18 involved in this matter?', options: ['Yes, custody is disputed', 'Yes, custody is agreed', 'No children involved', 'Not applicable'] },
    { id: 'prior_action', text: 'What steps have you already taken?', options: ['No steps taken yet', 'Spoken to a lawyer', 'Filed a police complaint', 'Court case already filed'] },
  ],
  property: [
    { id: 'issue_type', text: 'What is your property issue?', options: ['Ownership / Title Dispute', 'Landlord / Tenant Conflict', 'Property Fraud or Forgery', 'Inheritance / Partition'] },
    { id: 'documents', text: 'Do you have property documents with you?', options: ['Yes, all documents available', 'Partial documents only', 'Documents are disputed', 'No documents at all'] },
    { id: 'value', text: 'What is the approximate value of the property?', options: ['Below Rs 10 Lakhs', 'Rs 10 to 50 Lakhs', 'Rs 50 Lakhs to 1 Crore', 'Over Rs 1 Crore'] },
    { id: 'prior_action', text: 'Has any legal notice been sent or received?', options: ['I sent a legal notice', 'I received a legal notice', 'Both parties exchanged notices', 'No notices yet'] },
  ],
  criminal: [
    { id: 'issue_type', text: 'What is your criminal matter?', options: ['FIR Filed Against Me', 'I Want to File an FIR', 'Need Bail / Anticipatory Bail', 'Cheque Bounce Case'] },
    { id: 'custody', text: 'What is your current status with authorities?', options: ['Currently in police custody', 'Received a court summons', 'Anticipating arrest', 'Not yet formally involved'] },
    { id: 'section', text: 'Do you know which IPC / BNS section is involved?', options: ['Yes, I know the exact section', 'IPC 420 / 406 (Fraud)', 'IPC 498A (Domestic)', 'Not sure / Need help finding out'] },
    { id: 'evidence', text: 'What evidence or support do you have?', options: ['Strong documentary evidence', 'Witnesses available', 'Digital or call records', 'No evidence yet'] },
  ],
  business: [
    { id: 'issue_type', text: 'What is your business legal issue?', options: ['Contract Dispute', 'Partnership / Shareholder Conflict', 'GST / Income Tax Issue', 'Intellectual Property Matter'] },
    { id: 'agreement', text: 'Is there a written agreement between parties?', options: ['Yes, signed and stamped', 'Unsigned draft exists', 'Verbal agreement only', 'No agreement at all'] },
    { id: 'amount', text: 'What is the approximate dispute amount?', options: ['Below Rs 1 Lakh', 'Rs 1 to 10 Lakhs', 'Rs 10 to 50 Lakhs', 'Over Rs 50 Lakhs'] },
    { id: 'prior_action', text: 'What action has been taken so far?', options: ['Sent a legal notice', 'Filed a court case', 'Reported to police', 'No action yet'] },
  ],
  labor: [
    { id: 'issue_type', text: 'What is your employment or labour issue?', options: ['Wrongful Termination', 'Unpaid Salary / PF / Gratuity', 'Workplace Harassment', 'Labour Court Case'] },
    { id: 'contract', text: 'Do you have a formal employment contract?', options: ['Yes, written contract', 'Only an offer letter', 'Verbal agreement only', 'No contract at all'] },
    { id: 'duration', text: 'How many months of dues are pending, if any?', options: ['1 to 2 months', '3 to 6 months', 'More than 6 months', 'Not applicable'] },
    { id: 'hr_complaint', text: 'Have you raised a complaint with HR or management?', options: ['Yes, but got no resolution', 'Raised, got partial result', 'Afraid to raise it', 'Not raised yet'] },
  ],
  consumer: [
    { id: 'issue_type', text: 'What is your consumer complaint about?', options: ['Defective Product', 'Service Deficiency', 'Online Shopping Fraud', 'Insurance or Banking Dispute'] },
    { id: 'proof', text: 'Do you have proof of purchase?', options: ['Yes, physical bill', 'Digital receipt or email', 'Bank statement only', 'No receipt at all'] },
    { id: 'company_response', text: 'What was the company response to your complaint?', options: ['No response at all', 'Refused refund or replacement', 'Gave partial resolution', 'I have not complained yet'] },
    { id: 'relief_sought', text: 'What relief are you looking for?', options: ['Full refund', 'Replacement of product', 'Compensation for loss', 'File consumer court case'] },
  ],
  civil: [
    { id: 'issue_type', text: 'What is your civil dispute about?', options: ['Money Recovery', 'Cheque Bounce', 'Accident Compensation', 'Defamation or Slander'] },
    { id: 'amount', text: 'What is the amount involved?', options: ['Below Rs 1 Lakh', 'Rs 1 to 10 Lakhs', 'Rs 10 to 50 Lakhs', 'Over Rs 50 Lakhs'] },
    { id: 'proof', text: 'Do you have written proof of your claim?', options: ['Yes, strong documents', 'Some documents', 'Digital records only', 'No documents yet'] },
    { id: 'case_filed', text: 'Has a court case already been filed?', options: ['Yes, I am the plaintiff', 'Yes, I am the defendant', 'No, want to file now', 'Still exploring options'] },
  ],
  other: [
    { id: 'broad_category', text: 'Which area is your issue closest to?', options: ['Personal or Family matter', 'Financial or Debt issue', 'Government or RTI related', 'Police or Criminal matter'] },
    { id: 'urgency', text: 'How urgent is your situation?', options: ['Emergency, need help today', 'Urgent, within this week', 'Can wait up to a month', 'Just exploring my options'] },
    { id: 'prior_lawyer', text: 'Have you consulted a lawyer before for this?', options: ['Yes, want a second opinion', 'Yes, but I was unsatisfied', 'No, this is my first time', 'Consulted friends or family only'] },
    { id: 'desired_outcome', text: 'What outcome are you looking for?', options: ['File a court case', 'Out-of-court settlement', 'Understand my legal rights', 'Draft a legal notice'] },
  ],
};

// ─── Category detection ────────────────────────────────────────────────────────
const detectCategory = (text) => {
  const q = text.toLowerCase();
  if (/divorce|marriage|custody|alimony|adoption|domestic.viol|maintenance|matrimonial|separation/.test(q)) return 'family';
  if (/property|land|house|flat|rent|tenant|landlord|eviction|lease|possession|plot|builder/.test(q)) return 'property';
  if (/police|arrest|bail|fir|theft|assault|murder|accused|criminal|section|bns|ipc|cheque.bounce|forgery/.test(q)) return 'criminal';
  if (/business|company|gst|tax|contract|partnership|startup|trademark|copyright|incorporation/.test(q)) return 'business';
  if (/job|salary|termination|fired|employment|hr|pf|gratuity|labour|workplace|dismiss/.test(q)) return 'labor';
  if (/consumer|product|defective|refund|warranty|insurance|online.shop|ecomm|flipkart|amazon/.test(q)) return 'consumer';
  if (/compensation|damages|civil|money.recov|cheque|defamation|accident|negligence/.test(q)) return 'civil';
  return 'other';
};

// ─── Derive priority from collected answers ────────────────────────────────────
const derivePriority = (answers) => {
  const v = Object.values(answers).join(' ').toLowerCase();
  if (/emergency|custody.is.disputed|currently.in.police|domestic.violence|need.bail/.test(v)) return 'high';
  if (/urgent|within.this.week|court.case.already.filed|anticipating.arrest/.test(v)) return 'medium';
  return 'low';
};

// ─── Match lawyers from DB ─────────────────────────────────────────────────────
const getMatchedLawyers = async (category) => {
  const specMap = {
    family:   ['Family Law', 'Civil Law'],
    property: ['Property Law', 'Civil Law'],
    criminal: ['Criminal Law'],
    business: ['Corporate Law', 'Tax Law'],
    labor:    ['Labour Law', 'Civil Law'],
    consumer: ['Consumer Law', 'Civil Law'],
    civil:    ['Civil Law', 'General Consultation'],
    other:    ['General Consultation', 'Civil Law'],
  };

  let lawyers = await User.find({ role: 'lawyer', specializations: { $in: specMap[category] || ['General Consultation'] } })
    .select('name email specializations rating reviewCount barCouncilNumber')
    .limit(3)
    .lean();

  if (lawyers.length === 0) {
    lawyers = await User.find({ role: 'lawyer' })
      .select('name email specializations rating reviewCount barCouncilNumber')
      .limit(3)
      .lean();
  }
  return lawyers;
};

// ══════════════════════════════════════════════════════════════════════════════

// POST /api/chat/start
router.post('/start', protect, async (req, res) => {
  try {
    const { message, language = 'en' } = req.body;
    if (!message?.trim()) return res.status(400).json({ message: 'Message required' });

    const category = detectCategory(message);
    const flow = FLOWS[category];

    const systemPrompt = `You are a warm, empathetic Indian legal assistant for CaseBridge.
A user described their legal issue. Write 1-2 short sentences:
1) Acknowledge their situation with empathy
2) Reassure them help is available
Under 30 words. Do NOT ask questions yet. Be human, not robotic.`;

    const reply = (await callOllama(systemPrompt, message)) ||
      `I understand you are dealing with a ${category} matter — you are in the right place. Let me ask a few quick questions to find the best lawyer for your situation.`;

    res.json({
      success: true,
      category,
      reply,
      question: { ...flow[0], index: 0, total: flow.length },
      sessionData: {
        category,
        questionIndex: 0,
        answers: {},
        originalMessage: message,
        language,
        ollamaHistory: [
          { role: 'user', content: message },
          { role: 'assistant', content: reply },
        ],
      },
    });
  } catch (err) {
    console.error('[chat/start]', err);
    res.status(500).json({ message: err.message });
  }
});

// POST /api/chat/answer
router.post('/answer', protect, async (req, res) => {
  try {
    const { answer, sessionData } = req.body;
    const { category, questionIndex, answers, originalMessage, language, ollamaHistory } = sessionData;

    const flow = FLOWS[category] || FLOWS.other;
    const updatedAnswers = { ...answers, [flow[questionIndex].id]: answer };
    const nextIndex = questionIndex + 1;
    const done = nextIndex >= flow.length;

    const ackPrompt = `You are a helpful Indian legal assistant. The user just answered a guided question.
Acknowledge in ONE sentence under 15 words. Be warm and natural. No advice yet.`;
    const ack = (await callOllama(ackPrompt, answer, ollamaHistory)) || 'Understood.';

    const updatedHistory = [
      ...ollamaHistory,
      { role: 'user', content: answer },
      { role: 'assistant', content: ack },
    ];

    if (!done) {
      return res.json({
        success: true,
        ack,
        question: { ...flow[nextIndex], index: nextIndex, total: flow.length },
        sessionData: { ...sessionData, questionIndex: nextIndex, answers: updatedAnswers, ollamaHistory: updatedHistory },
        isComplete: false,
      });
    }

    // All done — generate summary + lawyers
    const answersContext = flow
      .map((q) => `Q: ${q.text}\nA: ${updatedAnswers[q.id] || 'Not answered'}`)
      .join('\n\n');

    const summaryPrompt = `You are an expert Indian legal assistant.
Based on the user's answers below, provide exactly:
1. Two sentences summarising their specific legal situation with empathy
2. One key legal right they have under Indian law (cite the Act if possible)
3. One concrete immediate action they should take right now
Be specific, practical, plain language. Max 90 words.`;

    const summary = (await callOllama(summaryPrompt, `Original issue: "${originalMessage}"\n\n${answersContext}`, updatedHistory)) ||
      `Based on your answers, you have a clear ${category} legal matter that requires professional attention. A qualified lawyer will review your case and advise you on the best path forward.`;

    const lawyers = await getMatchedLawyers(category);
    const priority = derivePriority(updatedAnswers);

    return res.json({
      success: true,
      ack,
      isComplete: true,
      summary,
      lawyers,
      priority,
      caseSummary: { category, originalMessage, answers: updatedAnswers, priority, answersContext },
      sessionData: { ...sessionData, answers: updatedAnswers, ollamaHistory: updatedHistory, isComplete: true, priority },
    });
  } catch (err) {
    console.error('[chat/answer]', err);
    res.status(500).json({ message: err.message });
  }
});

// POST /api/chat/freetext
router.post('/freetext', protect, async (req, res) => {
  try {
    const { message, history = [], category = 'other', language = 'en' } = req.body;
    const langName = language === 'ta' ? 'Tamil' : language === 'hi' ? 'Hindi' : 'English';

    const systemPrompt = `You are CaseBridge AI, a knowledgeable Indian legal assistant.
Context: ${category} law. Reply in ${langName}.
Answer in 3-4 sentences. Be practical and specific to Indian law.
Do not give definitive legal advice — always say to consult a lawyer for specifics.`;

    const reply = (await callOllama(systemPrompt, message, history)) ||
      "That is a great question. I would recommend discussing this specific point with one of our verified lawyers who can review all the details of your case personally.";

    res.json({ success: true, reply });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/chat/submit-case
router.post('/submit-case', protect, async (req, res) => {
  try {
    const { caseSummary, selectedLawyerId } = req.body;
    const { category, originalMessage, answers, priority, answersContext } = caseSummary;

    const typeMap = {
      family: 'Family Law', property: 'Property Law', criminal: 'Criminal Law',
      business: 'Corporate Law', labor: 'Labour Law', consumer: 'Consumer Law',
      civil: 'Civil Law', other: 'General Consultation',
    };

    const newCase = await Case.create({
      caseType: typeMap[category] || 'General Consultation',
      title: `${typeMap[category] || 'Legal'} Matter — ${new Date().toLocaleDateString('en-IN')}`,
      description: `${originalMessage}\n\nDetailed questionnaire:\n${answersContext || JSON.stringify(answers, null, 2)}`,
      client: req.user._id,
      lawyer: selectedLawyerId || null,
      priority: ['low', 'medium', 'high'].includes(priority) ? priority : 'medium',
      status: 'submitted',
      submissionMethod: 'text',
      nlpAnalysis: { detectedCategory: category, urgencyLevel: priority || 'medium', language: 'en', confidence: 0.92 },
    });

    await newCase.populate('lawyer', 'name email phone');
    res.status(201).json({ success: true, message: 'Case submitted', case: newCase });
  } catch (err) {
    console.error('[chat/submit-case]', err);
    res.status(500).json({ message: err.message });
  }
});

export default router;