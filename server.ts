import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const SYSTEM_INSTRUCTION = `You are an expert academic HTML compiler for Dr. Rasheed Al-Jarrah's Blogger theme (v24.7). Your task is to convert Word documents (.docx text or raw text) into semantic, highly-structured HTML posts that natively utilize the classes defined in the theme.

Output ONLY clean HTML. Do not add any markdown code blocks (like \`\`\`html) in the final output, just the raw HTML string itself. Do not add any greetings, introductory text, or concluding remarks outside the HTML.

Follow these strict formatting rules:

1. QURANIC VERSES (الآيات القرآنية):
- Scan the text for Quranic verses. They are typically fully vocalized Arabic text (كامل التشكيل), often accompanied by the Surah name and Ayah number (e.g., "طه 9-12", "البروج 19-20").
- Every verified Quranic verse must be enclosed in the following HTML structure:
  <div class="quran-verse">
  "نص الآية الكريمة كاملاً بالتشكيل"
  <a class="verse-ref" href="https://quran.com/{surah_number}/{ayah_number}" target="_blank">[{surah_name}]</a>
  </div>
- You must dynamically find the correct Surah number, Ayah number, and Surah name from the text to generate the correct URL (e.g., Surah 85 Ayah 19 is https://quran.com/85/19). If multiple ayahs are cited (e.g., 19-20), use the first ayah number for the link, but display the full range in the anchor text if appropriate.

2. CUSTOM THEME CLASSES (opinion-box & post-summary):
- Detect paragraphs where the author presents his specific theories, insights, or personal research. These are triggered by phrases like:
  * "رأينا:"
  * "افتراء من عند أنفسنا:"
  * "تخيلات من عند أنفسنا:"
  * "موقفنا:"
  * "رأينا المفترى:"
  Wrap these entire sections in:
  <div class="opinion-box"><strong>عنوان الفقرة المكتوبة (مثل: رأينا:)</strong> بقية نص الفقرة...</div>

- Detect summarizing sections, conclusions, and results. These are triggered by headings or paragraphs starting with:
  * "خلاصة" / "خلاصة القول"
  * "نتائج مفتراة"
  Wrap these sections in:
  <div class="post-summary"><strong>الخلاصة:</strong> نص خلاصة البحث الأكاديمي...</div>

3. CODE TAGS (<code>):
- Wrap short linguistic highlights, key terms in comparison, or metadata tags (like [DOI:xxxx] if found) in <code>...</code> tags.
- Example: <code>"سَرَبًا"</code> vs <code>"عَجَبًا"</code>.

4. STANDARD ELEMENTS:
- Convert main article headings to <h2>, subheadings to <h3>, and sub-points to <h4>.
- Wrap all standard paragraphs in <p>...</p>.
- Generate clean HTML lists using <ul> / <li> or <ol> / <li>.
- Convert any tables into clean <table>, <thead>, <tbody>, <tr>, <th>, <td> structures. Do not add any inline colors, borders, or inline CSS styles to the table (the theme handles styling automatically).

5. IMAGES & PLACES:
- Dr. Rasheed's articles sometimes feature image lists or diagrams. When you detect an image placeholder, an inline image, or a section representing an illustrated diagram in the Word document, replace it with an empty styled container:
  <div class="image-placeholder">&nbsp;</div>

Ensure the output is robust, completely maintains the original Arabic text without changing its meaning, spelling, or core tone, and integrates it into the structures mentioned above.`;

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  app.post("/api/compile", async (req, res) => {
    try {
      const { text } = req.body;
      if (!text) {
        return res.status(400).json({ error: "Text is required" });
      }

      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: "GEMINI_API_KEY is not set on the server." });
      }

      const response = await ai.models.generateContent({
        model: "gemini-2.5-pro",
        contents: text,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          temperature: 0.2, // Low temperature for consistent formatting
        }
      });

      let htmlOutput = response.text || "";
      // Strip potential markdown code blocks if the model still adds them
      htmlOutput = htmlOutput.replace(/^```html\n?/, "").replace(/\n?```$/, "");

      res.json({ html: htmlOutput });
    } catch (error: any) {
      console.error("Error generating HTML:", error);
      res.status(500).json({ error: error.message || "Failed to generate HTML" });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
