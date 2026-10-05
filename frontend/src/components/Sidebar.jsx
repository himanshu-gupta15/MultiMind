import React from 'react'
import { LogOut, MessageSquare, PanelLeft, Plus, X, MoreHorizontal, Pin, PinOff, Trash2, Pencil, Sun, Moon } from "lucide-react"
import { useDispatch, useSelector } from 'react-redux'
import { getConversation } from '../features/getConveration'
import { setConversations, setSelectedConversation, removeConversation, updatePinState, renameConversation } from '../redux/conversationSlice'
import { updateConversation } from '../features/updateConversation'
import { deleteConversation as deleteConvApi } from '../features/deleteConversation'
import { togglePinConversation as togglePinApi } from '../features/togglePinConversation'
import logOut from '../features/logOut'
import { setBillingOpen, setSidebarOpen } from '../redux/uiSlice'
import { useState, useEffect, useRef } from 'react'
import { setUserdata } from '../redux/userSlice.js'
import useTheme from '../hooks/useTheme'

function Sidebar() {
    const [collapsed, setCollapsed] = useState(false)
    const dispatch = useDispatch()
    const [imageError, setImageError] = useState(false)
    const { conversations, selectedConversation } = useSelector((state) => state.conversation)
    const { userData } = useSelector(state => state.user)
    const { sidebarOpen } = useSelector(state => state.ui)
    const { theme, toggleTheme } = useTheme()
    const [openMenuId, setOpenMenuId] = useState(null);
    const menuRef = useRef(null);
    const [editingId, setEditingId] = useState(null);
    const [editTitle, setEditTitle] = useState("");
    const cancelRenameRef = useRef(false);

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
        dispatch(setSidebarOpen(false));
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
        dispatch(setSidebarOpen(false));
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

    const startRename = (e, conv) => {
        e.stopPropagation();
        setOpenMenuId(null);
        setEditingId(conv._id);
        setEditTitle(conv.title || "");
    };

    const saveRename = async (conv) => {
        const title = editTitle.trim();
        setEditingId(null);
        if (cancelRenameRef.current) {
            cancelRenameRef.current = false;
            return;
        }
        if (!title || title === conv.title) return;

        const previousTitle = conv.title;
        dispatch(renameConversation({ conversationId: conv._id, title }));
        try {
            await updateConversation({ id: conv._id, title });
        } catch (error) {
            console.error("Failed to rename conversation:", error);
            dispatch(renameConversation({ conversationId: conv._id, title: previousTitle }));
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

    const pinned = conversations.filter(c => c.isPinned);
    const recent = conversations.filter(c => !c.isPinned);
    const credits = userData?.credits || 0;
    const totalCredits = userData?.totalCredits || 100;
    const creditsPct = Math.min((credits / totalCredits) * 100, 100);
    const initials = (userData?.name || "User").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

    const renderAvatar = (size = "w-9 h-9") => (
        (userData?.avatar && !imageError)
            ? <img className={`${size} rounded-full object-cover shrink-0`} src={userData.avatar} alt="" onError={() => setImageError(true)} />
            : <div className={`${size} rounded-full bg-sage-200 text-sage-900 grid place-items-center text-[13px] font-bold shrink-0`}>{initials}</div>
    );

    const renderRow = (conv, i) => {
        const isActive = selectedConversation?._id == conv?._id;
        const isMenuOpen = openMenuId === conv?._id;
        const isEditing = editingId === conv?._id;

        if (isEditing) {
            return (
                <div key={conv?._id || i} className='flex items-center gap-2.5 py-1.5 px-3 rounded-full bg-sand-100 ring-2 ring-clay'>
                    <span className={`flex ${conv.isPinned ? "text-sage-700" : "text-sand-600"}`}>
                        <Pencil size={15} />
                    </span>
                    <input
                        autoFocus
                        value={editTitle}
                        maxLength={80}
                        aria-label="Chat title"
                        onChange={(e) => setEditTitle(e.target.value)}
                        onFocus={(e) => e.target.select()}
                        onBlur={() => saveRename(conv)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") e.target.blur();
                            if (e.key === "Escape") {
                                cancelRenameRef.current = true;
                                e.target.blur();
                            }
                        }}
                        className='flex-1 min-w-0 h-7 bg-transparent border-none outline-none text-sm font-semibold'
                    />
                </div>
            );
        }

        return (
            <div key={conv?._id || i} className='relative'>
                <div
                    onClick={() => handleSelectConversation(conv)}
                    className={`group flex items-center gap-2.5 py-1.5 pr-1.5 pl-3 rounded-full cursor-pointer transition-colors ${isActive ? "bg-sand-100" : "hover:bg-sand-100/70"}`}
                >
                    <span className={`flex ${conv.isPinned ? "text-sage-700" : "text-sand-600"}`}>
                        {conv.isPinned ? <Pin size={15} /> : <MessageSquare size={15} />}
                    </span>
                    <span className={`flex-1 min-w-0 text-sm truncate ${isActive ? "font-semibold" : ""}`}>
                        {conv?.title || "New Chat"}
                    </span>
                    <button
                        type="button"
                        title="Chat options"
                        onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuId(isMenuOpen ? null : conv._id);
                        }}
                        className={`w-7 h-7 rounded-full grid place-items-center text-sand-700 hover:bg-ink/10 cursor-pointer shrink-0 transition-opacity ${isMenuOpen ? "opacity-100 bg-ink/10" : "opacity-100 lg:opacity-0 lg:group-hover:opacity-100"}`}
                    >
                        <MoreHorizontal size={16} />
                    </button>
                </div>
                {isMenuOpen && (
                    <div
                        ref={menuRef}
                        onClick={(e) => e.stopPropagation()}
                        className='absolute right-1 top-10 z-30 w-42 p-1.5 rounded-card bg-sand-100 shadow-soft-lg flex flex-col gap-0.5'
                    >
                        <button
                            type="button"
                            onClick={(e) => handleTogglePin(e, conv)}
                            className='flex items-center gap-2.5 px-3 py-2 rounded-full text-[13px] text-left hover:bg-sand-200 cursor-pointer'
                        >
                            {conv.isPinned ? <PinOff size={14} /> : <Pin size={14} />}
                            {conv.isPinned ? "Unpin" : "Pin chat"}
                        </button>
                        <button
                            type="button"
                            onClick={(e) => startRename(e, conv)}
                            className='flex items-center gap-2.5 px-3 py-2 rounded-full text-[13px] text-left hover:bg-sand-200 cursor-pointer'
                        >
                            <Pencil size={14} />
                            Rename
                        </button>
                        <button
                            type="button"
                            onClick={(e) => handleDeleteConversation(e, conv._id)}
                            className='flex items-center gap-2.5 px-3 py-2 rounded-full text-[13px] text-left text-clay-700 hover:bg-clay-100 cursor-pointer'
                        >
                            <Trash2 size={14} />
                            Delete
                        </button>
                    </div>
                )}
            </div>
        );
    };

    const iconBtn = 'w-9 h-9 rounded-full grid place-items-center text-sand-700 hover:bg-ink/7 cursor-pointer shrink-0 transition-colors';

    return (
        <>
            {/* Collapsed rail (desktop only) */}
            <aside className={`${collapsed ? "hidden lg:flex" : "hidden"} w-17 shrink-0 h-full flex-col items-center gap-2 py-4 bg-surface`}>
                <button className={iconBtn} onClick={() => setCollapsed(false)} title="Expand sidebar">
                    <PanelLeft size={18} />
                </button>
                <button className='w-10 h-10 rounded-full grid place-items-center bg-clay hover:bg-clay-600 text-canvas cursor-pointer transition-colors' onClick={handleNewChat} title="New chat">
                    <Plus size={17} />
                </button>
                <div className='flex-1 min-h-0 overflow-y-auto no-scrollbar flex flex-col gap-1 pt-3'>
                    {conversations.map((conv, i) => {
                        const isActive = selectedConversation?._id == conv?._id;
                        return (
                            <button
                                key={conv?._id || i}
                                title={conv?.title || "New Chat"}
                                onClick={() => handleSelectConversation(conv)}
                                className={`w-10 h-10 rounded-full grid place-items-center cursor-pointer transition-colors hover:bg-sand-100 ${isActive ? "bg-sand-100 text-ink" : "text-sand-700"}`}
                            >
                                {conv.isPinned ? <Pin size={16} /> : <MessageSquare size={16} />}
                            </button>
                        );
                    })}
                </div>
                <button className={iconBtn} onClick={toggleTheme} title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}>
                    {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
                </button>
                {renderAvatar()}
            </aside>

            {/* Mobile backdrop */}
            {sidebarOpen && <div onClick={() => dispatch(setSidebarOpen(false))} className='lg:hidden fixed inset-0 z-39 bg-scrim/40' />}

            {/* Full sidebar: drawer on mobile, column on desktop */}
            <aside
                className={`fixed inset-y-0 left-0 z-40 w-72 max-w-[85vw] h-full shrink-0 flex flex-col gap-3 px-3 py-4 bg-surface transition-transform duration-250 shadow-soft-lg lg:shadow-none
                ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:static lg:translate-x-0 ${collapsed ? "lg:hidden" : "lg:flex"}`}
            >
                <div className='flex items-center gap-2.5 px-1'>
                    <div className='w-8.5 h-8.5 rounded-full bg-clay text-canvas grid place-items-center font-display text-lg shrink-0'>M</div>
                    <div className='flex-1 font-display text-[21px] leading-none'>MultiMind</div>
                    <button className={`${iconBtn} hidden lg:grid`} onClick={() => setCollapsed(true)} title="Collapse sidebar">
                        <PanelLeft size={18} />
                    </button>
                    <button className={`${iconBtn} lg:hidden`} onClick={() => dispatch(setSidebarOpen(false))} title="Close menu">
                        <X size={18} />
                    </button>
                </div>

                <button
                    className='w-full h-10.5 flex items-center justify-center gap-1.5 rounded-full bg-clay hover:bg-clay-600 active:bg-clay-700 text-canvas font-display text-sm cursor-pointer transition-colors'
                    onClick={handleNewChat}
                >
                    <Plus size={16} />
                    New chat
                </button>

                <div className='flex-1 min-h-0 overflow-y-auto no-scrollbar flex flex-col gap-4 pt-1'>
                    {conversations.length === 0 && (
                        <div className='px-3 py-4 text-[13px] text-sand-700'>No conversations yet. Start one above.</div>
                    )}

                    {pinned.length > 0 && (
                        <div className='flex flex-col gap-0.5'>
                            <div className='flex items-center justify-between px-3 pb-1.5 text-[11px] font-bold uppercase tracking-[.08em] text-sage-800'>
                                <span>Pinned</span>
                                <span>{pinned.length}</span>
                            </div>
                            {pinned.map(renderRow)}
                        </div>
                    )}

                    {recent.length > 0 && (
                        <div className='flex flex-col gap-0.5'>
                            <div className='px-3 pb-1.5 text-[11px] font-bold uppercase tracking-[.08em] text-sand-700'>Recent</div>
                            {recent.map(renderRow)}
                        </div>
                    )}
                </div>

                {userData && (
                    <div className='flex flex-col gap-2'>
                        <div className='p-3 rounded-card bg-sand-100 flex flex-col gap-2'>
                            <div className='flex items-baseline justify-between text-[13px]'>
                                <span className='font-semibold'>Credits</span>
                                <span className='text-sand-700'>{credits} / {totalCredits}</span>
                            </div>
                            <div className='h-2 rounded-full bg-sage-200 overflow-hidden'>
                                <div className='h-full rounded-full bg-sage-600 transition-[width] duration-500' style={{ width: `${creditsPct}%` }} />
                            </div>
                            <button
                                onClick={() => dispatch(setBillingOpen(true))}
                                className='self-start -ml-2 px-2 py-1 rounded-full text-[13px] font-semibold text-clay-700 hover:bg-clay/10 cursor-pointer transition-colors'
                            >
                                Get more credits
                            </button>
                        </div>
                        <div className='flex items-center gap-2.5 px-1 py-1.5'>
                            {renderAvatar()}
                            <div className='flex-1 min-w-0 flex flex-col gap-0.5'>
                                <div className='text-sm font-semibold truncate'>{userData?.name || "User"}</div>
                                <span className='self-start px-2 py-px rounded-xl bg-clay-100 text-clay-800 text-[10px] font-bold uppercase tracking-[.06em]'>
                                    {userData?.plan || "free"}
                                </span>
                            </div>
                            <button className={iconBtn} onClick={toggleTheme} title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}>
                                {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
                            </button>
                            <button
                                className={iconBtn}
                                title="Sign out"
                                onClick={() => {
                                    logOut();
                                    dispatch(setUserdata(null));
                                }}
                            >
                                <LogOut size={17} />
                            </button>
                        </div>
                    </div>
                )}
            </aside>
        </>
    )



}

export default Sidebar