import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

// Initialize the Gemini API client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'MISSING_API_KEY');

// ─── Smart Fallback: keyword-based legal advice ───────────────────────────────
const LEGAL_RESPONSES = {
    property: {
        keywords: ['property', 'land', 'house', 'rent', 'tenant', 'landlord', 'eviction', 'lease', 'deed', 'ownership', 'real estate', 'plot', 'flat', 'apartment'],
        response: `Thank you for reaching out about your property matter. Based on what you've described, this appears to involve **Property Law**.

Here's what you should know:

• **Property disputes** (ownership, boundary, title) are handled under the Transfer of Property Act and relevant state laws.
• **Tenant/Landlord issues** (eviction, rent, lease) fall under the Rent Control Act in most Indian states.
• **Documents to gather**: sale deed, title documents, rental agreement, tax receipts, and any correspondence.

**Recommended next step**: Consult a Property Law specialist on CaseBridge who can review your documents and advise you on the strongest legal path forward.

*⚠️ Disclaimer: This is general legal information only and not formal legal advice. Please consult a qualified advocate for your specific situation.*`
    },
    criminal: {
        keywords: ['criminal', 'arrested', 'police', 'fir', 'bail', 'accused', 'cheating', 'fraud', 'assault', 'murder', 'theft', 'robbery', 'case filed', 'jail', 'custody'],
        response: `I understand this is a serious and stressful situation involving a **Criminal Law** matter.

Here's what you should know immediately:

• You have the right to **legal representation** from the moment of arrest (Article 22 of the Constitution).
• If an FIR has been filed, you have the right to a copy of it.
• **Bail** can be applied for under Sections 436-439 of the CrPC depending on the nature of the offence.
• Do **not** make any statements to police without your lawyer present.

**Recommended next step**: Contact a Criminal Defense lawyer on CaseBridge immediately — time is critical in criminal cases.

*⚠️ Disclaimer: This is general legal information only and not formal legal advice. Please consult a qualified advocate for your specific situation.*`
    },
    family: {
        keywords: ['divorce', 'marriage', 'custody', 'child', 'alimony', 'maintenance', 'domestic', 'wife', 'husband', 'separation', 'family', 'adoption', 'dowry'],
        response: `I'm sorry to hear you're going through a difficult family situation. This appears to involve **Family Law**.

Here's what you should know:

• **Divorce** can be filed under the Hindu Marriage Act, Special Marriage Act, or personal law depending on religion.
• **Child Custody** is decided based on the best interest of the child (Guardians and Wards Act).
• **Maintenance/Alimony** is available under Section 125 CrPC or personal laws.
• **Domestic Violence** cases are handled under the Protection of Women from Domestic Violence Act, 2005.

**Recommended next step**: A Family Law specialist can help you understand your rights and guide you through the process sensitively.

*⚠️ Disclaimer: This is general legal information only and not formal legal advice. Please consult a qualified advocate for your specific situation.*`
    },
    business: {
        keywords: ['business', 'company', 'contract', 'agreement', 'partner', 'corporate', 'startup', 'employee', 'employer', 'gst', 'tax', 'trademark', 'intellectual property', 'dispute'],
        response: `Thank you for your query about a **Business / Corporate Law** matter.

Here's what you should know:

• **Contract disputes**: Governed by the Indian Contract Act, 1872. Breach of contract entitles you to damages or specific performance.
• **Company matters**: Regulated by the Companies Act, 2013 and SEBI regulations for listed entities.
• **Trademark/IP**: Registration under the Trade Marks Act, 1999 provides legal protection.
• **Employment disputes**: Covered under the Industrial Disputes Act and relevant labour laws.

**Recommended next step**: A Corporate Law specialist can review your contracts and advise on the best strategy.

*⚠️ Disclaimer: This is general legal information only and not formal legal advice. Please consult a qualified advocate for your specific situation.*`
    },
    consumer: {
        keywords: ['consumer', 'product', 'defective', 'refund', 'service', 'complaint', 'company negligence', 'hospital', 'medical negligence', 'insurance claim'],
        response: `Thank you for reaching out about a **Consumer Rights** matter.

Here's what you should know:

• You are protected under the **Consumer Protection Act, 2019**.
• You can file a complaint at the District Consumer Disputes Redressal Commission (for claims up to ₹1 Crore).
• Common remedies include: replacement, refund, compensation for loss, and punitive damages.
• Most consumer cases are resolved within **90-150 days**.

**Recommended next step**: A Consumer Law specialist can help you draft and file your complaint with the right forum.

*⚠️ Disclaimer: This is general legal information only and not formal legal advice. Please consult a qualified advocate for your specific situation.*`
    },
    labour: {
        keywords: ['job', 'salary', 'fired', 'terminated', 'workplace', 'labour', 'labor', 'pf', 'provident fund', 'gratuity', 'wrongful termination', 'harassment', 'work'],
        response: `I understand your concern about a **Labour / Employment Law** matter.

Here's what you should know:

• **Wrongful termination** is covered under the Industrial Disputes Act. You may be entitled to reinstatement or compensation.
• **Salary dues**: File a complaint with the Labour Commissioner or approach the Labour Court.
• **PF/Gratuity**: Non-payment is a criminal offence. EPFO has a grievance portal for PF complaints.
• **Workplace Harassment**: Covered under the Prevention of Sexual Harassment (POSH) Act, 2013.

**Recommended next step**: A Labour Law specialist can file the right complaint in the right forum quickly.

*⚠️ Disclaimer: This is general legal information only and not formal legal advice. Please consult a qualified advocate for your specific situation.*`
    }
};

