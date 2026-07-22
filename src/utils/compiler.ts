export const surahs = ["الفاتحة","البقرة","آل عمران","النساء","المائدة","الأنعام","الأعراف","الأنفال","التوبة","يونس","هود","يوسف","الرعد","إبراهيم","الحجر","النحل","الإسراء","الكهف","مريم","طه","الأنبياء","الحج","المؤمنون","النور","الفرقان","الشعراء","النمل","القصص","العنكبوت","الروم","لقمان","السجدة","الأحزاب","سبأ","فاطر","يس","الصافات","ص","الزمر","غافر","فصلت","الشورى","الزخرف","الدخان","الجاثية","الأحقاف","محمد","الفتح","الحجرات","ق","الذاريات","الطور","النجم","القمر","الرحمن","الواقعة","الحديد","المجادلة","الحشر","الممتحنة","الصف","الجمعة","المنافقون","التغابن","الطلاق","التحريم","الملك","القلم","الحاقة","المعارج","نوح","الجن","المزمل","المدثر","القيامة","الإنسان","المرسلات","النبأ","النازعات","عبس","التكوير","الانفطار","المطففين","الانشقاق","البروج","الطارق","الأعلى","الغاشية","الفجر","البلد","الشمس","الليل","الضحى","الشرح","التين","العلق","القدر","البينة","الزلزلة","العاديات","القارعة","التكاثر","العصر","الهمزة","الفيل","قريش","الماعون","الكوثر","الكافرون","النصر","المسد","الإخلاص","الفلق","الناس"];

export function compileTextToHtml(text: string): string {
  let htmlChunks: string[] = [];
  const lines = text.split('\n');

  for (let i = 0; i < lines.length; i++) {
    let t = lines[i].trim();
    if (!t) continue;

    // 1. Headings
    if (t.startsWith('[Heading:') && t.endsWith(']')) {
      let hText = t.replace(/^\[Heading:\s*/, '').replace(/\]$/, '');
      htmlChunks.push(`<h2>${hText}</h2>`);
      continue;
    }
    
    // 2. Opinion Boxes
    const opinionMatch = t.match(/^(رأينا:|افتراء من عند أنفسنا:|تخيلات من عند أنفسنا:|موقفنا:|رأينا المفترى:)(.*)/);
    if (opinionMatch) {
      htmlChunks.push(`<div class="opinion-box"><strong>${opinionMatch[1]}</strong>${opinionMatch[2]}</div>`);
      continue;
    }

    // 3. Summaries
    const summaryMatch = t.match(/^(خلاصة|خلاصة القول|نتائج مفتراة|الخلاصة):?(.*)/);
    if (summaryMatch) {
      htmlChunks.push(`<div class="post-summary"><strong>الخلاصة:</strong>${summaryMatch[2]}</div>`);
      continue;
    }

    // 4. Quranic Verses (Matches lines starting and ending with quotes followed by surah info)
    const verseMatch = t.match(/^"([^"]+)"\s+([ء-ي\s]+?)\s+(\d+(?:-\d+)?)$/);
    if (verseMatch) {
      const verseText = verseMatch[1];
      const surahName = verseMatch[2].trim();
      const ayahNum = verseMatch[3];
      
      let surahNum = surahs.indexOf(surahName) + 1;
      if (surahNum === 0 && surahName.startsWith("سورة ")) {
         surahNum = surahs.indexOf(surahName.replace("سورة ", "")) + 1;
      }
      
      let refHtml = "";
      if (surahNum > 0) {
        // extract the first number from ranges like 19-20 for the link
        const baseAyahNum = ayahNum.split('-')[0];
        refHtml = `<a class="verse-ref" href="https://quran.com/${surahNum}/${baseAyahNum}" target="_blank">[سورة ${surahName}: ${ayahNum}]</a>`;
      } else {
        refHtml = `<span class="verse-ref">[سورة ${surahName}: ${ayahNum}]</span>`;
      }

      htmlChunks.push(`<div class="quran-verse">\n  "${verseText}"\n  ${refHtml}\n</div>`);
      continue;
    }
    
    // Images
    if (t.includes('[Image]') || t.includes('[صورة]')) {
       htmlChunks.push(`<div class="image-placeholder">مخطط توضيحي أو صورة</div>`);
       continue;
    }

    // 5. Paragraphs with inline Code words
    let pText = t.replace(/"([^"\s]{1,20})"/g, '<code>"$1"</code>');
    
    htmlChunks.push(`<p>${pText}</p>`);
  }

  return htmlChunks.join('\n\n');
}
