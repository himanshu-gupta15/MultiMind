import { ExternalLink, Check, Copy, X, Download, Code2 } from 'lucide-react'
import React from 'react'
import { useState } from 'react'
import Markdown from 'react-markdown'
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { useDispatch } from 'react-redux';
import { setArtifacts } from '../redux/messageSlice';
import { setArtifactOpen, setMobileArtifactOpen } from '../redux/uiSlice';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

function MessageBubble({role,content,images = [],artifacts}) {
 const isUser=role==="user"
 const dispatch=useDispatch()
 const [lightBox,setLightBox]=useState(null)
 const[copiedCode,setCopiedCode]=useState("")

 const copyCode=async(code)=>{
    await navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(()=>{
        setCopiedCode("")
    },2000)
 }

 const handleDownload = (e, href, customName) => {
    e.preventDefault();
    e.stopPropagation();
    if (!href) return;

    let defaultName = customName || "document";
    if (href.includes("presentationml") || href.includes(".pptx")) {
        defaultName = defaultName.endsWith(".pptx") ? defaultName : `${defaultName}.pptx`;
        if (defaultName === "document.pptx") defaultName = "Presentation.pptx";
    } else if (href.includes("pdf") || href.includes(".pdf")) {
        defaultName = defaultName.endsWith(".pdf") ? defaultName : `${defaultName}.pdf`;
        if (defaultName === "document.pdf") defaultName = "Document.pdf";
    }

    if (href.startsWith("data:")) {
        try {
            const arr = href.split(',');
            const mimeMatch = arr[0].match(/:(.*?);/);
            const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
            const base64Data = arr[1] || "";
            const bstr = atob(base64Data);
            let n = bstr.length;
            const u8arr = new Uint8Array(n);
            while (n--) {
                u8arr[n] = bstr.charCodeAt(n);
            }
            const blob = new Blob([u8arr], { type: mime });
            const blobUrl = URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = defaultName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            setTimeout(() => URL.revokeObjectURL(blobUrl), 3000);
        } catch (err) {
            console.error("Failed to download blob:", err);
        }
    } else {
        const link = document.createElement('a');
        link.href = href;
        link.download = defaultName;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
 };
  const openPreview = () => {
    dispatch(setArtifacts(artifacts));
    dispatch(setArtifactOpen(true));
    dispatch(setMobileArtifactOpen(true));
  };

  const markdownComponents = {
    h1: ({ children }) => <h1 className='font-display text-2xl leading-tight mt-2 mb-1'>{children}</h1>,
    h2: ({ children }) => <h2 className='font-display text-xl leading-tight mt-2 mb-1'>{children}</h2>,
    h3: ({ children }) => <h3 className='font-display text-lg leading-tight mt-1'>{children}</h3>,
    p: ({ children }) => <p className='m-0 text-[15px] leading-[1.65] whitespace-pre-wrap break-words text-pretty'>{children}</p>,
    ul: ({ children }) => <ul className='m-0 pl-5 list-disc flex flex-col gap-1.5'>{children}</ul>,
    ol: ({ children }) => <ol className='m-0 pl-5 list-decimal flex flex-col gap-1.5'>{children}</ol>,
    blockquote: ({ children }) => <blockquote className='m-0 pl-4 border-l-2 border-clay-400 text-sand-800'>{children}</blockquote>,
    table: ({ children }) => (
      <div className='overflow-x-auto'>
        <table className='min-w-full border-collapse text-sm'>{children}</table>
      </div>
    ),
    th: ({ children }) => <th className='px-2 py-2 text-left text-[11px] uppercase tracking-[.08em] text-ink/60 border-b border-line'>{children}</th>,
    td: ({ children }) => <td className='px-2 py-2 border-b border-ink/8'>{children}</td>,
    a: ({ href, children }) => {
      const isDownloadable =
        href?.startsWith("data:") ||
        href?.includes("presentationml") ||
        href?.includes("pdf") ||
        href?.endsWith(".pptx") ||
        href?.endsWith(".pdf");

      if (isDownloadable) {
        const childText = typeof children === "string" ? children : (Array.isArray(children) ? children.join("") : "");
        return (
          <button
            type="button"
            onClick={(e) => handleDownload(e, href, childText)}
            className="inline-flex items-center gap-1.5 h-10 px-4 rounded-full border border-line text-[13px] font-semibold hover:bg-ink/7 cursor-pointer transition-colors"
          >
            <Download size={15} />
            <span>{children}</span>
          </button>
        );
      }
      return (
        <a
          href={href}
          target='_blank'
          rel="noreferrer"
          className='text-clay-700 hover:text-clay-800 underline underline-offset-3 inline-flex items-center gap-1'
        >
          {children}
          <ExternalLink size={13} />
        </a>
      );
    },
    pre: ({ children }) => <>{children}</>,
    code: ({ className, children }) => {
      const value = String(children).replace(/\n$/, "");
      if (!className && !value.includes("\n")) {
        return <code className='px-1.5 py-0.5 rounded-md bg-sand-200 text-clay-800 font-mono text-[13px]'>{value}</code>;
      }
      const language = className?.replace("language-", "") || "text";
      return (
        <div className='rounded-card bg-sand-900 overflow-hidden'>
          <div className='flex items-center justify-between py-2 pr-2.5 pl-4 bg-sand-100/6'>
            <span className='text-xs font-semibold uppercase tracking-[.06em] text-sand-400'>{language}</span>
            <button
              className='flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs text-sand-300 hover:bg-sand-100/12 cursor-pointer transition-colors'
              onClick={() => copyCode(value)}
            >
              {copiedCode === value ? <Check size={13} /> : <Copy size={13} />}
              {copiedCode === value ? "Copied" : "Copy"}
            </button>
          </div>
          <SyntaxHighlighter
            language={language}
            style={oneDark}
            wrapLongLines
            customStyle={{
              margin: 0,
              padding: "14px 16px 16px",
              background: "transparent",
              fontSize: "13px",
              lineHeight: 1.6
            }}
            codeTagProps={{ style: { fontFamily: "var(--font-mono)" } }}
          >
            {value}
          </SyntaxHighlighter>
        </div>
      );
    }
  };

  if (isUser) {
    return (
      <div className='flex justify-end'>
        <div className='max-w-[min(80%,560px)] px-4.5 py-3 rounded-[22px_22px_8px_22px] bg-clay-100 text-[15px] leading-relaxed whitespace-pre-wrap [overflow-wrap:anywhere]'>
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className='flex gap-3 items-start'>
      <div className='w-8 h-8 rounded-full bg-clay text-canvas grid place-items-center font-display text-base shrink-0'>M</div>
      <div className='flex-1 min-w-0 flex flex-col gap-3 pt-1'>
        {images.length > 0 && (
          <div className='flex flex-wrap gap-3'>
            {images.map((img, i) => (
              <img key={i} src={img} onClick={() => setLightBox(img)} loading='lazy' alt="" className='w-48 h-32 rounded-card object-cover cursor-zoom-in hover:opacity-90 transition-opacity' />
            ))}
          </div>
        )}
        <Markdown remarkPlugins={[remarkGfm]} urlTransform={(url) => url} components={markdownComponents}>
          {content}
        </Markdown>
        {artifacts?.length > 0 && (
          <button
            onClick={openPreview}
            className='w-full flex items-center gap-3 py-3 pl-3 pr-4.5 rounded-panel bg-surface text-left cursor-pointer hover:shadow-soft-md transition-shadow'
          >
            <span className='w-11 h-11 rounded-full grid place-items-center bg-sage-200 text-sage-800 shrink-0'>
              <Code2 size={18} />
            </span>
            <span className='flex-1 min-w-0 flex flex-col gap-0.5'>
              <span className='text-[15px] font-semibold truncate'>{artifacts[0]?.title || "Preview"}</span>
              <span className='text-[13px] text-sand-700 truncate'>{artifacts[0]?.files?.map(f => f.name).join(" · ")}</span>
            </span>
            <span className='text-[13px] font-semibold text-clay-700 shrink-0'>Open preview</span>
          </button>
        )}
      </div>
      {lightBox && (
        <div onClick={() => setLightBox(null)} className='fixed inset-0 z-90 bg-sand-900/80 backdrop-blur-sm flex items-center justify-center p-6'>
          <button className='absolute top-4 right-4 w-10 h-10 rounded-full grid place-items-center bg-sand-100 text-ink cursor-pointer' onClick={() => setLightBox(null)} title="Close">
            <X size={18} />
          </button>
          <img src={lightBox} alt='' className='max-w-full max-h-full rounded-card' />
        </div>
      )}
    </div>
  );
}

export default MessageBubble
