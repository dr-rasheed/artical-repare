export const surahs = ["الفاتحة","البقرة","آل عمران","النساء","المائدة","الأنعام","الأعراف","الأنفال","التوبة","يونس","هود","يوسف","الرعد","إبراهيم","الحجر","النحل","الإسراء","الكهف","مريم","طه","الأنبياء","الحج","المؤمنون","النور","الفرقان","الشعراء","النمل","القصص","العنكبوت","الروم","لقمان","السجدة","الأحزاب","سبأ","فاطر","يس","الصافات","ص","الزمر","غافر","فصلت","الشورى","الزخرف","الدخان","الجاثية","الأحقاف","محمد","الفتح","الحجرات","ق","الذاريات","الطور","النجم","القمر","الرحمن","الواقعة","الحديد","المجادلة","الحشر","الممتحنة","الصف","الجمعة","المنافقون","التغابن","الطلاق","التحريم","الملك","القلم","الحاقة","المعارج","نوح","الجن","المزمل","المدثر","القيامة","الإنسان","المرسلات","النبأ","النازعات","عبس","التكوير","الانفطار","المطففين","الانشقاق","البروج","الطارق","الأعلى","الغاشية","الفجر","البلد","الشمس","الليل","الضحى","الشرح","التين","العلق","القدر","البينة","الزلزلة","العاديات","القارعة","التكاثر","العصر","الهمزة","الفيل","قريش","الماعون","الكوثر","الكافرون","النصر","المسد","الإخلاص","الفلق","الناس"];

export function compileTextToHtml(text: string): string {
  let htmlChunks: string[] = [];
  const lines = text.split('\n');

  // النمط الجديد والسريع لاكتشاف الآيات بناءً على طلب المستخدم
  // أي سطر كامل ينتهي بقوسين داخلهما (رقم:رقم) نعتبره آية
  const quranLineRegex = /^(.*?)\s*\(\s*(\d+)\s*:\s*(\d+(?:\s*-\s*\d+)?)\s*\)$/;

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

    // 5. Quranic Verses (اكتشاف سريع ومباشر للآيات في سطر منفصل)
    const verseMatch = t.match(quranLineRegex);
    if (verseMatch) {
      const lastSurahNum = parseInt(verseMatch[2], 10);
      const lastAyahNumStr = verseMatch[3].trim();
      
      const surahName = lastSurahNum <= surahs.length && lastSurahNum > 0 ? surahs[lastSurahNum - 1] : lastSurahNum.toString();
      
      const inlineRefs: {surah: number, ayah: string}[] = [];
      const inlineRegex = /\(\s*(\d+)\s*:\s*(\d+(?:\s*-\s*\d+)?)\s*\)/g;
      
      // Find all inline references to determine the range
      let match;
      while ((match = inlineRegex.exec(t)) !== null) {
        inlineRefs.push({ surah: parseInt(match[1], 10), ayah: match[2].trim() });
      }

      let finalAyahs = lastAyahNumStr;
      
      // لو كان فيه آيات متعددة
      if (inlineRefs.length > 0) {
        // نأخذ أول آية لتشكيل النطاق (Range)
        const firstRef = inlineRefs[0];
        if (firstRef.surah === lastSurahNum) {
          const firstAyahBase = firstRef.ayah.split('-')[0].trim();
          const lastAyahEnd = lastAyahNumStr.includes('-') ? lastAyahNumStr.split('-')[1].trim() : lastAyahNumStr;
          
          if (firstAyahBase !== lastAyahEnd) {
            finalAyahs = `${firstAyahBase}-${lastAyahEnd}`;
          }
        }
      }
      
      // نستبدل جميع الأرقام في السطر الأصلي ليظهر كل الآيات بروابطها التي تشير للنطاق الكامل
      let processedVerseText = t.replace(inlineRegex, (m, sNum, aNum) => {
        return `<a href="https://quran.com/${sNum}/${finalAyahs}" class="inline-verse-ref" style="text-decoration: none; opacity: 0.8;" target="_blank" rel="noopener noreferrer">(${aNum.trim()})</a>`;
      });
      
      const refHtml = `<a class="verse-ref" href="https://quran.com/${lastSurahNum}/${finalAyahs}" target="_blank" rel="noopener noreferrer">[سورة ${surahName}: ${finalAyahs}]</a>`;
      
      htmlChunks.push(`<div class="quran-verse" style="color: var(--primary-color);">\n  ${processedVerseText}\n  ${refHtml}\n</div>`);
      continue;
    }

    // إضافة الكلمات المميزة كـ Code Tags للفقرات العادية
    let processedText = t.replace(/"([^"\s]{1,20})"/g, '<code>"$1"</code>');
    
    htmlChunks.push(`<p>${processedText}</p>`);
  }

  return htmlChunks.join('\n\n');
}
