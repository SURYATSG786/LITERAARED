import PDFDocument from 'pdfkit';

const LABELS = {
  en: { title: 'Certificate of Completion', awarded: 'This certifies that', completed: 'has successfully completed', score: 'Score', credential: 'Credential ID', date: 'Issue Date', org: 'LiteraAI — Foundational Literacy Platform' },
  hi: { title: 'पूर्णता प्रमाणपत्र', awarded: 'यह प्रमाणित करता है कि', completed: 'ने सफलतापूर्वक पूरा किया', score: 'स्कोर', credential: 'प्रमाणपत्र ID', date: 'जारी तिथि', org: 'LiteraAI — मूल साक्षरता मंच' },
  ta: { title: 'நிறைவு சான்றிதழ்', awarded: 'இது சான்றளிக்கிறது', completed: 'வெற்றிகரமாக முடித்துள்ளார்', score: 'மதிப்பெண்', credential: 'சான்றிதழ் ID', date: 'வழங்கிய தேதி', org: 'LiteraAI' },
  te: { title: 'పూర్తి ధృవీకరణ పత్రం', awarded: 'ఇది ధృవీకరిస్తుంది', completed: 'విజయవంతంగా పూర్తి చేశారు', score: 'స్కోరు', credential: 'ధృవీకరణ ID', date: 'జారీ తేదీ', org: 'LiteraAI' },
  kn: { title: 'ಪೂರ್ಣಗೊಳಿಸುವಿಕೆ ಪ್ರಮಾಣಪತ್ರ', awarded: 'ಇದು ಪ್ರಮಾಣೀಕರಿಸುತ್ತದೆ', completed: 'ಯಶಸ್ವಿಯಾಗಿ ಪೂರ್ಣಗೊಳಿಸಿದ್ದಾರೆ', score: 'ಅಂಕ', credential: 'ಪ್ರಮಾಣಪತ್ರ ID', date: 'ವಿತರಣೆ ದಿನಾಂಕ', org: 'LiteraAI' },
  ml: { title: 'പൂർത്തീകരണ സർട്ടിഫിക്കറ്റ്', awarded: 'ഇത് സാക്ഷ്യപ്പെടുത്തുന്നു', completed: 'വിജയകരമായി പൂർത്തിയാക്കി', score: 'സ്കോർ', credential: 'സർട്ടിഫിക്കറ്റ് ID', date: 'ഇഷ്യൂ തീയതി', org: 'LiteraAI' },
  bn: { title: 'সমাপ্তির শংসাপত্র', awarded: 'এটি প্রমাণ করে যে', completed: 'সফলভাবে সম্পন্ন করেছেন', score: 'স্কোর', credential: 'শংসাপত্র ID', date: 'প্রদানের তারিখ', org: 'LiteraAI' },
  mr: { title: 'पूर्णता प्रमाणपत्र', awarded: 'हे प्रमाणित करते की', completed: 'यशस्वीरित्या पूर्ण केले आहे', score: 'गुण', credential: 'प्रमाणपत्र ID', date: 'जारी दिनांक', org: 'LiteraAI' },
  gu: { title: 'પૂર્ણતા પ્રમાણપત્ર', awarded: 'આ પ્રમાણિત કરે છે કે', completed: 'સફળતાપૂર્વક પૂર્ણ કર્યું છે', score: 'સ્કોર', credential: 'પ્રમાણપત્ર ID', date: 'જારી તારીખ', org: 'LiteraAI' },
  or: { title: 'ସମାପ୍ତି ପ୍ରମାଣପତ୍ର', awarded: 'ଏହା ପ୍ରମାଣିତ କରେ', completed: 'ସଫଳତାର ସହିତ ସମାପ୍ତ କରିଛନ୍ତି', score: 'ସ୍କୋର', credential: 'ପ୍ରମାଣପତ୍ର ID', date: 'ଜାରି ତାରିଖ', org: 'LiteraAI' },
  ur: { title: 'تکمیل کا سرٹیفکیٹ', awarded: 'یہ تصدیق کرتا ہے کہ', completed: 'نے کامیابی سے مکمل کیا', score: 'اسکور', credential: 'سند ID', date: 'تاریخ اجرا', org: 'LiteraAI' },
};

