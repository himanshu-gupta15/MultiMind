import { ExternalLink, Check, Copy, X, Download } from 'lucide-react'
import React from 'react'
import { useState } from 'react'
import Markdown from 'react-markdown'
import remarkGfm from "remark-gfm";
import SyntaxHighlighter from 'react-syntax-highlighter';
import { docco } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

function MessageBubble({role,content,images = []}) {
 const isUser=role==="user"
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
  return (
    <div className={`flex ${isUser ? "justify-end":"justify-start"}`}>
        
        <div
  className={`w-fit max-w-[92vw] md:max-w-[72%]
    px-4 py-2.5 rounded-2xl
    break-words overflow-hidden
    leading-relaxed
    ${
      isUser
        ? "bg-gradient-to-br from-indigo-500 to-violet-700 text-white rounded-tr-sm"
        : "text-slate-200 rounded-tl-sm"
    }`}
>

     {images.length>0 && (
        <div className='flex flex-wrap gap-3 mt-4'>
            {images.map((img,i)=>(
                <img key={i} src={img} onClick={()=>setLightBox(img)} loading='lazy' className='w-40 h-28 rounded-xl object-cover border border-white/10 cursor-zoom-in hover:opacity-90 transition' />
            ))}
            </div>
     )}
            <Markdown 
            remarkPlugins={[remarkGfm]}
            urlTransform={(url) => url}
            components={{
                h1:({children})=>(
                    <h1 className='text-2xl font-bold mt-5 mb-3'>
                        {children}
                    </h1>
                ),
                h2:({children})=>(
                    <h2 className='text-xl font-semibold mt-4 mb-2'>
                        {children}
                    </h2>
                ),
                h3:({children})=>(
                    <h3 className='text-lg font-semibold mt-3 mb-2'>
                        {children}
                    </h3>
                ),
                p:({children})=>(
                    <p className='mb-3 whitespace-pre-wrap break-words'>
                        {children}
                    </p>
                ),
                ul:({children})=>(
                    <ul className='list-disc pl-5 space-y-1 my-2'>
                        {children}
                    </ul>
                ),
                ol:({children})=>(
                    <ol className='list-decimal pl-5 space-y-1 my-2'>
                        {children}
                    </ol>
                ),
                table:({children})=>(
                   <div className='overflow-x-auto my-4'>
                    <table className='min-w-full border border-white/10'>
                        {children}
                    </table>
                   </div>
                ),
                th:({children})=>(
                    <th className='border-white/10 bg-white/5 px-3 py-2 text-left'>
                        {children}
                    </th>
                ),
                td:({children})=>(
                    <td className='border-white/10 px-3 py-2 '>
                        {children}
                    </td>
                ),
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
                                className="inline-flex items-center gap-2 my-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-semibold shadow-md shadow-indigo-500/25 transition-all duration-150 border-none cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                            >
                                <Download size={14} />
                                <span>{children}</span>
                            </button>
                        );
                    }
                    return (
                        <a 
                            href={href} 
                            target='_blank' 
                            rel="noreferrer"
                            className='text-indigo-400 hover:text-indigo-300 underline inline-flex items-center gap-1 transition-colors'
                        >
                            {children}
                            <ExternalLink size={14} />
                        </a>
                    );
                },

                code:({className,children})=>{
                    const value=String(children).trim();
                    if(!className){
                        return (
                            <code className='px-1.5 py-0.5 rounded bg-white/10 text-indigo-200'>
                                {value}
                            </code>
                        )
                    }
                    const language=className?.replace("language-","")
                    return (
                        <div className='my-4 overflow-hidden rounded-xl border border-white/10 bg-[#111318]'>
                         <div className='flex items-center justify-between bg-[#1b1d24] border-b border-white/10 px-4 py-2'>
                             <span className='uppercase text-xs text-slate-400'>
                                {language} 
                             </span>
                             <button className='flex items-center gap-1 text-xs' onClick={()=>copyCode(value)}>
                                {
                                    copiedCode==value?
                                    <>
                                    <Check size={14}/>
                                    Copied
                                    </>:<>
                                    <Copy size={14}/>
                                    Copy
                                    </>
                                }
                             </button>
                         </div>
                         <SyntaxHighlighter language={language}
                         
                          style={oneDark}
                          wrapLongLines
                          showInlineLineNumbers 
                          customStyle={{
                            margin:0,
                            padding:"16px",
                            background:"#0d1117",
                            fontSize:"13px",
                          }}
                         >
                            {value}
                         </SyntaxHighlighter>
                        </div>
                    )  
                }
            }}
            >
                {content}
            </Markdown>
           
        </div>
     {lightBox && (
        <div className='fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6'>
            <button onClick={()=>setLightBox(null)}>
              <X/>
            </button>
            <img src={lightBox} alt='Lightbox' className='max-w-full max-h-full' />
        </div>
     )}

    </div>
  )
}

export default MessageBubble