// counselorData.js - Multilingual ASHA Patient Counselor & Rural Pictogram Knowledge Base

export const LANGUAGES = [
  { code: 'hi', label: 'हिन्दी (Hindi)',    bcp47: 'hi-IN', flag: '🇮🇳', nativeName: 'हिन्दी' },
  { code: 'mr', label: 'मराठी (Marathi)',    bcp47: 'mr-IN', flag: '🇮🇳', nativeName: 'मराठी' },
  { code: 'te', label: 'తెలుగు (Telugu)',    bcp47: 'te-IN', flag: '🇮🇳', nativeName: 'తెలుగు' },
  { code: 'ta', label: 'தமிழ் (Tamil)',      bcp47: 'ta-IN', flag: '🇮🇳', nativeName: 'தமிழ்' },
  { code: 'bn', label: 'বাংলা (Bengali)',    bcp47: 'bn-IN', flag: '🇮🇳', nativeName: 'বাংলা' },
  { code: 'en', label: 'English (Indian)',   bcp47: 'en-IN', flag: '🇮🇳', nativeName: 'English' },
];

// Localized name helper so TTS engines don't choke on Latin characters inside Devanagari / regional scripts
export function getLocalizedPatientName(lang, rawName = '') {
  const norm = (rawName || '').toLowerCase();
  
  if (norm.includes('geeta') || norm.includes('gita')) {
    if (lang === 'hi' || lang === 'mr') return 'श्रीमती गीता शर्मा';
    if (lang === 'te') return 'శ్రీమతి గీతా శర్మ';
    if (lang === 'ta') return 'திருமதி கீதா சர்மா';
    if (lang === 'bn') return 'শ্রীমতি গীতা শর্মা';
    return 'Smt. Geeta Sharma';
  }
  
  if (norm.includes('shafi')) {
    if (lang === 'hi' || lang === 'mr') return 'जनाब मोहम्मद शफी';
    if (lang === 'te') return 'మహమ్మద్ షఫీ గారు';
    if (lang === 'ta') return 'முகமது ஷாபி அவர்கள்';
    if (lang === 'bn') return 'মহম্মদ শফি বাবু';
    return 'Mohd. Shafi';
  }
  
  if (norm.includes('harpreet')) {
    if (lang === 'hi' || lang === 'mr') return 'श्रीमती हरप्रीत कौर';
    if (lang === 'te') return 'హర్‌ప్రీత్ కౌర్ గారు';
    if (lang === 'ta') return 'ஹர்ப்ரீத் கவுர் அவர்கள்';
    if (lang === 'bn') return 'হরপ্রীত কৌর';
    return 'Harpreet Kaur';
  }

  // Fallback cleanup: strip english honorifics if reading in Indian script
  const clean = rawName.replace(/^(smt\.?|shri\.?|mr\.?|mrs\.?)\s+/i, '');
  return clean || (lang === 'en' ? 'Patient' : 'मरीज़');
}