export function generateCertificatePdf(payload) {
  const {
    name,
    courseTitle,
    score,
    credentialId,
    issuedDate,
    language = 'en',
    learningLanguage = 'en',
  } = payload;

  const labels = LABELS[language] || LABELS.en;

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 50 });
      const chunks = [];
      doc.on('data', (c) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Background wash using LiteraAI sky blue palette
      doc.rect(0, 0, doc.page.width, doc.page.height).fill('#CDEEFF');
      doc.roundedRect(30, 30, doc.page.width - 60, doc.page.height - 60, 18)
        .fillAndStroke('#EEF9FF', '#0B6FB8');

      doc.fillColor('#06304F');
      doc.fontSize(12).text('LITERAAI', 50, 60, { align: 'center' });
      doc.fontSize(32).fillColor('#0B6FB8').text(labels.title, 50, 95, { align: 'center' });

      doc.fontSize(14).fillColor('#06304F').text(labels.awarded, 50, 160, { align: 'center' });
      doc.fontSize(28).fillColor('#0B6FB8').text(name, 50, 190, { align: 'center' });
      doc.fontSize(14).fillColor('#06304F').text(labels.completed, 50, 240, { align: 'center' });
      doc.fontSize(20).fillColor('#06304F').text(courseTitle, 50, 270, { align: 'center' });

      doc.fontSize(14).fillColor('#06304F')
        .text(`${labels.score}: ${score}%`, 80, 330)
        .text(`${labels.credential}: ${credentialId}`, 80, 355)
        .text(`${labels.date}: ${issuedDate}`, 80, 380)
        .text(`Learning Language: ${String(learningLanguage).toUpperCase()}`, 80, 405);

      doc.fontSize(11).fillColor('#0B6FB8').text(labels.org, 50, doc.page.height - 80, { align: 'center' });
      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

const LEAGUE_THEMES = {
  bronze: { bg: '#FDF6E2', stroke: '#CD7F32', text: '#6E4314', title: 'BRONZE LEAGUE CERTIFICATE' },
  silver: { bg: '#F4F6F9', stroke: '#9EA7B0', text: '#3E4A56', title: 'SILVER LEAGUE CERTIFICATE' },
  gold: { bg: '#FFFBF0', stroke: '#D4AF37', text: '#7A5C00', title: 'GOLD LEAGUE CERTIFICATE' },
  ruby: { bg: '#FFF0F3', stroke: '#E0115F', text: '#7A0026', title: 'RUBY LEAGUE CERTIFICATE' },
};

export function generateLeagueCertificatePdf(payload) {
  const {
    name,
    league = 'bronze',
    score,
    credentialId,
    issuedDate,
  } = payload;

  const theme = LEAGUE_THEMES[league.toLowerCase()] || LEAGUE_THEMES.bronze;

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 50 });
      const chunks = [];
      doc.on('data', (c) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc.rect(0, 0, doc.page.width, doc.page.height).fill(theme.bg);
      doc.roundedRect(30, 30, doc.page.width - 60, doc.page.height - 60, 18)
        .fillAndStroke('#FFFFFF', theme.stroke);

      doc.fillColor(theme.text);
      doc.fontSize(12).text('LITERAAI LEAGUE ACADEMY', 50, 60, { align: 'center' });
      doc.fontSize(30).fillColor(theme.stroke).text(theme.title, 50, 95, { align: 'center' });

      doc.fontSize(14).fillColor(theme.text).text('This is proudly presented to', 50, 160, { align: 'center' });
      doc.fontSize(28).fillColor(theme.stroke).text(name, 50, 190, { align: 'center' });
      doc.fontSize(14).fillColor(theme.text).text(`for successfully completing the ${league.toUpperCase()} League Exam`, 50, 240, { align: 'center' });

      doc.fontSize(14).fillColor(theme.text)
        .text(`Advancement Score: ${score}%`, 80, 330)
        .text(`Credential ID: ${credentialId}`, 80, 355)
        .text(`Date of Issue: ${issuedDate}`, 80, 380);

      doc.fontSize(11).fillColor(theme.stroke).text('LiteraAI — Literacy League Certification', 50, doc.page.height - 80, { align: 'center' });
      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
