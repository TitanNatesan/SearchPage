"use client";
import { useState } from "react";
import SearchBar from "./components/searchbar";

export default function Home() {
  const [border, setBorder] = useState("#000");
  return (
    <main className="border min-h-screen min-w-screen" style={{ borderColor: border, boxShadow: `inset 0 0 1000px ${border}` }}>
      <SearchBar setBorder={setBorder} />
    </main>
  );
}
