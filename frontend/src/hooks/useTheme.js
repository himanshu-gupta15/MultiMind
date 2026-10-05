import { useEffect, useState } from 'react'

const readSaved = () => {
    try {
        return localStorage.getItem("theme")
    } catch {
        return null
    }
}

// index.html sets data-theme before first paint; this keeps it in sync after that
export default function useTheme() {
    const [theme, setTheme] = useState(() => document.documentElement.dataset.theme || "light")

    useEffect(() => {
        document.documentElement.dataset.theme = theme
    }, [theme])

    // Follow the system setting until the user picks a theme themselves
    useEffect(() => {
        const media = window.matchMedia("(prefers-color-scheme: dark)")
        const onChange = (e) => {
            if (!readSaved()) setTheme(e.matches ? "dark" : "light")
        }
        media.addEventListener("change", onChange)
        return () => media.removeEventListener("change", onChange)
    }, [])

    const toggleTheme = () => {
        const next = theme === "dark" ? "light" : "dark"
        try {
            localStorage.setItem("theme", next)
        } catch {
            // Storage blocked; the theme still applies for this visit
        }
        setTheme(next)
    }

    return { theme, toggleTheme }
}
