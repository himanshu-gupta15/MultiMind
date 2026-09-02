import { 
  Code2, 
  Copy, 
  Eye, 
  PanelRightClose, 
  Check, 
  X, 
  RotateCw, 
  ExternalLink, 
  Maximize2, 
  Minimize2, 
  Monitor, 
  Tablet, 
  Smartphone 
} from 'lucide-react';
import React, { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import Editor from '@monaco-editor/react';
import { motion, AnimatePresence } from 'motion/react';

function Artifact() {
  const [collapsed, setCollapsed] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const { artifacts } = useSelector(state => state.message);
  const [tab, setTab] = useState("preview");
  const [activeFile, setActiveFile] = useState(0);
  const [copied, setCopiedCode] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [viewportMode, setViewportMode] = useState("desktop"); // 'desktop' | 'tablet' | 'mobile'
  const [refreshKey, setRefreshKey] = useState(0);

  const file = artifacts?.[0]?.files?.[activeFile];
  const htmlfile = artifacts?.[0]?.files?.find(f => f.name === "index.html" || f.name?.endsWith(".html"));
  const cssfile = artifacts?.[0]?.files?.find(f => f.name === "style.css" || f.name?.endsWith(".css"));
  const jsfile = artifacts?.[0]?.files?.find(f => f.name === "script.js" || f.name?.endsWith(".js"));
  const canPreview = Boolean(htmlfile);

  const previewDoc = useMemo(() => {
    const rawHtml = htmlfile?.content || "";
    const rawCss = cssfile?.content || "";
    const rawJs = jsfile?.content || "";

    const styleTag = rawCss ? `<style>\n${rawCss}\n</style>` : "";
    const scriptTag = rawJs ? `<script>\n${rawJs}\n</script>` : "";

    // If html content already contains a full HTML document structure
    if (/<!DOCTYPE/i.test(rawHtml) || /<html/i.test(rawHtml)) {
      let doc = rawHtml;
      
      // Inject CSS into <head> or at top
      if (/<head[^>]*>/i.test(doc)) {
        doc = doc.replace(/<head[^>]*>/i, (m) => `${m}\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n${styleTag}`);
      } else if (/<html[^>]*>/i.test(doc)) {
        doc = doc.replace(/<html[^>]*>/i, (m) => `${m}\n<head><meta name="viewport" content="width=device-width, initial-scale=1.0">\n${styleTag}</head>`);
      } else {
        doc = `${styleTag}\n${doc}`;
      }

      // Inject JS before </body> or at bottom
      if (/<\/body>/i.test(doc)) {
        doc = doc.replace(/<\/body>/i, `${scriptTag}\n</body>`);
      } else {
        doc = `${doc}\n${scriptTag}`;
      }
      return doc;
    }

    // Otherwise, wrap snippet in a clean, modern HTML5 document
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      min-height: 100vh;
      background: #0f1117;
      color: #f1f5f9;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 16px;
    }
    ${rawCss}
  </style>
</head>
<body>
  ${rawHtml}
  ${scriptTag}
</body>
</html>`;
  }, [htmlfile?.content, cssfile?.content, jsfile?.content, refreshKey]);

  if (!artifacts || artifacts.length === 0) return null;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(file?.content || "");
    setCopiedCode(true);
    setTimeout(() => {
      setCopiedCode(false);
    }, 2000);
  };

  const handleOpenInNewTab = () => {
    const blob = new Blob([previewDoc], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  const detectLanguage = (fileName = "") => {
    const name = fileName.toLowerCase();
    if (name.endsWith(".html")) return "html";
    if (name.endsWith(".css")) return "css";
    if (name.endsWith(".js")) return "javascript";
    if (name.endsWith(".jsx")) return "javascript";
    if (name.endsWith(".ts")) return "typescript";
    if (name.endsWith(".tsx")) return "typescript";
    if (name.endsWith(".json")) return "json";
    if (name.endsWith(".py")) return "python";
    if (name.endsWith(".java")) return "java";
    if (name.endsWith(".cpp")) return "cpp";
    if (name.endsWith(".c")) return "c";
    return "plaintext";
  };

  const getViewportWidth = () => {
    switch (viewportMode) {
      case "mobile": return "375px";
      case "tablet": return "680px";
      default: return "100%";
    }
  };

  const PanelContent = ({ onClose }) => {
    return (
      <div className='flex flex-col h-full bg-[#0d0f14]'>
        {/* Main Header */}
        <div className='h-14 px-3.5 border-b border-white/[0.06] flex items-center justify-between gap-2 shrink-0 bg-[#0d0f14]'>
          <div className='flex items-center gap-2.5 min-w-0'>
            <button 
              className='flex items-center justify-center w-7 h-7 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/[0.06] transition-colors bg-transparent border-none cursor-pointer shrink-0'
              onClick={onClose || (() => setCollapsed(true))}
              title="Close panel"
            >
              {onClose ? <X size={15} /> : <PanelRightClose size={15} />}
            </button>
            <div className='flex items-center gap-2 min-w-0'>
              <Code2 className="text-indigo-400 shrink-0" size={14} />
              <span className='text-[13px] font-medium text-slate-200 truncate'>
                {artifacts[0]?.title || "Artifact Preview"}
              </span>
            </div>
          </div>

          <div className='flex items-center gap-1.5 shrink-0'>
            {canPreview && (
              <div className='flex items-center gap-1 bg-white/[0.04] border border-white/[0.06] p-0.5 rounded-lg'>
                <button 
                  onClick={() => setTab("preview")}
                  className={`flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors cursor-pointer border-none ${tab === "preview" ? "bg-indigo-600 text-white shadow-sm" : "bg-transparent text-slate-400 hover:text-slate-200"}`}
                >
                  <Eye size={12} />Preview
                </button>
                <button 
                  onClick={() => setTab("code")}
                  className={`flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors cursor-pointer border-none ${tab === "code" ? "bg-indigo-600 text-white shadow-sm" : "bg-transparent text-slate-400 hover:text-slate-200"}`}
                >
                  <Code2 size={12} />Code
                </button>
              </div>
            )}

            {!onClose && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className='hidden lg:flex items-center justify-center w-7 h-7 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/[0.06] transition-colors bg-transparent border-none cursor-pointer'
                title={isExpanded ? "Collapse width" : "Expand width"}
              >
                {isExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
              </button>
            )}
          </div>
        </div>

        {/* Sub-toolbar */}
        {tab === "code" ? (
          <div className='h-10 flex items-center justify-between border-b border-white/[0.06] px-2 bg-black/20 shrink-0'>
            <div className='flex items-center overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'>
              {artifacts[0]?.files?.map((f, index) => (
                <button
                  key={index}
                  onClick={() => setActiveFile(index)}
                  className={`px-3 py-1.5 text-[11.5px] font-medium whitespace-nowrap transition-colors border-none relative cursor-pointer rounded-md ${activeFile === index ? "bg-white/[0.08] text-indigo-400" : "bg-transparent text-slate-400 hover:text-slate-200"}`}
                >
                  {f?.name}
                </button>
              ))}
            </div>
            <button
              onClick={handleCopy}
              className='flex items-center gap-1 px-2 py-1 rounded-md text-[11px] text-slate-400 hover:text-slate-200 hover:bg-white/[0.06] transition-colors bg-transparent border-none cursor-pointer shrink-0'
              title="Copy code"
            >
              {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
              <span>{copied ? "Copied" : "Copy"}</span>
            </button>
          </div>
        ) : (
          <div className='h-10 flex items-center justify-between border-b border-white/[0.06] px-3 bg-black/20 shrink-0'>
            {/* Viewport switcher */}
            <div className='flex items-center gap-1 bg-white/[0.03] p-0.5 rounded-md border border-white/[0.05]'>
              <button
                onClick={() => setViewportMode("desktop")}
                className={`p-1 rounded text-slate-400 hover:text-slate-200 transition-colors border-none cursor-pointer ${viewportMode === "desktop" ? "bg-white/[0.1] text-white" : "bg-transparent"}`}
                title="Desktop View (100%)"
              >
                <Monitor size={12} />
              </button>
              <button
                onClick={() => setViewportMode("tablet")}
                className={`p-1 rounded text-slate-400 hover:text-slate-200 transition-colors border-none cursor-pointer ${viewportMode === "tablet" ? "bg-white/[0.1] text-white" : "bg-transparent"}`}
                title="Tablet View"
              >
                <Tablet size={12} />
              </button>
              <button
                onClick={() => setViewportMode("mobile")}
                className={`p-1 rounded text-slate-400 hover:text-slate-200 transition-colors border-none cursor-pointer ${viewportMode === "mobile" ? "bg-white/[0.1] text-white" : "bg-transparent"}`}
                title="Mobile View"
              >
                <Smartphone size={12} />
              </button>
            </div>

            <div className='flex items-center gap-1.5'>
              <button
                onClick={() => setRefreshKey(k => k + 1)}
                className='flex items-center justify-center w-6 h-6 rounded text-slate-400 hover:text-slate-200 hover:bg-white/[0.06] transition-colors bg-transparent border-none cursor-pointer'
                title="Refresh preview"
              >
                <RotateCw size={12} />
              </button>
              <button
                onClick={handleOpenInNewTab}
                className='flex items-center gap-1 px-2 py-1 rounded text-[11px] text-slate-400 hover:text-slate-200 hover:bg-white/[0.06] transition-colors bg-transparent border-none cursor-pointer'
                title="Open in new window"
              >
                <ExternalLink size={11} />
                <span>Popout</span>
              </button>
            </div>
          </div>
        )}

        {/* Body content */}
        <div className='flex-1 overflow-hidden relative bg-[#090b0e]'>
          {tab === "preview" && canPreview ? (
            <div className='w-full h-full flex items-center justify-center p-2 sm:p-3 overflow-auto bg-[#08090c]'>
              <div 
                className='h-full rounded-xl overflow-hidden shadow-2xl border border-white/[0.08] transition-all duration-300 flex flex-col bg-white'
                style={{ 
                  width: getViewportWidth(),
                  maxWidth: "100%"
                }}
              >
                <iframe 
                  key={refreshKey}
                  title='preview' 
                  srcDoc={previewDoc} 
                  sandbox='allow-scripts allow-modals allow-forms allow-same-origin allow-popups' 
                  className='w-full h-full bg-white border-none flex-1' 
                />
              </div>
            </div>
          ) : (
            <div className='w-full h-full'>
              <Editor
                theme='vs-dark'
                language={detectLanguage(file?.name)}
                value={file?.content || ""}
                options={{
                  readOnly: true,
                  minimap: { enabled: false },
                  fontSize: 13,
                  wordWrap: "on",
                  automaticLayout: true,
                  scrollBeyondLastLine: false,
                  padding: { top: 14, bottom: 14 },
                  lineNumbers: "on",
                  renderLineHighlight: "none"
                }}
              />
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Mobile button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed bottom-24 right-4 z-40 flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[12px] font-medium shadow-lg shadow-indigo-500/20 border-none cursor-pointer transition-colors duration-150"
      >
        <Eye size={13} />
        View App Preview
      </button>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              transition={{ duration: 0.2 }} 
              onClick={() => setMobileOpen(false)} 
              className="lg:hidden fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ x: "100%" }} 
              animate={{ x: 0 }} 
              exit={{ x: "100%" }} 
              transition={{ duration: 0.25, ease: "easeInOut" }} 
              className="lg:hidden fixed inset-y-0 right-0 z-50 w-[92vw] max-w-[500px] border-l border-white/[0.08] overflow-hidden shadow-2xl"
            >
              <PanelContent onClose={() => setMobileOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Panel */}
      {!collapsed ? (
        <motion.div
          animate={{ width: isExpanded ? 780 : 520 }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
          className='hidden lg:flex h-full border-l border-white/[0.06] flex-col overflow-hidden shrink-0'
        >
          <PanelContent />
        </motion.div>
      ) : (
        <div className='hidden lg:flex flex-col h-full bg-[#0d0f14] items-center py-4 gap-3 shrink-0 w-12 border-l border-white/[0.06]'>
          <button 
            className='flex items-center justify-center w-7 h-7 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/[0.065] transition-colors bg-transparent border-none cursor-pointer shrink-0' 
            onClick={() => setCollapsed(false)}
            title="Open Artifacts Panel"
          >
            <PanelRightClose size={16} className="transform rotate-180" />
          </button>
          <div className='flex items-center gap-2 flex-1 min-w-0'>
            <div 
              className='text-[11px] font-medium text-slate-500 tracking-wider uppercase whitespace-nowrap'
              style={{
                writingMode: "vertical-lr",
                transform: "rotate(180deg)"
              }}
            >
              {artifacts[0]?.title || "Artifact Preview"}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Artifact;