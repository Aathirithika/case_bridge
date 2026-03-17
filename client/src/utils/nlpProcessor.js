// Natural Language Processing utility for voice queries
// This helps understand user intent from natural language input

export const nlpProcessor = {
  
  // Detect legal category from query
  detectCategory: (query) => {
    const keywords = {
      family: ['divorce', 'marriage', 'child custody', 'alimony', 'adoption', 'domestic violence', 'dowry', 'maintenance', 'विवाह', 'तलाक', 'दहेज', 'குழந்தை', 'திருமணம்', 'விவாகரத்து', 'வரதட்சணை'],
      property: ['property', 'land', 'house', 'rent', 'lease', 'tenant', 'eviction', 'registration', 'partition', 'संपत्ति', 'जमीन', 'घर', 'किराया', 'சொத்து', 'வீடு', 'வாடகை', 'பதிவு'],
      criminal: ['police', 'arrest', 'bail', 'fir', 'complaint', 'theft', 'assault', 'murder', 'fraud', 'पुलिस', 'गिरफ्तारी', 'जमानत', 'चोरी', 'போலீஸ்', 'கைது', 'பிணை', 'திருட்டு'],
      business: ['business', 'company', 'partnership', 'gst', 'tax', 'contract', 'agreement', 'startup', 'व्यापार', 'कंपनी', 'कर', 'अनुबंध', 'வணிகம்', 'நிறுவனம்', 'வரி', 'ஒப்பந்தம்'],
      civil: ['compensation', 'damages', 'dispute', 'suit', 'claim', 'injunction', 'recovery', 'मुआवजा', 'विवाद', 'दावा', 'இழப்பீடு', 'தகராறு', 'வழக்கு'],
      labor: ['job', 'employment', 'salary', 'termination', 'workplace', 'provident fund', 'नौकरी', 'वेतन', 'श्रमिक', 'வேலை', 'சம்பளம்', 'தொழிலாளர்'],
      consumer: ['consumer', 'product', 'defect', 'refund', 'warranty', 'service', 'fraudulent', 'उपभोक्ता', 'उत्पाद', 'वापसी', 'நுகர்வோர்', 'பொருள்', 'குறைபாடு'],
    };

    const lowerQuery = query.toLowerCase();
    
    for (const [category, words] of Object.entries(keywords)) {
      for (const word of words) {
        if (lowerQuery.includes(word.toLowerCase())) {
          return category;
        }
      }
    }
    
    return 'other';
  },

  // Extract key entities from query
  extractEntities: (query) => {
    const entities = {
      persons: [],
      locations: [],
      amounts: [],
      dates: [],
    };

    // Extract amounts (₹, Rs, rupees)
    const amountRegex = /(?:₹|rs\.?|rupees?)\s*(\d+(?:,\d+)*(?:\.\d+)?)/gi;
    const amounts = query.match(amountRegex);
    if (amounts) {
      entities.amounts = amounts;
    }

    // Extract dates (simple patterns)
    const dateRegex = /\d{1,2}[-/]\d{1,2}[-/]\d{2,4}/g;
    const dates = query.match(dateRegex);
    if (dates) {
      entities.dates = dates;
    }

    return entities;
  },

  // Assess urgency level
  assessUrgency: (query) => {
    const urgentKeywords = [
      'urgent', 'emergency', 'immediately', 'asap', 'today', 'now',
      'तुरंत', 'आपातकालीन', 'உடனடியாக', 'அவசரம்'
    ];

    const lowerQuery = query.toLowerCase();
    const hasUrgentWord = urgentKeywords.some(word => 
      lowerQuery.includes(word.toLowerCase())
    );

    return hasUrgentWord ? 'high' : 'normal';
  },

  // Simplify and clean query
  simplifyQuery: (query) => {
    // Remove filler words
    const fillerWords = [
      'actually', 'basically', 'like', 'um', 'uh', 'you know',
      'वास्तव में', 'मूल रूप से', 'உண்மையில்', 'அடிப்படையில்'
    ];

    let simplified = query;
    fillerWords.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      simplified = simplified.replace(regex, '');
    });

    // Clean up extra spaces
    simplified = simplified.replace(/\s+/g, ' ').trim();

    return simplified;
  },

  // Generate suggested questions for lawyer
  generateQuestions: (query, category) => {
    const questions = {
      family: [
        'When did the incident occur?',
        'Are there any children involved?',
        'Have you tried mediation?',
        'Do you have any documentation?',
      ],
      property: [
        'Do you have property documents?',
        'When did you purchase/rent the property?',
        'What is the disputed amount?',
        'Have you sent a legal notice?',
      ],
      criminal: [
        'Has an FIR been filed?',
        'When did the incident occur?',
        'Do you have any evidence?',
        'Have you been arrested or questioned?',
      ],
      business: [
        'What type of business entity?',
        'Do you have a written agreement?',
        'What is the dispute amount?',
        'When did the issue arise?',
      ],
      civil: [
        'What is the nature of dispute?',
        'What compensation are you seeking?',
        'Do you have supporting documents?',
        'Have you tried settlement?',
      ],
      labor: [
        'How long have you been employed?',
        'Do you have an employment contract?',
        'What is your monthly salary?',
        'When were you terminated?',
      ],
      consumer: [
        'When did you purchase the product?',
        'Do you have the bill/receipt?',
        'What is the defect?',
        'Have you contacted the seller?',
      ],
    };

    return questions[category] || [
      'Can you provide more details?',
      'When did this issue start?',
      'Do you have any documentation?',
      'What outcome are you seeking?',
    ];
  },

  // Translate common legal terms to simple language
  simplifyLegalTerms: (text, language = 'en') => {
    const simplifications = {
      en: {
        'plaintiff': 'person filing the case',
        'defendant': 'person being sued',
        'litigation': 'court case process',
        'jurisdiction': 'area where court has legal authority',
        'testimony': 'statement given in court under oath',
        'summons': 'official court notice to appear',
        'affidavit': 'written statement confirmed by oath',
        'bail': 'temporary release of an accused person awaiting trial',
        'notary': 'official who verifies documents',
        'probate': 'proving a will is valid',
      },
      hi: {
        'वादी': 'मुकदमा दायर करने वाला',
        'प्रतिवादी': 'जिस पर मुकदमा किया जा रहा है',
        'जमानत': 'अस्थायी रिहाई',
      },
      ta: {
        'வாதி': 'வழக்குத் தொடருபவர்',
        'பிரதிவாதி': 'எதிர்த்தரப்பினர்',
        'பிணை': 'தற்காலிக விடுதலை (பெயில்)',
      }
    };

    let simplified = text;
    const terms = simplifications[language] || simplifications.en;

    Object.entries(terms).forEach(([legal, simple]) => {
      const regex = new RegExp(`\\b${legal}\\b`, 'gi');
      simplified = simplified.replace(regex, simple);
    });

    return simplified;
  },

  // Analyze query completeness
  analyzeCompleteness: (query) => {
    const analysis = {
      isComplete: false,
      missingInfo: [],
      score: 0,
    };

    // Check for basic elements
    const hasWho = /\b(i|my|me|we|our)\b/i.test(query);
    const hasWhat = query.length > 20; // Basic length check
    const hasWhen = /\b(yesterday|today|last|ago|month|year|day)\b/i.test(query);
    const hasWhere = /\b(in|at|near|location)\b/i.test(query);

    let score = 0;
    if (hasWho) score += 25;
    if (hasWhat) score += 25;
    if (hasWhen) score += 25;
    if (hasWhere) score += 25;

    analysis.score = score;
    analysis.isComplete = score >= 75;

    if (!hasWho) analysis.missingInfo.push('who is involved');
    if (!hasWhat) analysis.missingInfo.push('what happened (more details)');
    if (!hasWhen) analysis.missingInfo.push('when did it happen');
    if (!hasWhere) analysis.missingInfo.push('where did it happen');

    return analysis;
  },

  // Process complete voice query
  processVoiceQuery: (query, language = 'en') => {
    const category = nlpProcessor.detectCategory(query);
    const entities = nlpProcessor.extractEntities(query);
    const urgency = nlpProcessor.assessUrgency(query);
    const simplified = nlpProcessor.simplifyQuery(query);
    const questions = nlpProcessor.generateQuestions(query, category);
    const completeness = nlpProcessor.analyzeCompleteness(query);

    return {
      originalQuery: query,
      simplifiedQuery: simplified,
      detectedCategory: category,
      extractedEntities: entities,
      urgencyLevel: urgency,
      suggestedQuestions: questions,
      completenessAnalysis: completeness,
      language,
      processedAt: new Date().toISOString(),
    };
  },
};

export default nlpProcessor;