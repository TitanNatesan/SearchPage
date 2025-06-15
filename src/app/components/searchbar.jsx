"use client";
import { X } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import SearchAction from "./searchaction";

export default function SearchBar({ placeholder = "Search...", setBorder }) {
    const options = [
        { value: "google", label: "Google", url: "https://www.google.com/search?q=", bg: "#4285F4" },
        { value: "bing", label: "Bing", url: "https://www.bing.com/search?q=", bg: "#008272" },
        { value: "duckduckgo", label: "DuckDuckGo", url: "https://duckduckgo.com/?q=", bg: "#DE5833" },
        { value: "github", label: "GitHub", url: "https://github.com/search?q=", bg: "#24292e" },
        { value: "youtube", label: "YouTube", url: "https://www.youtube.com/results?search_query=", bg: "#FF0000" },
        { value: "spotify", label: "Spotify", url: "https://open.spotify.com/search/", bg: "#1DB954" }
    ];

    const [selectedIndex, setSelectedIndex] = useState(0);
    const [error, setError] = useState("");
    const [query, setQuery] = useState("");
    const [history, setHistory] = useState([]);
    const [showHistory, setShowHistory] = useState(false);
    const [selectedAction, setSelectedAction] = useState("search");
    const [calcResult, setCalcResult] = useState(null);
    const [filteredHistory, setFilteredHistory] = useState([]);

    const suggestionsRef = useRef(null);
    const inputRef = useRef(null);
    const formRef = useRef(null);

    // Load saved engine preference
    useEffect(() => {
        const saved = localStorage.getItem("selectedEngineIndex");
        if (saved !== null) {
            setSelectedIndex(Number(saved));
        }
    }, []);

    // Load search history from localStorage
    useEffect(() => {
        const savedHistory = localStorage.getItem("searchHistory");
        if (savedHistory) {
            try {
                setHistory(JSON.parse(savedHistory));
            } catch (e) {
                console.error("Failed to parse search history", e);
            }
        }
    }, []);

    // Save history to localStorage when it changes
    useEffect(() => {
        localStorage.setItem("searchHistory", JSON.stringify(history));
    }, [history]);

    // Handle outside clicks to close history dropdown
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showHistory && 
                !suggestionsRef.current?.contains(event.target) && 
                !formRef.current?.contains(event.target)) {
                setShowHistory(false);
            }
        };
        
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [showHistory]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.ctrlKey && e.key === "/") {
                e.preventDefault();
                inputRef.current?.focus();
            }
        };
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, []);

    // Save selectedIndex change to localStorage
    useEffect(() => {
        localStorage.setItem("selectedEngineIndex", selectedIndex);
        setBorder(options[selectedIndex].bg);
    }, [selectedIndex, setBorder, options]);

    // Filter history based on current query
    useEffect(() => {
        if (query.trim() === '') {
            setFilteredHistory(history);
        } else {
            setFilteredHistory(
                history.filter(item => 
                    item.query.toLowerCase().includes(query.toLowerCase())
                )
            );
        }
    }, [query, history]);

    const handleWheel = (e) => {
        e.preventDefault();
        if (e.deltaY < 0) {
            setSelectedIndex((prev) => (prev - 1 + options.length) % options.length);
            setBorder(options[(selectedIndex - 1 + options.length) % options.length].bg);
        } else {
            setSelectedIndex((prev) => (prev + 1) % options.length);
            setBorder(options[(selectedIndex + 1) % options.length].bg);
        }
    };

    const addToHistory = (q) => {
        setHistory((prev) => {
            const now = new Date().toISOString();
            const newItem = { query: q, timestamp: now, engine: options[selectedIndex].value };
            // Filter out duplicate queries
            const newHistory = [newItem, ...prev.filter(item => item.query !== q)];
            return newHistory.slice(0, 20); // Keep last 20 searches
        });
    };

    const isMathExpression = (str) => {
        return /^[\d+\-*/().\s]+$/.test(str);
    };

    // Evaluate math expression on query change
    useEffect(() => {
        const trimmedQuery = query.trim();
        if (trimmedQuery && isMathExpression(trimmedQuery)) {
            try {
                const evaluated = Function('"use strict"; return (' + trimmedQuery + ')')();
                setCalcResult({ expression: trimmedQuery, result: evaluated });
            } catch (e) {
                setCalcResult(null);
            }
        } else {
            setCalcResult(null);
        }
    }, [query]);

    const performSearch = () => {
        const trimmedQuery = query.trim();
        if (!trimmedQuery) {
            setError("Please enter a search query.");
            return;
        }
        setError("");

        // Handle calculation action.
        if (selectedAction === "calculate" && isMathExpression(trimmedQuery)) {
            try {
                const evaluated = Function('"use strict"; return (' + trimmedQuery + ')')();
                setCalcResult({ expression: trimmedQuery, result: evaluated });
                addToHistory(trimmedQuery);
                setQuery("");
                setShowHistory(false);
                setSelectedAction("search");
                return;
            } catch (e) { }
        }

        // Check if query starts with a single letter followed by a space.
        let queryToSearch = trimmedQuery;
        let engineIndex = selectedIndex;
        const letterMatch = trimmedQuery.match(/^([a-zA-Z])\s+(.*)$/);
        if (letterMatch) {
            const letter = letterMatch[1].toLowerCase();
            const candidate = options.findIndex(option => option.label[0].toLowerCase() === letter);
            if (candidate !== -1) {
                engineIndex = candidate;
                queryToSearch = letterMatch[2];
                setSelectedIndex(candidate);
            }
        }

        addToHistory(queryToSearch);
        setCalcResult(null);
        const engine = options[engineIndex];
        const url = getSearchUrl(engine, selectedAction, queryToSearch);
        setQuery("");
        setShowHistory(false);
        setSelectedAction("search");
        window.location.href = url;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        performSearch();
    };

    const getSearchUrl = (engine, action, query) => {
        const encodedQuery = encodeURIComponent(query);
        switch (action) {
            case "images":
                if (engine.value === "google") {
                    return `https://www.google.com/search?tbm=isch&q=${encodedQuery}`;
                }
                if (engine.value === "bing") {
                    return `https://www.bing.com/images/search?q=${encodedQuery}`;
                }
                return `https://duckduckgo.com/?iax=images&ia=images&q=${encodedQuery}`;
            case "videos":
                if (engine.value === "google") {
                    return `https://www.google.com/search?tbm=vid&q=${encodedQuery}`;
                }
                if (engine.value === "bing") {
                    return `https://www.bing.com/videos/search?q=${encodedQuery}`;
                }
                return `https://duckduckgo.com/?iax=videos&ia=videos&q=${encodedQuery}`;
            default:
                return engine.url + encodedQuery;
        }
    };

    // Refactored handleQueryChange using the current query state.
    const handleQueryChange = () => {
        const letterMatch = query.match(/^([a-zA-Z])\s+(.*)$/);
        if (letterMatch) {
            const letter = letterMatch[1].toLowerCase();
            // If the current search engine already starts with the letter, do nothing.
            if (options[selectedIndex].label[0].toLowerCase() === letter) {
                return;
            }
            const candidate = options.findIndex(option => option.label[0].toLowerCase() === letter);
            if (candidate !== -1) {
                setSelectedIndex(candidate);
                // Remove the letter prefix from the query.
                setQuery(letterMatch[2]);
            }
        }
    };

    // Call handleQueryChange whenever query changes.
    useEffect(() => {
        handleQueryChange();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [query]);

    // Format the timestamp to a readable format
    const formatTime = (isoString) => {
        const date = new Date(isoString);
        return date.toLocaleString(undefined, {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="w-[40%] absolute top-[50%] left-[50%] transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center p-4">
            <form ref={formRef} className="space-y-4 w-full relative" onSubmit={handleSubmit}>
                <div
                    className="searchbar flex items-center border-2 p-1 px-3 relative"
                    style={{ borderColor: options[selectedIndex].bg }}
                    onWheel={handleWheel}
                >
                    <input
                        ref={inputRef}
                        type="text"
                        name="query"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onFocus={() => setShowHistory(true)}
                        placeholder={placeholder}
                        className="flex-grow outline-none"
                    />
                    {query && (
                        <X className="inline h-full mr-2 cursor-pointer" onClick={() => setQuery("")} />
                    )}
                    <select
                        name="engine"
                        className="max-w-2xl px-2 py-1 border-l-2 border-black inline h-full outline-none"
                        value={options[selectedIndex].value}
                        onChange={(e) => {
                            const idx = options.findIndex(option => option.value === e.target.value);
                            if (idx !== -1) {
                                setSelectedIndex(idx);
                            }
                        }}
                    >
                        {options.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>
                {calcResult && (
                    <p className="ml-7 text-gray-500 font-bold">
                        {calcResult.expression} = {calcResult.result}
                    </p>
                )}

                {error && <p className="text-red-500">{error}</p>}
                <div className="flex space-x-2">
                    <SearchAction
                        selectedAction={selectedAction}
                        setSelectedAction={setSelectedAction}
                        action="images"
                    />
                    <SearchAction
                        selectedAction={selectedAction}
                        setSelectedAction={setSelectedAction}
                        action="videos"
                    />
                </div>
                
                {showHistory && filteredHistory.length > 0 && (
                    <div
                        ref={suggestionsRef}
                        className="absolute bg-white border border-gray-300 shadow-lg w-full rounded mt-1 z-10 max-h-80 overflow-y-auto"
                        onMouseDown={(e) => e.preventDefault()}
                    >
                        {filteredHistory.map((item, index) => {
                            const engineOption = options.find(opt => opt.value === item.engine) || options[0];
                            return (
                                <div
                                    key={index}
                                    className="p-3 cursor-pointer hover:bg-gray-100 flex justify-between items-center"
                                    onClick={() => {
                                        setQuery(item.query);
                                        inputRef.current?.focus();
                                        // Set the engine if available
                                        if (item.engine) {
                                            const idx = options.findIndex(opt => opt.value === item.engine);
                                            if (idx !== -1) setSelectedIndex(idx);
                                        }
                                    }}
                                >
                                    <div className="flex items-center">
                                        <span 
                                            className="w-3 h-3 rounded-full mr-3" 
                                            style={{ backgroundColor: engineOption.bg }}
                                        ></span>
                                        <span>{item.query}</span>
                                    </div>
                                    <span className="text-xs text-gray-500 ml-2">
                                        {item.timestamp ? formatTime(item.timestamp) : ''}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                )}
            </form>
        </div>
    );
}
