export const surahs = ["الفاتحة","البقرة","آل عمران","النساء","المائدة","الأنعام","الأعراف","الأنفال","التوبة","يونس","هود","يوسف","الرعد","إبراهيم","الحجر","النحل","الإسراء","الكهف","مريم","طه","الأنبياء","الحج","المؤمنون","النور","الفرقان","الشعراء","النمل","القصص","العنكبوت","الروم","لقمان","السجدة","الأحزاب","سبأ","فاطر","يس","الصافات","ص","الزمر","غافر","فصلت","الشورى","الزخرف","الدخان","الجاثية","الأحقاف","محمد","الفتح","الحجرات","ق","الذاريات","الطور","النجم","القمر","الرحمن","الواقعة","الحديد","المجادلة","الحشر","الممتحنة","الصف","الجمعة","المنافقون","التغابن","الطلاق","التحريم","الملك","القلم","الحاقة","المعارج","نوح","الجن","المزمل","المدثر","القيامة","الإنسان","المرسلات","النبأ","النازعات","عبس","التكوير","الانفطار","المطففين","الانشقاق","البروج","الطارق","الأعلى","الغاشية","الفجر","البلد","الشمس","الليل","الضحى","الشرح","التين","العلق","القدر","البينة","الزلزلة","العاديات","القارعة","التكاثر","العصر","الهمزة","الفيل","قريش","الماعون","الكوثر","الكافرون","النصر","المسد","الإخلاص","الفلق","الناس"];

export function compileTextToHtml(text: string): string {
  let htmlChunks: string[] = [];
  const lines = text.split('\n');

  // بناء تعبير قياسي قوي للبحث عن الآيات القرآنية في أي مكان بالنص
  const surahsPattern = surahs.join('|');
  const quranRegex = new RegExp('(["«”“][\\s\\S]+?["»”])\\s*(?:\\(|\\[|-)?\\s*(?:سورة\\s+)?(' + surahsPattern + ')\\s*[:،-]?\\s*(\\d+(?:\\s*-\\s*\\d+)?)\\s*(?:\\)|\\])?', 'g');

  for (let i = 0; i < lines.length; i++) {
    let t = lines[i].trim();
    if (!t) continue;

    // 1. Headings (العناوين)
    if (t.startsWith('[Heading:') && t.endsWith(']')) {
      let hText = t.replace(/^\[Heading:\s*/, '').replace(/\]$/, '');
      htmlChunks.push(`<h2>${hText}</h2>`);
      continue;
    }
    
    // 2. Opinion Boxes (صناديق الرأي)
    const opinionMatch = t.match(/^(رأينا:|افتراء من عند أنفسنا:|تخيلات من عند أنفسنا:|موقفنا:|رأينا المفترى:)(.*)/);
    if (opinionMatch) {
      htmlChunks.push(`<div class="opinion-box"><strong>${opinionMatch[1]}</strong>${opinionMatch[2]}</div>`);
      continue;
    }

    // 3. Summaries (الخلاصة)
    const summaryMatch = t.match(/^(خلاصة|خلاصة القول|نتائج مفتراة|الخلاصة):?(.*)/);
    if (summaryMatch) {
      htmlChunks.push(`<div class="post-summary"><strong>الخلاصة:</strong>${summaryMatch[2]}</div>`);
      continue;
    }

    // 4. Images (الصور)
    if (t.includes('[Image]') || t.includes('[صورة]')) {
       htmlChunks.push(`<div class="image-placeholder">مخطط توضيحي أو صورة</div>`);
       continue;
    }

    // 5. Quranic Verses & Paragraphs (معالجة الآيات والفقرات العادية)
    let containsVerse = false;
    let processedText = t.replace(quranRegex, (match, verseText, surahName, ayahNum) => {
      containsVerse = true;
      
      let surahNum = surahs.indexOf(surahName.trim()) + 1;
      
      let refHtml = "";
      if (surahNum > 0) {
        const baseAyahNum = ayahNum.split('-')[0].trim();
        refHtml = `<a class="verse-ref" href="https://quran.com/${surahNum}/${baseAyahNum}" target="_blank">[سورة ${surahName.trim()}: ${ayahNum.trim()}]</a>`;
      } else {
        refHtml = `<span class="verse-ref">[سورة ${surahName.trim()}: ${ayahNum.trim()}]</span>`;
      }

      return `<div class="quran-verse">\n  ${verseText}\n  ${refHtml}\n</div>`;
    });

    // إضافة الكلمات المميزة كـ Code Tags
    processedText = processedText.replace(/"([^"\s]{1,20})"/g, '<code>"$1"</code>');
    
    if (containsVerse && processedText.startsWith('<div class="quran-verse">') && processedText.endsWith('</div>')) {
      htmlChunks.push(processedText);
    } else {
      htmlChunks.push(`<p>${processedText}</p>`);
    }
  }

  return htmlChunks.join('\n\n');
}
