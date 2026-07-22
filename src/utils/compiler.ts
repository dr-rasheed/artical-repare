export const surahs = ["الفاتحة","البقرة","آل عمران","النساء","المائدة","الأنعام","الأعراف","الأنفال","التوبة","يونس","هود","يوسف","الرعد","إبراهيم","الحجر","النحل","الإسراء","الكهف","مريم","طه","الأنبياء","الحج","المؤمنون","النور","الفرقان","الشعراء","النمل","القصص","العنكبوت","الروم","لقمان","السجدة","الأحزاب","سبأ","فاطر","يس","الصافات","ص","الزمر","غافر","فصلت","الشورى","الزخرف","الدخان","الجاثية","الأحقاف","محمد","الفتح","الحجرات","ق","الذاريات","الطور","النجم","القمر","الرحمن","الواقعة","الحديد","المجادلة","الحشر","الممتحنة","الصف","الجمعة","المنافقون","التغابن","الطلاق","التحريم","الملك","القلم","الحاقة","المعارج","نوح","الجن","المزمل","المدثر","القيامة","الإنسان","المرسلات","النبأ","النازعات","عبس","التكوير","الانفطار","المطففين","الانشقاق","البروج","الطارق","الأعلى","الغاشية","الفجر","البلد","الشمس","الليل","الضحى","الشرح","التين","العلق","القدر","البينة","الزلزلة","العاديات","القارعة","التكاثر","العصر","الهمزة","الفيل","قريش","الماعون","الكوثر","الكافرون","النصر","المسد","الإخلاص","الفلق","الناس"];

