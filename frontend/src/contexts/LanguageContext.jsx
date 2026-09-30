import React, { createContext, useContext, useState } from 'react';

const LanguageContext = createContext();

export const TRANSLATIONS = {
  en: {
    // App & Header
    appTitle: 'SahaMatrix',
    tagline: 'Together, no stock-out.',
    poweredByGemini: 'Powered by Google Gemini',
    fallbackMode: 'Fallback mode',
    
    // Roles
    roleLabel: 'Role View',
    roleSecretary: 'State Health Secretary',
    roleCMO: 'District CMO',
    rolePharmacist: 'PHC Pharmacist',
    roleSecretaryDesc: 'Statewide supply visibility, inter-district rebalancing, and counterfactual policy impact.',
    roleCMODesc: 'District-level monitoring, high-risk cluster detection, and rapid local transfers.',
    rolePharmacistDesc: 'Facility inventory, paper register OCR digitization, and local 14-day stock forecasts.',

    // Actions
    simulateOutbreak: 'Simulate Outbreak',
    advance3d: 'Advance 3 Days',
    resetSim: 'Reset Simulation',
    importCsv: 'Import CSV',
    updateStockPhoto: 'Update from Photo',
    applyTransfer: 'Apply Transfer',
    applyAllTransfers: 'Apply All Recommendations',
    refreshBrief: 'Refresh Brief',
    copyBrief: 'Copy to Clipboard',
    copied: 'Copied!',
    retrainFederation: 'Retrain Federation (8 Rounds)',
    benchmarkScale: 'Run Scale Benchmark',

    // KPIs
    kpiPhcs: 'PHCs Monitored',
    kpiCritical: 'Critical Alerts',
    kpiRecommendations: 'Recommended Transfers',
    kpiStockoutsPrevented: 'Stock-outs Prevented',
    kpiCoverage: 'Patients Protected',

    // Navigation Tabs
    tabAlerts: 'Alerts',
    tabTransfers: 'Transfers',
    tabFacility: 'PHC Detail',
    tabBrief: 'Situation Brief',
    tabAsk: 'Ask SahaMatrix',
    tabFederation: 'Federation',
    tabScale: 'Scale Impact',

    // Filter labels
    filterState: 'Filter State',
    allStates: 'All States (MH, UP, TN)',
    filterDistrict: 'Filter District',
    allDistricts: 'All Districts',
    filterMedicine: 'Medicine',
    allMedicines: 'All Medicines',

    // Alerts
    severityCritical: 'CRITICAL',
    severityHigh: 'HIGH',
    daysLeft: 'days stock left',
    aiInsightTitle: 'AI Insight',
    aiInsightExplainBtn: 'AI Explain',
    likelyCause: 'Likely Cause',
    recommendedAction: 'Recommended Action',
    urgency: 'Urgency',

    // Voice & Chat
    askPlaceholder: 'Ask SahaMatrix a supply question or tap the mic...',
    askSend: 'Ask',
    listening: 'Listening...',
    voiceNotSupported: 'Voice input is not supported in this browser. Please use Chrome or Edge or enter your question using text.',
    exampleQuestionsTitle: 'Sample Questions',
    readAloud: 'Read Aloud',

    // OCR Modal
    ocrTitle: 'Paper Stock Register Ingestion',
    ocrSubtitle: 'Snap or upload a photo of the clinic register to extract inventory with Gemini Vision.',
    ocrUploadBtn: 'Analyze Photo with Gemini',
    ocrAnalyzing: 'Gemini Vision is analyzing the register...',
    ocrReviewTitle: 'Verify Extracted Stock',
    ocrReviewDesc: 'Verify and edit the detected quantities before committing to MySQL.',
    ocrColMedicine: 'Medicine',
    ocrColQuantity: 'Stock Count (Units)',
    ocrColConfidence: 'Confidence',
    ocrConfirmBtn: 'Confirm & Update PHC Stock',
    ocrCancelBtn: 'Cancel',

    // Facility Details
    stockLevels: 'Current Stock Levels',
    consumption14d: '14-Day Demand Forecast',
    resupplyLeadTime: 'Resupply Lead Time: 7 Days',
    beds: 'Beds',
    staff: 'Medical Staff',
    selectPhcPrompt: 'Select a PHC on the map or from the list to view telemetry.',
  },
  hi: {
    // App & Header
    appTitle: 'साहामैट्रिक्स',
    tagline: 'साथ मिलकर, कोई स्टॉक-आउट नहीं।',
    poweredByGemini: 'गूगल जेमिनी द्वारा संचालित',
    fallbackMode: 'फ़ॉलबैक मोड',

    // Roles
    roleLabel: 'भूमिका दृश्य',
    roleSecretary: 'राज्य स्वास्थ्य सचिव',
    roleCMO: 'जिला सीएमओ',
    rolePharmacist: 'पीएचसी फार्मासिस्ट',
    roleSecretaryDesc: 'राज्यव्यापी आपूर्ति दृश्यता, अंतर-जिला पुनर्संतुलन और नीति प्रभाव।',
    roleCMODesc: 'जिला स्तरीय निगरानी, उच्च जोखिम वाले समूहों की पहचान और स्थानीय स्थानांतरण।',
    rolePharmacistDesc: 'सुविधा सूची, कागजी रजिस्टर ओसीआर डिजिटलीकरण और 14-दिवसीय पूर्वानुमान।',

    // Actions
    simulateOutbreak: 'प्रकोप का अनुकरण करें',
    advance3d: '3 दिन आगे बढ़ाएं',
    resetSim: 'सिमुलेशन रीसेट करें',
    importCsv: 'सीएसवी आयात करें',
    updateStockPhoto: 'फोटो से अपडेट करें',
    applyTransfer: 'स्थानांतरण लागू करें',
    applyAllTransfers: 'सभी सिफारिशें लागू करें',
    refreshBrief: 'रिपोर्ट रीफ्रेश करें',
    copyBrief: 'कॉपी करें',
    copied: 'कॉपी हो गया!',
    retrainFederation: 'फेडरेशन को पुनः प्रशिक्षित करें',
    benchmarkScale: 'स्केल बेंचमार्क चलाएं',

    // KPIs
    kpiPhcs: 'निगरानी किए गए पीएचसी',
    kpiCritical: 'गंभीर चेतावनी',
    kpiRecommendations: 'अनुशंसित स्थानांतरण',
    kpiStockoutsPrevented: 'रोके गए स्टॉक-आउट',
    kpiCoverage: 'सुरक्षित मरीज',

    // Navigation Tabs
    tabAlerts: 'चेतावनियां',
    tabTransfers: 'स्थानांतरण',
    tabFacility: 'पीएचसी विवरण',
    tabBrief: 'स्थिति रिपोर्ट',
    tabAsk: 'साहामैट्रिक्स से पूछें',
    tabFederation: 'फेडरेटेड एआई',
    tabScale: 'स्केल प्रभाव',

    // Filter labels
    filterState: 'राज्य चुनें',
    allStates: 'सभी राज्य (MH, UP, TN)',
    filterDistrict: 'ज़िला चुनें',
    allDistricts: 'सभी ज़िले',
    filterMedicine: 'दवा',
    allMedicines: 'सभी दवाएं',

    // Alerts
    severityCritical: 'गंभीर',
    severityHigh: 'उच्च',
    daysLeft: 'दिनों का स्टॉक शेष',
    aiInsightTitle: 'एआई इनसाइट',
    aiInsightExplainBtn: 'एआई व्याख्या',
    likelyCause: 'संभावित कारण',
    recommendedAction: 'अनुशंसित कार्रवाई',
    urgency: 'तात्कालिकता',

    // Voice & Chat
    askPlaceholder: 'आपूर्ति संबंधी प्रश्न पूछें या माइक दबाएं...',
    askSend: 'पूछें',
    listening: 'सुन रहे हैं...',
    voiceNotSupported: 'इस ब्राउज़र में वॉयस इनपुट समर्थित नहीं है। कृपया क्रोम या एज का उपयोग करें अथवा टाइप करें।',
    exampleQuestionsTitle: 'नमूना प्रश्न',
    readAloud: 'बोलकर सुनाएं',

    // OCR Modal
    ocrTitle: 'कागजी स्टॉक रजिस्टर डिजिटलीकरण',
    ocrSubtitle: 'जेमिनी विजन के साथ इन्वेंट्री निकालने के लिए रजिस्टर की फोटो अपलोड करें।',
    ocrUploadBtn: 'जेमिनी द्वारा विश्लेषण करें',
    ocrAnalyzing: 'जेमिनी विजन रजिस्टर का विश्लेषण कर रहा है...',
    ocrReviewTitle: 'निकाले गए स्टॉक की समीक्षा करें',
    ocrReviewDesc: 'डेटाबेस में सहेजने से पहले मात्रा की पुष्टि या संपादन करें।',
    ocrColMedicine: 'दवा',
    ocrColQuantity: 'स्टॉक गणना (इकाई)',
    ocrColConfidence: 'विश्वसनीयता',
    ocrConfirmBtn: 'पुष्टि करें और अपडेट करें',
    ocrCancelBtn: 'रद्द करें',

    // Facility Details
    stockLevels: 'वर्तमान स्टॉक स्तर',
    consumption14d: '14-दिवसीय मांग पूर्वानुमान',
    resupplyLeadTime: 'पुनः आपूर्ति समय: 7 दिन',
    beds: 'बिस्तर',
    staff: 'चिकित्सा कर्मी',
    selectPhcPrompt: 'टेलीमेट्री देखने के लिए मानचित्र या सूची से पीएचसी चुनें।',
  },
  mr: {
    // App & Header
    appTitle: 'साहामॅट्रिक्स',
    tagline: 'एकत्रित, औषधांचा तुटवडा नाही.',
    poweredByGemini: 'गुगल जेमिनी द्वारे समर्थित',
    fallbackMode: 'फॉलबॅक मोड',

    // Roles
    roleLabel: 'भूमिका दृश्य',
    roleSecretary: 'राज्य आरोग्य सचिव',
    roleCMO: 'जिल्हा सीएमओ',
    rolePharmacist: 'पीएचसी फार्मासिस्ट',
    roleSecretaryDesc: 'राज्यस्तरीय पुरवठा पारदर्शकता, आंतर-जिल्हा संतुलन आणि धोरणात्मक प्रभाव.',
    roleCMODesc: 'जिल्हास्तरीय देखरेख, उच्च-जोखीम क्षेत्रांचा शोध आणि स्थानिक हस्तांतरण.',
    rolePharmacistDesc: 'केंद्र साठा नोंदवही, फोटो ओसीआर द्वारे डिजिटलायझेशन आणि 14-दिवसीय अंदाज.',

    // Actions
    simulateOutbreak: 'प्रकोपाचे अनुकरण करा',
    advance3d: '3 दिवस पुढे जा',
    resetSim: 'सिम्युलेशन रीसेट करा',
    importCsv: 'सीएसव्ही आयात करा',
    updateStockPhoto: 'फोटोवरून अद्यतनित करा',
    applyTransfer: 'हस्तांतरण लागू करा',
    applyAllTransfers: 'सर्व शिफारसी लागू करा',
    refreshBrief: 'अहवाल ताजे करा',
    copyBrief: 'कॉपी करा',
    copied: 'कॉपी केले!',
    retrainFederation: 'फेडरेशन पुन्हा प्रशिक्षित करा',
    benchmarkScale: 'स्केल चाचणी चालवा',

    // KPIs
    kpiPhcs: 'निरीक्षण केलेले केंद्र',
    kpiCritical: 'गंभीर इशारे',
    kpiRecommendations: 'शिफारस केलेले हस्तांतरण',
    kpiStockoutsPrevented: 'टाळलेला तुटवडा',
    kpiCoverage: 'सुरक्षित रुग्ण',

    // Navigation Tabs
    tabAlerts: 'इशारे',
    tabTransfers: 'हस्तांतरण',
    tabFacility: 'केंद्र तपशील',
    tabBrief: 'परिस्थिती अहवाल',
    tabAsk: 'साहामॅट्रिक्सला विचारा',
    tabFederation: 'फेडरेटेड मॉडेल',
    tabScale: 'प्रभावाचे प्रमाण',

    // Filter labels
    filterState: 'राज्य निवडा',
    allStates: 'सर्व राज्ये (MH, UP, TN)',
    filterDistrict: 'जिल्हा निवडा',
    allDistricts: 'सर्व जिल्हे',
    filterMedicine: 'औषध',
    allMedicines: 'सर्व औषधे',

    // Alerts
    severityCritical: 'गंभीर',
    severityHigh: 'उच्च',
    daysLeft: 'दिवसांचा साठा शिल्लक',
    aiInsightTitle: 'एआय इनसाइट',
    aiInsightExplainBtn: 'एआय स्पष्टीकरण',
    likelyCause: 'संभाव्य कारण',
    recommendedAction: 'शिफारस केलेली कृती',
    urgency: 'तातडी',

    // Voice & Chat
    askPlaceholder: 'औषध पुरवठ्याबद्दल विचारा किंवा माईक दाबा...',
    askSend: 'विचारा',
    listening: 'ऐकत आहे...',
    voiceNotSupported: 'या ब्राउझरमध्ये व्हॉइस इनपुट समर्थित नाही. कृपया क्रोम किंवा एज वापरा अथवा टाइप करा.',
    exampleQuestionsTitle: 'नमुना प्रश्न',
    readAloud: 'मोठ्याने वाचा',

    // OCR Modal
    ocrTitle: 'कागदी साठा नोंदवही डिजिटलायझेशन',
    ocrSubtitle: 'जेमिनी व्हिजनद्वारे नोंदवहीतील माहिती काढण्यासाठी फोटो अपलोड करा.',
    ocrUploadBtn: 'जेमिनीद्वारे विश्लेषण करा',
    ocrAnalyzing: 'जेमिनी व्हिजन फोटो तपासत आहे...',
    ocrReviewTitle: 'नोंदवहीतील साठा तपासा',
    ocrReviewDesc: 'डेटाबेसमध्ये जतन करण्यापूर्वी प्रमाणाची खात्री करा.',
    ocrColMedicine: 'औषध',
    ocrColQuantity: 'साठा संख्या (नग)',
    ocrColConfidence: 'विश्वासार्हता',
    ocrConfirmBtn: 'पुष्टी करा आणि अद्यतनित करा',
    ocrCancelBtn: 'रद्द करा',

    // Facility Details
    stockLevels: 'सद्य साठा पातळी',
    consumption14d: '14-दिवसीय मागणी अंदाज',
    resupplyLeadTime: 'पुनर्पुरवठा वेळ: 7 दिवस',
    beds: 'खाटा',
    staff: 'वैद्यकीय कर्मचारी',
    selectPhcPrompt: 'माहिती पाहण्यासाठी नकाशावरून केंद्र निवडा.',
  },
  ta: {
    // App & Header
    appTitle: 'சஹாமேட்ரிக்ஸ்',
    tagline: 'ஒன்றாக, கையிருப்பு தட்டுப்பாடு இல்லை.',
    poweredByGemini: 'கூகிள் ஜெமினி மூலம் இயக்கப்படுகிறது',
    fallbackMode: 'மாற்று முறை',

    // Roles
    roleLabel: 'பங்கு பார்வை',
    roleSecretary: 'மாநில சுகாதார செயலாளர்',
    roleCMO: 'மாவட்ட சி.எம்.ஓ',
    rolePharmacist: 'மருந்தாளுநர்',
    roleSecretaryDesc: 'மாநில அளவிலான விநியோக கண்காணிப்பு மற்றும் கொள்கை தாக்கம்.',
    roleCMODesc: 'மாவட்ட அளவிலான கண்காணிப்பு மற்றும் உள்ளூர் உடனடி இடமாற்றங்கள்.',
    rolePharmacistDesc: 'நிலைய இருப்பு, பதிவுப் புத்தக டிஜிட்டல் மயமாக்கல் மற்றும் 14 நாள் முன்னறிவிப்பு.',

    // Actions
    simulateOutbreak: 'தொற்றுநோயை உருவகப்படுத்துங்கள்',
    advance3d: '3 நாட்கள் முன்னேறுங்கள்',
    resetSim: 'மீட்டமை',
    importCsv: 'CSV இறக்குமதி',
    updateStockPhoto: 'புகைப்படத்திலிருந்து புதுப்பி',
    applyTransfer: 'இடமாற்றத்தை செயல்படுத்து',
    applyAllTransfers: 'அனைத்து பரிந்துரைகளையும் செயல்படுத்து',
    refreshBrief: 'அறிக்கையைப் புதுப்பி',
    copyBrief: 'நகலெடு',
    copied: 'நகலெடுக்கப்பட்டது!',
    retrainFederation: 'கூட்டமைப்பு பயிற்சியை மீண்டும் செய்',
    benchmarkScale: 'அளவீட்டு சோதனையை இயக்கு',

    // KPIs
    kpiPhcs: 'கண்காணிக்கப்படும் மையங்கள்',
    kpiCritical: 'தீவிர எச்சரிக்கைகள்',
    kpiRecommendations: 'பரிந்துரைக்கப்பட்ட மாற்றங்கள்',
    kpiStockoutsPrevented: 'தடுக்கப்பட்ட பற்றாக்குறைகள்',
    kpiCoverage: 'பாதுகாக்கப்பட்ட நோயாளிகள்',

    // Navigation Tabs
    tabAlerts: 'எச்சரிக்கைகள்',
    tabTransfers: 'இடமாற்றங்கள்',
    tabFacility: 'மைய விவரம்',
    tabBrief: 'சூழ்நிலை சுருக்கம்',
    tabAsk: 'சஹாமேட்ரிக்ஸிடம் கேளுங்கள்',
    tabFederation: 'கூட்டமைப்பு ஏஐ',
    tabScale: 'தாக்க அளவீடு',

    // Filter labels
    filterState: 'மாநிலம்',
    allStates: 'அனைத்து மாநிலங்கள் (MH, UP, TN)',
    filterDistrict: 'மாவட்டம்',
    allDistricts: 'அனைத்து மாவட்டங்கள்',
    filterMedicine: 'மருந்து',
    allMedicines: 'அனைத்து மருந்துகள்',

    // Alerts
    severityCritical: 'தீவிரம்',
    severityHigh: 'அதிகம்',
    daysLeft: 'நாட்கள் இருப்பு உள்ளது',
    aiInsightTitle: 'ஏஐ நுண்ணறிவு',
    aiInsightExplainBtn: 'ஏஐ விளக்கம்',
    likelyCause: 'சாத்தியமான காரணம்',
    recommendedAction: 'பரிந்துரைக்கப்பட்ட நடவடிக்கை',
    urgency: 'அவசரம்',

    // Voice & Chat
    askPlaceholder: 'மருந்து விநியோக கேள்விகளை கேளுங்கள் அல்லது மைக்கை அழுத்தவும்...',
    askSend: 'கேள்',
    listening: 'கேட்கிறது...',
    voiceNotSupported: 'இந்த உலாவியில் குரல் உள்ளீடு ஆதரிக்கப்படவில்லை. Chrome அல்லது Edge ஐப் பயன்படுத்தவும்.',
    exampleQuestionsTitle: 'மாதிரி கேள்விகள்',
    readAloud: 'சத்தமாகப் படி',

    // OCR Modal
    ocrTitle: 'காகிதப் பதிவு டிஜிட்டல் மயமாக்கல்',
    ocrSubtitle: 'ஜெமினி விஷன் மூலம் இருப்பைப் பிரித்தெடுக்க புகைப்படத்தைப் பதிவேற்றவும்.',
    ocrUploadBtn: 'ஜெமினி மூலம் பகுப்பாய்வு செய்',
    ocrAnalyzing: 'ஜெமினி விஷன் புகைப்படத்தைப் பகுப்பாய்வு செய்கிறது...',
    ocrReviewTitle: 'பிரித்தெடுக்கப்பட்ட இருப்பைச் சரிபார்க்கவும்',
    ocrReviewDesc: 'சேமிப்பதற்கு முன் அளவுகளை சரிபார்க்கவும் அல்லது திருத்தவும்.',
    ocrColMedicine: 'மருந்து',
    ocrColQuantity: 'கையிருப்பு எண்ணிக்கை (அலகுகள்)',
    ocrColConfidence: 'நம்பகத்தன்மை',
    ocrConfirmBtn: 'உறுதிப்படுத்தி புதுப்பிக்கவும்',
    ocrCancelBtn: 'ரத்து செய்',

    // Facility Details
    stockLevels: 'தற்போதைய கையிருப்பு நிலைகள்',
    consumption14d: '14 நாள் தேவை முன்னறிவிப்பு',
    resupplyLeadTime: 'மறு விநியோக நேரம்: 7 நாட்கள்',
    beds: 'படுக்கைகள்',
    staff: 'மருத்துவ பணியாளர்கள்',
    selectPhcPrompt: 'விவரங்களைக் காண வரைபடத்தில் ஒரு மையத்தைத் தேர்ந்தெடுக்கவும்.',
  }
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('en');

  const t = (key, defaultVal = '') => {
    const langDict = TRANSLATIONS[language] || TRANSLATIONS.en;
    if (langDict && langDict[key] !== undefined) {
      return langDict[key];
    }
    const enDict = TRANSLATIONS.en;
    return enDict[key] !== undefined ? enDict[key] : (defaultVal || key);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, translations: TRANSLATIONS[language] }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
