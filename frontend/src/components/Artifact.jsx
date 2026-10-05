import { 
  Code2, 
  Copy, 
  Eye, 
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
import { useDispatch, useSelector } from 'react-redux';
import { setArtifactOpen, setMobileArtifactOpen } from '../redux/uiSlice';
import Editor from '@monaco-editor/react';
import { motion, AnimatePresence } from 'motion/react';

function Artifact() {
  const dispatch = useDispatch();
  const { artifactOpen, mobileArtifactOpen } = useSelector(state => state.ui);
  const [isExpanded, setIsExpanded] = useState(false);
  const { artifacts } = useSelector(state => state.message);
  const [tab, setTab] = useState("preview");
  const [activeFile, setActiveFile] = useState(0);
  const [copied, setCopiedCode] = useState(false);
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

  const defineTheme = (monaco) => {
    monaco.editor.defineTheme('organic', {
      base: 'vs-dark',
      inherit: true,
      rules: [],
      colors: { 'editor.background': '#2e2b25', 'editor.lineHighlightBackground': '#2e2b25' }
    });
  };

  const iconBtn = 'w-8 h-8 rounded-full grid place-items-center text-sand-700 hover:bg-sand-200 cursor-pointer shrink-0 transition-colors';
  const textBtn = 'h-8 px-3 flex items-center gap-1.5 rounded-full text-xs font-semibold text-sand-800 hover:bg-sand-200 cursor-pointer shrink-0 transition-colors';
  const viewports = [
    { id: "desktop", icon: Monitor, label: "Desktop" },
    { id: "tablet", icon: Tablet, label: "Tablet" },
    { id: "mobile", icon: Smartphone, label: "Mobile" }
  ];
  const showPreview = tab === "preview" && canPreview;

  const renderPanel = (onClose, showExpand) => (
    <div className='h-full flex flex-col rounded-panel bg-sand-100 shadow-soft-md overflow-hidden'>
      <div className='flex items-center flex-wrap gap-2 py-3 pr-3 pl-4'>
        <span className='w-8 h-8 rounded-full grid place-items-center bg-sage-200 text-sage-800 shrink-0'>
          <Code2 size={15} />
        </span>
        <div className='flex-1 min-w-30 font-display text-[17px] truncate'>
          {artifacts[0]?.title || "Preview"}
        </div>
        {canPreview && (
          <div className='inline-flex overflow-hidden rounded-full border border-line bg-canvas'>
            {[{ id: "preview", icon: Eye, label: "Preview" }, { id: "code", icon: Code2, label: "Code" }].map(({ id, icon: Icon, label }, i) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`flex items-center gap-1.5 px-3 py-1.75 text-[13px] font-semibold cursor-pointer transition-colors ${i ? "border-l border-line" : ""} ${tab === id ? "bg-clay text-canvas" : "hover:bg-ink/7"}`}
              >
                <Icon size={13} />{label}
              </button>
            ))}
          </div>
        )}
        {showExpand && (
          <button className={iconBtn} onClick={() => setIsExpanded(!isExpanded)} title={isExpanded ? "Narrow panel" : "Widen panel"}>
            {isExpanded ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </button>
        )}
        <button className={iconBtn} onClick={onClose} title="Close preview">
          <X size={17} />
        </button>
      </div>

      <div className='flex items-center justify-between gap-2 pr-3 pb-3 pl-4'>
        {showPreview ? (
          <>
            <div className='flex gap-0.5 p-0.75 rounded-full bg-sand-200'>
              {viewports.map(({ id, icon: Icon, label }) => (
                <button
                  key={id}
                  title={label}
                  onClick={() => setViewportMode(id)}
                  className={`w-8 h-7 rounded-full grid place-items-center cursor-pointer transition-colors ${viewportMode === id ? "bg-sand-100 text-ink shadow-soft-sm" : "text-sand-700"}`}
                >
                  <Icon size={14} />
                </button>
              ))}
            </div>
            <div className='flex gap-0.5'>
              <button className={iconBtn} onClick={() => setRefreshKey(k => k + 1)} title="Reload preview">
                <RotateCw size={14} />
              </button>
              <button className={textBtn} onClick={handleOpenInNewTab}>
                <ExternalLink size={13} />
                Open in new tab
              </button>
            </div>
          </>
        ) : (
          <>
            <div className='flex gap-0.5 overflow-x-auto no-scrollbar'>
              {artifacts[0]?.files?.map((f, index) => (
                <button
                  key={index}
                  onClick={() => setActiveFile(index)}
                  className={`h-7.5 px-3 rounded-full font-mono text-xs whitespace-nowrap cursor-pointer transition-colors hover:bg-sand-200 ${activeFile === index ? "bg-sand-300 text-ink" : "text-sand-700"}`}
                >
                  {f?.name}
                </button>
              ))}
            </div>
            <button className={textBtn} onClick={handleCopy}>
              {copied ? <Check size={13} /> : <Copy size={13} />}
              {copied ? "Copied" : "Copy"}
            </button>
          </>
        )}
      </div>

      <div className='flex-1 min-h-0 mx-3 mb-3 rounded-card overflow-hidden bg-sand-200'>
        {showPreview ? (
          <div className='h-full flex justify-center p-2'>
            <iframe
              key={refreshKey}
              title='Artifact preview'
              srcDoc={previewDoc}
              sandbox='allow-scripts allow-modals allow-forms allow-same-origin allow-popups'
              className='h-full max-w-full border-none rounded-xl bg-white shadow-soft-sm transition-[width] duration-250'
              style={{ width: getViewportWidth() }}
            />
          </div>
        ) : (
          <Editor
            theme='organic'
            beforeMount={defineTheme}
            language={detectLanguage(file?.name)}
            value={file?.content || ""}
            options={{
              readOnly: true,
              minimap: { enabled: false },
              fontSize: 12.5,
              wordWrap: "on",
              automaticLayout: true,
              scrollBeyondLastLine: false,
              padding: { top: 16, bottom: 16 },
              lineNumbers: "on",
              renderLineHighlight: "none"
            }}
          />
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileArtifactOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => dispatch(setMobileArtifactOpen(false))}
              className="lg:hidden fixed inset-0 z-44 bg-scrim/35"
            />
            <motion.section
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="lg:hidden fixed inset-y-0 right-0 z-45 w-full max-w-125 p-2"
            >
              {renderPanel(() => dispatch(setMobileArtifactOpen(false)), false)}
            </motion.section>
          </>
        )}
      </AnimatePresence>

      {/* Desktop panel */}
      {artifactOpen && (
        <motion.section
          initial={false}
          animate={{ width: isExpanded ? 780 : 520 }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
          className='hidden lg:block h-full shrink-0 py-3 pr-3'
        >
          {renderPanel(() => dispatch(setArtifactOpen(false)), true)}
        </motion.section>
      )}
    </>
  );
}

export default Artifact;
