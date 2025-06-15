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
    useEffect(() => {
        const saved = localStorage.getItem("selectedEngineIndex");
        if (saved !== null) {
            setSelectedIndex(Number(saved));
        }
    }, []);

    const [error, setError] = useState("");
    const [query, setQuery] = useState("");
    const [history, setHistory] = useState([]);
    const [showHistory, setShowHistory] = useState(false);
    const [selectedAction, setSelectedAction] = useState("search");
    const [calcResult, setCalcResult] = useState(null);

    const suggestionsRef = useRef(null);
    const inputRef = useRef(null);

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
    }, [selectedIndex]);

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
            const newHistory = [q, ...prev.filter(item => item !== q)];
            return newHistory.slice(0, 5);
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

    return (
        <div className="w-[40%] absolute top-[50%] left-[50%] transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center p-4">
            <form className="space-y-4 w-full" onSubmit={handleSubmit}>
                <div
                    className="searchbar flex items-center border-2 p-1 px-3 "
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
                    />
                    {query && (
                        <X className="inline h-full mr-2" onClick={() => setQuery("")} />
                    )}
                    <select
                        name="engine"
                        className="max-w-2xl px-2 py-1 border-l-2 border-black inline h-full"
                        value={options[selectedIndex].value}
                        onChange={(e) => {
                            const idx = options.findIndex(option => option.value === e.target.value);
                            if (idx !== -1) {
                                setSelectedIndex(idx);
                            }
                        }}
                        onWheel={handleWheel}
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
            </form>
            {showHistory && history.length > 0 && (
                <div
                    ref={suggestionsRef}
                    className="absolute bg-white border border-gray-300 w-full z-10 max-h-40 overflow-y-auto mt-1"
                    onMouseDown={(e) => e.preventDefault()}
                >
                    {history.map((item, index) => (
                        <div
                            key={index}
                            className="p-2 cursor-pointer border-b last:border-0"
                            onClick={() => {
                                setQuery(item);
                                setShowHistory(false);
                            }}
                        >
                            {item}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