const GENERAL_RESPONSE = (query) => `Thank you for reaching out to **CaseBridge AI Legal Assistant**! 🏛️

I received your message: *"${query.substring(0, 100)}${query.length > 100 ? '...' : ''}"*

To help you better, could you tell me more about:
• **What type of legal issue** are you facing? (e.g., property, family, criminal, business, consumer)
• **What outcome** are you hoping to achieve?
• **When** did this issue start?

CaseBridge connects you with **verified lawyers** specializing in all areas of Indian law. Based on your issue, I can help identify the right type of lawyer for you.

*⚠️ Disclaimer: This AI assistant provides general legal information only, not formal legal advice. Always consult a qualified advocate for your specific situation.*`;

function smartFallbackResponse(prompt) {
    const lowerPrompt = prompt.toLowerCase();
    for (const [category, data] of Object.entries(LEGAL_RESPONSES)) {
        if (data.keywords.some(kw => lowerPrompt.includes(kw))) {
            return data.response;
        }
    }
    return GENERAL_RESPONSE(prompt);
}

function smartFallbackExtract(text) {
    const lower = text.toLowerCase();
    let category = 'General Consultation';
    let urgency = 'medium';

    if (LEGAL_RESPONSES.criminal.keywords.some(kw => lower.includes(kw))) {
        category = 'Criminal Law'; urgency = 'high';
    } else if (LEGAL_RESPONSES.family.keywords.some(kw => lower.includes(kw))) {
        category = 'Family Law'; urgency = 'medium';
    } else if (LEGAL_RESPONSES.property.keywords.some(kw => lower.includes(kw))) {
        category = 'Property Law'; urgency = 'medium';
    } else if (LEGAL_RESPONSES.business.keywords.some(kw => lower.includes(kw))) {
        category = 'Corporate Law'; urgency = 'low';
    } else if (LEGAL_RESPONSES.consumer.keywords.some(kw => lower.includes(kw))) {
        category = 'Consumer Law'; urgency = 'medium';
    } else if (LEGAL_RESPONSES.labour.keywords.some(kw => lower.includes(kw))) {
        category = 'Labour Law'; urgency = 'medium';
    }

    const summary = text.length > 120 ? text.substring(0, 120) + '...' : text;
    return { summary, category, urgency };
}
// ─────────────────────────────────────────────────────────────────────────────

export const generateLegalAdvice = async (prompt) => {
    // Try Gemini first if API key exists
    if (process.env.GEMINI_API_KEY) {
        try {
            const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
            const systemInstruction = `You are a helpful and professional Legal Expert AI Assistant for 'CaseBridge', a platform connecting clients with specialized lawyers in India. 
Your role is to guide users, clarify their legal questions, and help them understand what kind of lawyer they might need.
IMPORTANT RULES:
1. You MUST NOT provide binding legal counsel, act as their official attorney, or guarantee outcomes.
2. Always add a disclaimer that your advice is for informational purposes only.
3. If they ask about non-legal topics, politely decline and steer the conversation back to legal assistance.
4. Keep your answers concise, clear, and empathetic. Use markdown formatting for readability.`;
            const fullPrompt = `${systemInstruction}\n\nClient Query: ${prompt}\n\nAI Legal Assistant Response:`;
            const result = await model.generateContent(fullPrompt);
            return result.response.text();
        } catch (error) {
            console.warn('Gemini API unavailable, using smart fallback:', error.message?.substring(0, 80));
        }
    }

    // Smart keyword-based fallback
    return smartFallbackResponse(prompt);
};

export const extractCaseDetails = async (transcribedText) => {
    // Try Gemini first if API key exists
    if (process.env.GEMINI_API_KEY) {
        try {
            const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
            const prompt = `Analyze the following transcribed text from a client seeking legal help.
Extract the following information and return it as a pure JSON object without markdown formatting:
1. "summary": A brief 1-2 sentence summary of their problem.
2. "category": The legal category (e.g., "Family Law", "Criminal Defense", "Corporate Law", "Property Dispute", etc.).
3. "urgency": Rate the urgency strictly as "high", "medium", or "low".

Text: "${transcribedText}"
JSON Response:`;
            const result = await model.generateContent(prompt);
            const responseText = await result.response.text();
            try {
                const cleanJsonStr = responseText.replace(/```json/gi, '').replace(/```/gi, '').trim();
                return JSON.parse(cleanJsonStr);
            } catch (e) {
                console.warn('Failed to parse Gemini JSON, using fallback');
                return smartFallbackExtract(transcribedText);
            }
        } catch (error) {
            console.warn('Gemini API unavailable for voice analysis, using smart fallback:', error.message?.substring(0, 80));
        }
    }

    // Smart keyword-based fallback
    return smartFallbackExtract(transcribedText);
};