export function getCounselorContent(lang = 'hi', patientName = 'Smt. Geeta Sharma', severity = 2, csmeRisk = 'HIGH') {
  const isHighCsme = csmeRisk === 'HIGH';
  const name = getLocalizedPatientName(lang, patientName);

  const data = {
    hi: {
      langName: 'हिन्दी',
      urgencyDays: isHighCsme ? '7 से 14 दिन' : severity >= 3 ? '7 दिन' : severity === 2 ? '30 दिन' : '1 साल',
      urgencyBadge: isHighCsme ? 'अति आवश्यक (7-14 दिन में दिखाएं)' : severity >= 2 ? 'प्राथमिकता (30 दिन)' : 'नियमित जांच',
      spokenText: isHighCsme
        ? `नमस्ते ${name} जी। आपकी आँख की जांच में मध्यम स्तर का डायबिटिक रेटिनोपैथी और पुतली के केंद्र में मैक्यूलर सूजन पाई गई है। आँखों की रोशनी को सुरक्षित रखने के लिए कृपया अगले सात से चौदह दिनों के भीतर बड़े सरकारी जिला अस्पताल के आँख विशेषज्ञ से मिलें। रोज़ाना सुबह टहलें, मीठी चाय और मिठाई पूरी तरह बंद रखें, और समय पर दवा लें।`
        : severity >= 3
        ? `सावधान ${name} जी। आपकी आँखों में डायबिटीज़ का गंभीर असर है। रोशनी को बचाने के लिए तुरंत एक हफ्ते के भीतर जिला अस्पताल में आँख के डॉक्टर से मिलें।`
        : severity === 2
        ? `नमस्ते ${name} जी। आपकी आँखों में डायबिटीज़ के मध्यम लक्षण हैं। कृपया अगले एक महीने में आँख के डॉक्टर से मिलकर जांच कराएं और शूगर नियंत्रित रखें।`
        : `नमस्ते ${name} जी। आपकी आँखें स्थिर हैं। शूगर पर नियंत्रण रखें और साल में एक बार जांच अवश्य कराएं।`,
      vernacularText: isHighCsme
        ? `नमस्ते ${name} जी। आपकी आँख के पर्दे में मध्यम डायबिटिक रेटिनोपैथी और केंद्र में मैक्यूलर सूजन (CSME) पाई गई है। आँखों की रोशनी को स्थायी नुकसान से बचाने के लिए कृपया अगले 7 से 14 दिनों के भीतर बड़े जिला अस्पताल में नेत्र रोग विशेषज्ञ से मिलें। मीठी चाय, मिठाई और तली चीजें तुरंत बंद करें।`
        : `नमस्ते ${name} जी। अपनी नियमित दवा लें और हर 6 महीने में प्राथमिक स्वास्थ्य केंद्र में जांच कराएं।`,
      englishTranslation: isHighCsme
        ? `Hello ${name}. Retinal assessment indicates Moderate Diabetic Retinopathy with Center-Involved Macular Edema (CSME). Please visit a vitreoretinal specialist at the District Hospital within 7 to 14 days for OCT evaluation. Maintain strict blood sugar control and avoid sweets.`
        : `Hello ${name}. Retinal screening completed. Please monitor glucose levels and attend routine follow-up.`,
      actionTitle: isHighCsme ? 'जिला अस्पताल नेत्र विभाग में जाएं' : 'नियमित नेत्र जांच',
      actionSub: isHighCsme ? 'अगले 7-14 दिन में बड़े डॉक्टर को दिखाएं' : 'नियमित दवा और परहेज़',
      dietEat: 'पालक, मेथी, दालें, करेला, सलाद और खूब पानी',
      dietAvoid: 'मिठाई, मीठी चाय, गुड़, कोल्डड्रिंक और समोसा',
      sugarTarget: 'खाली पेट शूगर 100 - 130 mg/dL',
    },

    mr: {
      langName: 'मराठी (Marathi)',
      urgencyDays: isHighCsme ? '7 ते 14 दिवस' : '30 दिवस',
      urgencyBadge: isHighCsme ? 'अति तातडीचे (7 ते 14 दिवस)' : 'नियमित तपासणी',
      spokenText: isHighCsme
        ? `नमस्कार ${name} जी. आपल्या डोळ्यांच्या तपासणीत मधुमेहाचा परिणाम आणि रेटिनावर सूज आढळली आहे. आपली दृष्टी सुरक्षित ठेवण्यासाठी, कृपया पुढील सात ते चौदा दिवसांत जिल्हा रुग्णालयातील नेत्रतज्ज्ञांना भेटा. रोज सकाळी चालायला जा, गोड चहा आणि मिठाई पूर्णपणे बंद करा, आणि वेळेवर औषधे घ्या.`
        : `नमस्कार ${name} जी. आपल्या डोळ्यांची तपासणी झाली आहे. साखर नियंत्रणात ठेवा आणि दर सहा महिन्यांनी डोळ्यांची तपासणी करून घ्या.`,
      vernacularText: isHighCsme
        ? `नमस्कार ${name} जी. आपल्या डोळ्यात मॅक्युलर सूज (CSME) आणि डायबिटिक रेटिनोपैथी आढळली आहे. दृष्टी सुरक्षित ठेवण्यासाठी कृपया पुढील 7 ते 14 दिवसांत जिल्हा रुग्णालयातील नेत्रतज्ज्ञांना भेटा. गोड खाणे पूर्णपणे टाळा.`
        : `नमस्कार ${name} जी. साखर नियंत्रणात ठेवा आणि वेळेवर तपासणी करा.`,
      englishTranslation: `Hello ${name}. Macular edema detected. Please visit the District Hospital eye specialist within 7–14 days. Strictly avoid sweets.`,
      actionTitle: 'जिल्हा रुग्णालयातील नेत्रतज्ज्ञांना भेटा',
      actionSub: 'पुढील 7 ते 14 दिवसांत तपासणी करून घ्या',
      dietEat: 'हिरव्या पालेभाज्या, डाळी, मेथी, सॅलड, भरपूर पाणी',
      dietAvoid: 'मिठाई, साखर, गोड चहा, तेलकट पदार्थ',
      sugarTarget: 'उपाशीपोटी साखर 100 - 130 mg/dL',
    },

    te: {
      langName: 'తెలుగు (Telugu)',
      urgencyDays: isHighCsme ? '7 నుండి 14 రోజులు' : '30 రోజులు',
      urgencyBadge: isHighCsme ? 'అత్యవసరం (7-14 రోజులు)' : 'సాధారణ సమీక్ష',
      spokenText: `నమస్కారం ${name} గారు. మీ కంటి పరీక్షలో డయాబెటిక్ రెటినోపతి మరియు మాక్యులర్ వాపు కనుగొనబడింది. మీ చూపును కాపాడుకోవడానికి దయచేసి వచ్చే ఏడు నుండి పద్నాలుగు రోజుల్లో జిల్లా కంటి ఆసుపత్రికి వెళ్ళండి. స్వీట్లు మరియు చక్కెర టీ మానేయండి.`,
      vernacularText: `నమస్కారం ${name} గారు. మీ కంటి పరీక్షలో మాక్యులర్ వాపు (CSME) కనుగొనబడింది. చూపు కోల్పోకుండా ఉండటానికి వచ్చే 7-14 రోజుల్లో కంటి నిపుణుడిని సంప్రదించండి. చక్కెర పదార్థాలను పూర్తిగా నివారించండి.`,
      englishTranslation: `Hello ${name}. Retinal scan detects Macular Edema. Please visit the District Eye Hospital within 7–14 days. Avoid sugar and sweets.`,
      actionTitle: 'జిల్లా ఆసుపత్రి కంటి విభాగాన్ని సందర్శించండి',
      actionSub: '7 నుండి 14 రోజుల్లోపు డాక్టర్‌ను కలవండి',
      dietEat: 'ఆకుకూరలు, పప్పులు, కూరగాయలు, తగినంత నీరు',
      dietAvoid: 'మిఠాయిలు, చక్కెర టీ, వేపుళ్ళు, శీతల పానీయాలు',
      sugarTarget: 'ఖాళీ కడుపున చక్కెర 100 - 130 mg/dL',
    },

    ta: {
      langName: 'தமிழ் (Tamil)',
      urgencyDays: isHighCsme ? '7 முதல் 14 நாட்கள்' : '30 நாட்கள்',
      urgencyBadge: isHighCsme ? 'அவசர சிகிச்சை (7-14 நாட்கள்)' : 'வழக்கமான பரிசோதனை',
      spokenText: `வணக்கம் ${name} அவர்களே. உங்கள் கண் பரிசோதனையில் சர்க்கரை நோய் பாதிப்பு மற்றும் விழித்திரை வீக்கம் கண்டறியப்பட்டுள்ளது. பார்வையைப் பாதுகாக்க தயவுசெய்து அடுத்த ஏழு முதல் பதினான்கு நாட்களுக்குள் கண் மருத்துவரை அணுகவும். இனிப்புகளைத் தவிர்க்கவும்.`,
      vernacularText: `வணக்கம் ${name} அவர்களே. உங்கள் கண்ணில் விழித்திரை வீக்கம் (CSME) கண்டறியப்பட்டுள்ளது. பார்வையைப் பாதுகாக்க அடுத்த 7-14 நாட்களுக்குள் மாவட்ட மருத்துவமனை கண் மருத்துவரை அணுகவும். இனிப்பு மற்றும் சர்க்கரை தேநீரைத் தவிர்க்கவும்.`,
      englishTranslation: `Hello ${name}. Retinal scan shows Macular Edema. Please consult an eye specialist within 7–14 days. Avoid sweets and sugary tea.`,
      actionTitle: 'மாவட்ட மருத்துவமனை கண் பிரிவை அணுகவும்',
      actionSub: 'அடுத்த 7-14 நாட்களுக்குள் கண் மருத்துவரை சந்திக்கவும்',
      dietEat: 'கீரை வகைகள், பயறு வகைகள், காய்கறிகள், குடிநீர்',
      dietAvoid: 'இனிப்புகள், சர்க்கரை தேநீர், எண்ணெய் பண்டங்கள்',
      sugarTarget: 'வெறும் வயிற்று சர்க்கரை 100 - 130 mg/dL',
    },

    bn: {
      langName: 'বাংলা (Bengali)',
      urgencyDays: isHighCsme ? '৭ থেকে ১৪ দিন' : '৩০ দিন',
      urgencyBadge: isHighCsme ? 'জরুরি পরামর্শ (৭-১৪ দিন)' : 'নিয়মিত পরীক্ষা',
      spokenText: `নমস্কার ${name}। আপনার চোখের পরীক্ষায় ডায়াবেটিসজনিত রেটিনা ও ম্যাকুলার ফোলা ধরা পড়েছে। দৃষ্টি বাঁচাতে দয়া করে আগামী সাত থেকে চৌদ্দ দিনের মধ্যে জেলা হাসপাতালের চক্ষু বিশেষজ্ঞের সাথে দেখা করুন। মিষ্টি খাওয়া বন্ধ রাখুন।`,
      vernacularText: `নমস্কার ${name}। আপনার চোখের রেটিনায় ম্যাকুলার ফোলা (CSME) ধরা পড়েছে। দৃষ্টি বাঁচাতে আগামী ৭ থেকে ১৪ দিনের মধ্যে জেলা হাসপাতালের চক্ষু বিশেষজ্ঞের কাছে যান। মিষ্টি ও মিষ্টি চা খাওয়া বন্ধ রাখুন।`,
      englishTranslation: `Hello ${name}. Retinal scan shows Macular Edema. Please visit the District Hospital ophthalmologist within 7–14 days. Avoid sweets.`,
      actionTitle: 'জেলা হাসপাতালের চক্ষু বিভাগে যান',
      actionSub: 'আগামী ৭ থেকে ১৪ দিনের মধ্যে ডাক্তার দেখান',
      dietEat: 'শাকসবজি, ডাল, ফলমূল, পর্যাপ্ত জল',
      dietAvoid: 'মিষ্টি, মিষ্টি চা, তেলেভাজা খাবার',
      sugarTarget: 'খালি পেটে সুগার ১০০ - ১৩০ mg/dL',
    },

    en: {
      langName: 'English (Indian)',
      urgencyDays: isHighCsme ? '7 to 14 Days' : severity >= 3 ? '7 Days' : severity === 2 ? '30 Days' : 'Annual (1 Year)',
      urgencyBadge: isHighCsme ? 'Urgent Triage (7–14 Days)' : severity >= 2 ? 'Priority Referral (30 Days)' : 'Routine Screening',
      spokenText: isHighCsme
        ? `Hello ${name}. Your retinal examination shows Moderate Diabetic Retinopathy with Center-Involved Macular Edema. To protect your vision, please consult an eye specialist at the District Hospital within seven to fourteen days for OCT scan and treatment. Maintain strict blood sugar control, walk every morning, and avoid sweets and sugary tea.`
        : `Hello ${name}. Your retinal scan has been recorded. Please adhere to daily blood sugar monitoring, balanced nutrition, and scheduled eye screening.`,
      vernacularText: isHighCsme
        ? `Hello ${name}. Your retinal scan shows Moderate Diabetic Retinopathy with Center-Involved Macular Edema (CSME). Urgent consultation with an ophthalmologist is required within 7–14 days to prevent vision loss. Avoid sugary foods and tea.`
        : `Hello ${name}. Retinal screening completed. Please monitor your glycemic levels and attend follow-up review.`,
      englishTranslation: isHighCsme
        ? `Immediate specialist referral within 7–14 days for Macular Optical Coherence Tomography (OCT) & Anti-VEGF / Focal Laser evaluation.`
        : `Routine follow-up at Primary Health Centre.`,
      actionTitle: 'Visit District Hospital Eye Clinic',
      actionSub: isHighCsme ? 'Within 7–14 days for specialist review' : 'Routine 6–12 months review',
      dietEat: 'Green leafy vegetables, lentils, whole grains, water',
      dietAvoid: 'Sweets, sugary tea/chai, sodas, fried foods',
      sugarTarget: 'Fasting Blood Sugar 100 - 130 mg/dL',
    },
  };

  return data[lang] || data.hi;
}
