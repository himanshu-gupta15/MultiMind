import React from 'react'
import { Coins, LogOut, Menu, MessageSquare, PanelLeftIcon, PanelRight, PenSquare, Plus, X, User, MoreVertical, Pin, PinOff, Trash2 } from "lucide-react"
import { useDispatch, useSelector } from 'react-redux'
import { getConversation } from '../features/getConveration'
import { setConversations, setSelectedConversation, removeConversation, updatePinState } from '../redux/conversationSlice'
import { createConversation } from '../features/createConversation'
import { deleteConversation as deleteConvApi } from '../features/deleteConversation'
import { togglePinConversation as togglePinApi } from '../features/togglePinConversation'
import logOut from '../features/logOut'
import BillingDraw from './BillingDraw'
import { useState, useEffect, useRef } from 'react'
import { setUserdata } from '../redux/userSlice.js'

function Sidebar() {
    const [collapsed, setCollapsed] = useState(false)
    const dispatch = useDispatch()
    const [imageError, setImageError] = useState(false)
    const { conversations, selectedConversation } = useSelector((state) => state.conversation)
    const { userData } = useSelector(state => state.user)
    const [showBilling, setShowBilling] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [openMenuId, setOpenMenuId] = useState(null);
    const menuRef = useRef(null);

    const userId = userData?._id || userData?.userId;

    const syncConversations = async (preserveConversationId = null) => {
        if (!userId) return;
        const data = await getConversation();
        if (data && Array.isArray(data)) {
            dispatch(setConversations(data));

            if (preserveConversationId) {
                const updatedSelected = data.find(c => c._id === preserveConversationId) || null;
                dispatch(setSelectedConversation(updatedSelected));
                if (updatedSelected?._id) {
                    localStorage.setItem("active_chat_id", updatedSelected._id);
                } else {
                    localStorage.removeItem("active_chat_id");
                    window.history.replaceState({}, "", window.location.pathname);
                }
            }
        }
    };

    useEffect(() => {
        const getConv = async () => {
            if (!userId) return;
            const data = await getConversation();
            if (data && Array.isArray(data)) {
                dispatch(setConversations(data));

                // Chat Persistence on Reload: Check URL params or localStorage
                const urlParams = new URLSearchParams(window.location.search);
                const activeChatId = urlParams.get("c") || localStorage.getItem("active_chat_id");

                if (activeChatId) {
                    const matched = data.find(c => c._id === activeChatId);
                    if (matched) {
                        dispatch(setSelectedConversation(matched));
                        localStorage.setItem("active_chat_id", matched._id);
                        if (!urlParams.get("c")) {
                            const newUrl = `${window.location.pathname}?c=${matched._id}`;
                            window.history.replaceState({ id: matched._id }, "", newUrl);
                        }
                    } else {
                        localStorage.removeItem("active_chat_id");
                        window.history.replaceState({}, "", window.location.pathname);
                        dispatch(setSelectedConversation(null));
                    }
                }
            }
        };
        getConv();
    }, [userId]);

    // Handle browser Back / Forward navigation
    useEffect(() => {
        const handlePopState = () => {
            const urlParams = new URLSearchParams(window.location.search);
            const chatId = urlParams.get("c");
            if (chatId) {
                const matched = conversations.find(c => c._id === chatId);
                if (matched) {
                    dispatch(setSelectedConversation(matched));
                    localStorage.setItem("active_chat_id", matched._id);
                }
            } else {
                dispatch(setSelectedConversation(null));
                localStorage.removeItem("active_chat_id");
            }
        };
        window.addEventListener("popstate", handlePopState);
        return () => window.removeEventListener("popstate", handlePopState);
    }, [conversations]);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setOpenMenuId(null);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelectConversation = (conv) => {
        dispatch(setSelectedConversation(conv));
        setMobileOpen(false);
        if (conv?._id) {
            localStorage.setItem("active_chat_id", conv._id);
            const newUrl = `${window.location.pathname}?c=${conv._id}`;
            window.history.pushState({ id: conv._id }, "", newUrl);
        } else {
            localStorage.removeItem("active_chat_id");
            window.history.pushState({}, "", window.location.pathname);
        }
    };

    const handleNewChat = () => {
        dispatch(setSelectedConversation(null));
        setMobileOpen(false);
        localStorage.removeItem("active_chat_id");
        window.history.pushState({}, "", window.location.pathname);
    };

    const handleTogglePin = async (e, conv) => {
        e.stopPropagation();
        setOpenMenuId(null);
        const newPinned = !conv.isPinned;
        dispatch(updatePinState({ conversationId: conv._id, isPinned: newPinned }));
        try {
            await togglePinApi(conv._id);
            await syncConversations(conv._id);
        } catch (error) {
            console.error("Failed to update pin state:", error);
            await syncConversations(conv._id);
        }
    };

    const handleDeleteConversation = async (e, convId) => {
        e.stopPropagation();
        setOpenMenuId(null);

        // If the currently open chat is deleted, automatically redirect to blank new chat state
        if (selectedConversation?._id === convId) {
            localStorage.removeItem("active_chat_id");
            dispatch(setSelectedConversation(null));
            window.history.pushState({}, "", window.location.pathname);
        }

        try {
            await deleteConvApi(convId);
            dispatch(removeConversation(convId));
            await syncConversations();
        } catch (error) {
            console.error("Failed to delete conversation:", error);
            await syncConversations();
        }
    };

    if (collapsed) {
        return (
            <div className='hidden lg:flex flex-col items-center w-14 h-screen bg-[#0d0f14] border-r border-white/6 py-4 gap-1 shrink-0'>
                <button className='flex items-center justify-center w-9 h-9 rounded-xl text-slate-500 hover:text-slate-200 hover:bg-white/5 transition-colors duration-150 bg-transparent border-none cursor-pointer mb-1' onClick={() => setCollapsed(false)}>
                    <PanelRight />
                </button>

                <button className='flex items-center justify-center w-9 h-9 rounded-xl text-slate-500 hover:text-slate-200 hover:bg-white/5 transition-colors duration-150 bg-transparent border-none cursor-pointer' onClick={handleNewChat}>
                    <Plus size={17} />
                </button>

                <div className='flex-1 overflow-y-auto px-2.5 pb-2 scrollbar-none [&::-webkit-scrollbar]:hidden pt-5'>
                    {conversations.map((conv, i) => {
                        const isActive = selectedConversation?._id == conv?._id
                        return (
                            <div
                                key={conv?._id || i}
                                onClick={() => handleSelectConversation(conv)}
                                className={`flex items-center gap-2.5 cursor-pointer mb-0.5 px-3 py-2.5 rounded-[10px] border transition-colors duration-150 relative group
                            ${isActive ? "bg-indigo-500/10 border-indigo-500/18" : "bg-transparent border-transparent"}`}
                            >
                                <div className={`flex items-center justify-center shrink-0 w-5 h-5 rounded-lg transition-colors duration-150 
                            ${isActive ? "bg-indigo-500/15 text-indigo-400" : "bg-white/5 text-slate-500"}
                                `}>
                                    {conv.isPinned ? <Pin size={11} className="text-indigo-400 fill-indigo-400/30" /> : <MessageSquare size={13} />}
                                </div>
                            </div>
                        )
                    })}
                </div>

                <div className='relative shrink-0'>
                    {
                        (userData?.avatar && !imageError)
                            ?
                            <img
                                className='w-9 h-9 rounded-[10px] object-cover border-2 border-indigo-500/25'
                                src={userData?.avatar} alt={"image"} onError={() => setImageError(true)} />
                            :
                            <div className='w-9 h-9 rounded-[10px] bg-white/6 flex items-center justify-center'>
                                <User size={15} className="text-slate-400" />
                            </div>
                    }
                </div>
            </div>
        )
    }

    return (
        <>
            <button className='lg:hidden fixed top-3.5 left-4 z-50 flex items-center justify-center w-8 h-8 rounded-lg bg-[#0d0f14] border border-white/6 text-slate-400 hover:text-slate-200 transition-colors duration-150 cursor-pointer' onClick={() => setMobileOpen(true)}>
                <Menu size={14} />
            </button>

            {mobileOpen && <div onClick={() => setMobileOpen(false)} className='lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm' />}
            <div className={`fixed lg:static inset-y-0 left-0 z-50
w-67.5 h-screen shrink-0
bg-[#0d0f14] border-r border-white/6
transition-transform duration-250
${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
            >
                <div className='flex flex-col h-full'>
                    <div className='flex items-center gap-2.5 px-4 py-3 border-b border-white/6'>
                        <div className='hidden lg:flex items-center justify-center w-7 h-7 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-white/5 transition-colors duration-150 bg-transparent border-none cursor-pointer' onClick={() => setCollapsed(true)}>
                            <PanelLeftIcon />
                        </div>
                        <button onClick={() => setMobileOpen(false)}
                            className="lg:hidden flex items-center justify-center w-7 h-7 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-white/5 transition-colors duration-150 bg-transparent border-none cursor-pointer"
                        >
                            <X />
                        </button>
                        <span className='text-[16px] font-semibold text-slate-100 tracking-tight flex-1'>
                            MultiMind
                        </span>
                        <span className='text-[10px] font-medium text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full tracking-wide'>
                            {userData?.plan || "free"}
                        </span>
                        <button className='flex items-center justify-center w-7 h-7 rounded-lg text-slate-500 border-none cursor-pointer' onClick={handleNewChat} >
                            <PenSquare size={14} />
                        </button>
                    </div>

                    <div className='px-4 py-3'>
                        <button className='w-full flex items-center justify-center gap-2 text-sm font-semibold text-white bg-linear-to-r from-indigo-500 via-purple-600 to-violet-700 rounded-xl py-2.5 shadow-md shadow-indigo-500/10 hover:shadow-indigo-500/20 active:scale-[0.98] transition-all duration-200 cursor-pointer hover:opacity-95'
                            onClick={handleNewChat}
                        >
                            <Plus size={14} />
                            New Chat
                        </button>
                    </div>

                    {conversations.length === 0 ? (
                        <div className='px-4 pt-5 pb-2 text-[11px] font-bold uppercase tracking-widest text-slate-500'>
                            No Recent Conversations
                        </div>
                    ) : (
                        <div className='flex-1 overflow-y-auto px-3.5 pb-2 scrollbar-none [&::-webkit-scrollbar]:hidden space-y-4 pt-1'>
                            {/* Pinned Conversations Section */}
                            {conversations.some(c => c.isPinned) && (
                                <div>
                                    <div className='px-1.5 pb-1.5 flex items-center justify-between text-[11px] font-bold uppercase tracking-widest text-indigo-400'>
                                        <div className='flex items-center gap-1.5'>
                                            <Pin size={11} className='fill-indigo-400/40 text-indigo-400' />
                                            <span>Pinned</span>
                                        </div>
                                        <span className='text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-1.5 py-0.5 rounded-full font-semibold leading-none'>
                                            {conversations.filter(c => c.isPinned).length}
                                        </span>
                                    </div>

                                    <div className='space-y-1'>
                                        {conversations.filter(c => c.isPinned).map((conv, i) => {
                                            const isActive = selectedConversation?._id == conv?._id;
                                            const isMenuOpen = openMenuId === conv?._id;

                                            return (
                                                <div
                                                    key={conv?._id || i}
                                                    onClick={() => handleSelectConversation(conv)}
                                                    className={`group relative flex items-center justify-between gap-2 cursor-pointer px-3.5 py-2.5 rounded-xl border transition-all duration-150 
                                                    ${isActive ? "bg-indigo-500/15 border-indigo-500/25 shadow-sm shadow-indigo-500/10" : "bg-white/2 border-white/4 hover:bg-white/5 hover:border-white/8"}`}
                                                >
                                                    <div className='flex items-center gap-2.5 min-w-0 flex-1'>
                                                        <div className={`flex items-center justify-center shrink-0 w-6 h-6 rounded-lg transition-colors duration-150 
                                                        ${isActive ? "bg-indigo-500/20 text-indigo-300" : "bg-indigo-500/10 text-indigo-400"}`}
                                                        >
                                                            <Pin size={12} className="fill-indigo-400/40" />
                                                        </div>
                                                        <span className={`text-[13px] font-medium truncate ${isActive ? "text-slate-100 font-semibold" : "text-slate-300 group-hover:text-white"}`}>
                                                            {conv?.title || "New Chat"}
                                                        </span>
                                                    </div>

                                                    {/* 3-dots Menu Trigger Button */}
                                                    <div className='relative shrink-0'>
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setOpenMenuId(isMenuOpen ? null : conv._id);
                                                            }}
                                                            className={`p-1 rounded-md text-slate-500 hover:text-slate-200 hover:bg-white/8 transition-colors border-none bg-transparent cursor-pointer ${isMenuOpen ? "opacity-100 bg-white/8 text-slate-200" : "opacity-0 group-hover:opacity-100"
                                                                }`}
                                                        >
                                                            <MoreVertical size={14} />
                                                        </button>

                                                        {/* Dropdown Menu */}
                                                        {isMenuOpen && (
                                                            <div
                                                                ref={menuRef}
                                                                onClick={(e) => e.stopPropagation()}
                                                                className="absolute right-0 top-7 z-50 w-36 bg-[#161821] border border-white/10 rounded-xl shadow-2xl py-1.5 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-100"
                                                            >
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => handleTogglePin(e, conv)}
                                                                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-white/6 transition-colors border-none bg-transparent cursor-pointer text-left"
                                                                >
                                                                    <PinOff size={13} className="text-indigo-400" />
                                                                    <span>Unpin</span>
                                                                </button>

                                                                <div className="my-1 h-px bg-white/6" />

                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => handleDeleteConversation(e, conv._id)}
                                                                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors border-none bg-transparent cursor-pointer text-left"
                                                                >
                                                                    <Trash2 size={13} />
                                                                    <span>Delete</span>
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Recents / Unpinned Conversations Section */}
                            <div>
                                {conversations.some(c => c.isPinned) && conversations.some(c => !c.isPinned) && (
                                    <div className='px-1.5 pb-1.5 text-[11px] font-bold uppercase tracking-widest text-slate-500'>
                                        Recents
                                    </div>
                                )}
                                {!conversations.some(c => c.isPinned) && (
                                    <div className='px-1.5 pb-1.5 text-[11px] font-bold uppercase tracking-widest text-slate-500'>
                                        Recents
                                    </div>
                                )}

                                <div className='space-y-1'>
                                    {conversations.filter(c => !c.isPinned).map((conv, i) => {
                                        const isActive = selectedConversation?._id == conv?._id;
                                        const isMenuOpen = openMenuId === conv?._id;

                                        return (
                                            <div
                                                key={conv?._id || i}
                                                onClick={() => handleSelectConversation(conv)}
                                                className={`group relative flex items-center justify-between gap-2 cursor-pointer px-3.5 py-2.5 rounded-xl border transition-all duration-150 
                                                ${isActive ? "bg-indigo-500/10 border-indigo-500/18" : "bg-transparent border-transparent hover:bg-white/3"}`}
                                            >
                                                <div className='flex items-center gap-2.5 min-w-0 flex-1'>
                                                    <div className={`flex items-center justify-center shrink-0 w-6 h-6 rounded-lg transition-colors duration-150 
                                                    ${isActive ? "bg-indigo-500/15 text-indigo-400" : "bg-white/5 text-slate-500"}`}
                                                    >
                                                        <MessageSquare size={13} />
                                                    </div>
                                                    <span className={`text-[13px] font-medium truncate ${isActive ? "text-slate-100" : "text-slate-400 group-hover:text-slate-200"}`}>
                                                        {conv?.title || "New Chat"}
                                                    </span>
                                                </div>

                                                {/* 3-dots Menu Trigger Button */}
                                                <div className='relative shrink-0'>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setOpenMenuId(isMenuOpen ? null : conv._id);
                                                        }}
                                                        className={`p-1 rounded-md text-slate-500 hover:text-slate-200 hover:bg-white/8 transition-colors border-none bg-transparent cursor-pointer ${isMenuOpen ? "opacity-100 bg-white/8 text-slate-200" : "opacity-0 group-hover:opacity-100"
                                                            }`}
                                                    >
                                                        <MoreVertical size={14} />
                                                    </button>

                                                    {/* Dropdown Menu */}
                                                    {isMenuOpen && (
                                                        <div
                                                            ref={menuRef}
                                                            onClick={(e) => e.stopPropagation()}
                                                            className="absolute right-0 top-7 z-50 w-36 bg-[#161821] border border-white/10 rounded-xl shadow-2xl py-1.5 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-100"
                                                        >
                                                            <button
                                                                type="button"
                                                                onClick={(e) => handleTogglePin(e, conv)}
                                                                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-white/6 transition-colors border-none bg-transparent cursor-pointer text-left"
                                                            >
                                                                <Pin size={13} className="text-indigo-400" />
                                                                <span>Pin Chat</span>
                                                            </button>

                                                            <div className="my-1 h-px bg-white/6" />

                                                            <button
                                                                type="button"
                                                                onClick={(e) => handleDeleteConversation(e, conv._id)}
                                                                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors border-none bg-transparent cursor-pointer text-left"
                                                            >
                                                                <Trash2 size={13} />
                                                                <span>Delete</span>
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                    <div className='mx-4 h-px bg-white/6' />

                    <div className='px-4 py-3 shrink-0'>
                        {userData ? (
                            <div className='flex items-center gap-3 cursor-pointer rounded-xl px-3 py-2.5 hover:bg-white/5 border border-transparent hover:border-white/4 bg-white/1 transition-all duration-150'>
                                <div className='relative shrink-0'>
                                    {(userData?.avatar && !imageError) ? (
                                        <img
                                            className='w-9 h-9 rounded-[10px] object-cover border-2 border-indigo-500/25'
                                            src={userData?.avatar} alt={"image"} onError={() => setImageError(true)}
                                        />
                                    ) : (
                                        <div className='w-9 h-9 rounded-[10px] bg-white/6 flex items-center justify-center'>
                                            <User size={15} className="text-slate-400" />
                                        </div>
                                    )}
                                </div>

                                <div className='flex-1 min-w-0 flex flex-col justify-center'>
                                    <p className='text-[13px] font-bold text-slate-100 truncate leading-none'>{userData?.name || "user"}</p>
                                    <div className='flex items-center gap-1.5 mt-1.5'>
                                        <span className='text-[9px] font-bold uppercase text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-1.5 py-0.5 rounded-md tracking-wider leading-none shrink-0'>
                                            {userData?.plan || "free"}
                                        </span>
                                    </div>
                                </div>

                                <div className='flex items-center gap-1 shrink-0'>
                                    <button onClick={() => setShowBilling(true)} className='flex items-center justify-center w-7 h-7 rounded-lg border-none bg-transparent text-slate-400 hover:text-yellow-500 cursor-pointer hover:bg-white/8 transition-all duration-150'>
                                        <Coins size={15} />
                                    </button>
                                    <button className='flex items-center justify-center w-7 h-7 rounded-lg border-none bg-transparent text-slate-400 hover:text-red-400 cursor-pointer hover:bg-white/8 transition-all duration-150'
                                        onClick={() => {
                                            logOut();
                                            dispatch(setUserdata(null));
                                        }}
                                    >
                                        <LogOut size={15} />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <button className='w-full flex items-center justify-center gap-2 text-sm font-medium text-slate-200 bg-white/5 border border-white/8 rounded-xl py-2.75 cursor-pointer hover:bg-white/8 transition-colors duration-150'>
                                Login
                            </button>
                        )}
                    </div>
                </div>
            </div>
            <BillingDraw
                open={showBilling}
                onClose={() => setShowBilling(false)}
            />
        </>
    )


}

export default Sidebar