/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef } from 'react';
import { Loader2, Code2, Copy, FileText, LayoutTemplate, AlertCircle, Upload } from 'lucide-react';
import * as mammoth from 'mammoth';

export default function App() {
  const [inputText, setInputText] = useState('');
  const [outputHtml, setOutputHtml] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'code' | 'preview'>('code');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCompile = async () => {
    if (!inputText.trim()) {
      setError('الرجاء إدخال نص للترجمة.');
      return;
    }

    setIsLoading(true);
    setError('');
    setOutputHtml('');

    try {
      // Simulate slight delay for UX
      await new Promise(r => setTimeout(r, 400));
      
      const { compileTextToHtml } = await import('./utils/compiler');
      const resultHtml = compileTextToHtml(inputText);
      
      setOutputHtml(resultHtml);
      setActiveTab('code');
    } catch (err: any) {
      console.error(err);
      setError('حدث خطأ أثناء المعالجة.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(outputHtml);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.docx')) {
      setError('الرجاء رفع ملف بصيغة .docx فقط');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      if (result.value) {
        setInputText(result.value);
      } else {
        setError('تعذر استخراج النص من الملف.');
      }
    } catch (err: any) {
      console.error(err);
      setError('حدث خطأ أثناء قراءة الملف.');
    } finally {
      setIsLoading(false);
      // Reset input so the same file can be uploaded again if needed
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="h-screen w-screen bg-[#E5E2DB] p-4 md:p-8 flex items-center justify-center overflow-hidden font-sans" dir="rtl">
      <div className="app-container">
        <div className="header">
          <div className="brand">
            <span className="version-badge">v24.7</span>
            <h1 className="text-sm md:text-lg font-bold tracking-tight text-[var(--academic-ink)]">المترجم الأكاديمي للدكتور رشيد الجراح</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:block text-xs text-gray-400 font-medium tracking-wider" dir="ltr">PROJECT: ACADEMIC_HTML_COMPILER</div>
            <button
              onClick={handleCompile}
              disabled={isLoading || !inputText.trim()}
              className="btn-compile"
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span className="hidden sm:inline">جاري الترجمة...</span>
                </>
              ) : (
                <>
                  <Code2 size={16} />
                  <span className="hidden sm:inline">ترجمة إلى بلوجر</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="main-grid">
          
          {/* Input Column */}
          <div className="input-pane">
            <div className="pane-title">
              <div className="flex items-center gap-2">
                <span>نص المصدر (وورد)</span>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1 text-[var(--academic-ink)] hover:text-blue-600 transition-colors bg-white px-2 py-1 rounded border border-gray-200 shadow-sm"
                  title="رفع ملف وورد"
                >
                  <Upload size={14} />
                  <span>رفع ملف وورد</span>
                </button>
                <input 
                  type="file"
                  accept=".docx"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
              <span dir="ltr">UTF-8</span>
            </div>
            
            {error && (
              <div className="m-4 p-3 bg-red-50 text-red-700 rounded-sm border-r-4 border-red-500 flex items-start gap-2">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <p className="text-xs font-medium">{error}</p>
              </div>
            )}
            
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="قم بلصق النص هنا أو قم برفع ملف وورد (.docx)..."
              className="editor-content"
              dir="auto"
            />
          </div>

          {/* Output Column */}
          <div className="output-pane flex flex-col p-0 h-full">
            <div className="pane-title bg-white sticky top-0 z-20 shadow-sm border-b-0">
               <div className="flex items-center gap-6">
                  <button
                    onClick={() => setActiveTab('code')}
                    className={`flex items-center gap-1.5 transition-colors ${
                      activeTab === 'code' ? 'text-[var(--academic-ink)] font-bold' : 'hover:text-[var(--academic-ink)]'
                    }`}
                  >
                    <Code2 size={14} />
                    <span>مخرجات HTML</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('preview')}
                    className={`flex items-center gap-1.5 transition-colors ${
                      activeTab === 'preview' ? 'text-[var(--academic-ink)] font-bold' : 'hover:text-[var(--academic-ink)]'
                    }`}
                  >
                    <LayoutTemplate size={14} />
                    <span>معاينة</span>
                  </button>
               </div>
               
              {outputHtml && activeTab === 'code' && (
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 hover:text-blue-600 transition-colors"
                >
                  <Copy size={14} />
                  نسخ HTML
                </button>
              )}
            </div>
            
            <div className="flex-1 relative overflow-y-auto p-6 md:p-10">
              {!outputHtml && !isLoading ? (
                <div className="flex-1 h-full min-h-[400px] flex flex-col items-center justify-center text-[#999] text-center">
                  <Code2 size={48} className="mb-4 opacity-20" />
                  <p className="text-sm font-medium tracking-wide">ستظهر مخرجات HTML المترجمة هنا.</p>
                </div>
              ) : isLoading ? (
                <div className="flex-1 h-full min-h-[400px] flex flex-col items-center justify-center text-[var(--academic-ink)]">
                  <Loader2 size={32} className="animate-spin mb-4" />
                  <p className="font-medium text-xs tracking-widest uppercase animate-pulse">جاري الترجمة...</p>
                </div>
              ) : activeTab === 'code' ? (
                <textarea
                  readOnly
                  value={outputHtml}
                  className="w-full h-full min-h-[400px] font-mono text-[13px] text-[#444] resize-none focus:outline-none bg-transparent"
                  dir="ltr"
                />
              ) : (
                <div 
                  className="max-w-2xl mx-auto academic-output"
                  dir="auto"
                  dangerouslySetInnerHTML={{ __html: outputHtml }}
                />
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