export function compileTextToHtml(text: string): string {
  let htmlChunks: string[] = [];
  const lines = text.split('\n');

  // النمط الجديد والسريع لاكتشاف الآيات بناءً على طلب المستخدم
  // أي سطر كامل ينتهي بقوسين داخلهما (رقم:رقم) نعتبره آية
  const quranLineRegex = /^(.*?)\s*\(\s*(\d+)\s*:\s*(\d+(?:\s*-\s*\d+)?)\s*\)$/;

  let inQA = false;
  let inList = false;
  let inTable = false;
  let tableHasHeader = false;

  for (let i = 0; i < lines.length; i++) {
    let t = lines[i].trim();
    if (!t) continue;

    const isVerse = t.match(quranLineRegex);

    // إنهاء قسم الجواب (QA) في حال ظهور عناصر رئيسية جديدة
    if (inQA && (t.startsWith("باب ") || t.includes(" – الجزء ") || t.startsWith("السؤال:") || t.startsWith("نتيجة مفتراة") || t.startsWith("افتراء:") || t.startsWith("نتيجة:") || isVerse)) {
      htmlChunks.push(`  </div>\n</div>`);
      inQA = false;
    }

    // بناء الأسئلة (QA Block)
    if (t.startsWith("السؤال:")) {
      let processedText = t.replace(/"([^"\s]{1,20})"/g, '<code>"$1"</code>');
      htmlChunks.push(`<div class="qa-block">\n  <div class="qa-question">${processedText}</div>\n  <div class="qa-answer">`);
      inQA = true;
      continue;
    }

    let indent = inQA ? "    " : "";

    // العناوين (TOC Support & Markdown Headings)
    if (t.startsWith("باب ") || t.includes(" – الجزء ") || t.match(/^#+\s/)) {
      let hText = t.replace(/^#+\s*/, '');
      htmlChunks.push(`${indent}<h2>${hText}</h2>`);
      continue;
    }

    // 5. Quranic Verses
    if (isVerse) {
      const verseMatch = t.match(quranLineRegex)!;
      const lastSurahNum = parseInt(verseMatch[2], 10);
      const lastAyahNumStr = verseMatch[3].trim();
      
      const surahName = lastSurahNum <= surahs.length && lastSurahNum > 0 ? surahs[lastSurahNum - 1] : lastSurahNum.toString();
      
      const inlineRefs: {surah: number, ayah: string}[] = [];
      const inlineRegex = /\(\s*(\d+)\s*:\s*(\d+(?:\s*-\s*\d+)?)\s*\)/g;
      
      let match;
      while ((match = inlineRegex.exec(t)) !== null) {
        inlineRefs.push({ surah: parseInt(match[1], 10), ayah: match[2].trim() });
      }

      let finalAyahs = lastAyahNumStr;
      
      if (inlineRefs.length > 0) {
        const firstRef = inlineRefs[0];
        if (firstRef.surah === lastSurahNum) {
          const firstAyahBase = firstRef.ayah.split('-')[0].trim();
          const lastAyahEnd = lastAyahNumStr.includes('-') ? lastAyahNumStr.split('-')[1].trim() : lastAyahNumStr;
          
          if (firstAyahBase !== lastAyahEnd) {
            finalAyahs = `${firstAyahBase}-${lastAyahEnd}`;
          }
        }
      }
      
      let processedVerseText = t.replace(inlineRegex, (m, sNum, aNum) => {
        return `<a href="https://quran.com/${sNum}/${finalAyahs}" class="inline-verse-ref" target="_blank" rel="noopener noreferrer">(${aNum.trim()})</a>`;
      });
      
      const refHtml = `<a class="verse-ref" href="https://quran.com/${lastSurahNum}/${finalAyahs}" target="_blank" rel="noopener noreferrer">[سورة ${surahName}: ${finalAyahs}]</a>`;
      
      htmlChunks.push(`${indent}<div class="quran-verse">\n${indent}  ${processedVerseText}\n${indent}  ${refHtml}\n${indent}</div>`);
      continue;
    }

    // الاستشهادات والمراجع (Citation Box)
    const citationMatch = t.match(/^(?:استشهاد|اقتباس|مرجع|المصدر)\s*[:\-]\s*(.*)/);
    if (citationMatch) {
      let content = citationMatch[1];
      let source = "اقتباس";
      const sourceMatch = content.match(/^(?:\[(.*?)\]|\((.*?)\)|"([^"]+)")\s*(.*)/);
      if (sourceMatch) {
         source = sourceMatch[1] || sourceMatch[2] || sourceMatch[3];
         content = sourceMatch[4];
      }
      let processedText = content.replace(/"([^"\s]{1,20})"/g, '<code>"$1"</code>');
      htmlChunks.push(`${indent}<div class="citation-box">\n${indent}  <div class="citation-header"><span>${source}</span></div>\n${indent}  <div class="citation-text">${processedText}</div>\n${indent}</div>`);
      continue;
    }

    // الخلاصة (Post Summary)
    if (t.startsWith("نتيجة مفتراة") || t.startsWith("افتراء:") || t.startsWith("نتيجة:") || t.startsWith("الخلاصة:") || t.startsWith("خلاصة:")) {
      let processedText = t.replace(/"([^"\s]{1,20})"/g, '<code>"$1"</code>');
      processedText = processedText.replace(/^(.*?)(:)/, '<strong>$1$2</strong>');
      htmlChunks.push(`${indent}<div class="post-summary">\n${indent}  ${processedText}\n${indent}</div>`);
      continue;
    }

    // صندوق الرأي (Opinion Box)
    if (t.startsWith("رأينا المفترى:") || t.startsWith("جواب مفترى:") || t.startsWith("تخيلات") || t.startsWith("رأينا:") || t.startsWith("ملاحظة:")) {
      let processedText = t.replace(/"([^"\s]{1,20})"/g, '<code>"$1"</code>');
      processedText = processedText.replace(/^(.*?)(:)/, '<strong>$1$2</strong>');
      htmlChunks.push(`${indent}<div class="opinion-box">\n${indent}  ${processedText}\n${indent}</div>`);
      continue;
    }

    // الجداول (Tables)
    if (t.startsWith("|") && t.endsWith("|")) {
      if (!inTable) {
        htmlChunks.push(`${indent}<table>`);
        inTable = true;
      }
      
      if (t.match(/^\|(?:-+|:-+:|:-+|-+:)(?:\|(?:-+|:-+:|:-+|-+:))*\|$/)) {
         continue; 
      }

      let cells = t.split("|").slice(1, -1).map(c => c.trim());
      let rowHtml = `${indent}  <tr>\n`;
      let cellTag = tableHasHeader ? "td" : "th";
      for (let cell of cells) {
         let processedCell = cell.replace(/"([^"\s]{1,20})"/g, '<code>"$1"</code>');
         rowHtml += `${indent}    <${cellTag}>${processedCell}</${cellTag}>\n`;
      }
      rowHtml += `${indent}  </tr>`;
      htmlChunks.push(rowHtml);
      tableHasHeader = true; 
      continue;
    } else if (inTable) {
      htmlChunks.push(`${indent}</table>`);
      inTable = false;
      tableHasHeader = false;
    }

    // القوائم (Lists)
    if (t.startsWith("* ")) {
      if (!inList) { htmlChunks.push(`${indent}<ul>`); inList = true; }
      let processedText = t.substring(2).trim().replace(/"([^"\s]{1,20})"/g, '<code>"$1"</code>');
      htmlChunks.push(`${indent}  <li>${processedText}</li>`);
      
      // التمرير للسطر التالي للتحقق من انتهاء القائمة متجاهلاً الأسطر الفارغة
      let nextLineIsList = false;
      for (let j = i + 1; j < lines.length; j++) {
        let nextT = lines[j].trim();
        if (nextT) {
          nextLineIsList = nextT.startsWith("* ");
          break;
        }
      }
      
      if (!nextLineIsList) {
        htmlChunks.push(`${indent}</ul>`);
        inList = false;
      }
      continue;
    }

    // الفقرات العادية (Paragraphs)
    let processedText = t.replace(/"([^"\s]{1,20})"/g, '<code>"$1"</code>');
    htmlChunks.push(`${indent}<p>${processedText}</p>`);
  }

  // إغلاق أي وسوم مفتوحة في نهاية النص
  if (inTable) {
    htmlChunks.push(`</table>`);
  }
  if (inQA) {
    htmlChunks.push(`  </div>\n</div>`);
  }

  return htmlChunks.join('\n\n');
}
