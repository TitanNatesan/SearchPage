"use client";
import React, { useEffect } from "react";

import "@pqina/flip/dist/flip.min.css";
import Tick from "@pqina/flip";

export default function Flip({ value }) {
    const tickRef = React.useRef();
    let tickInstance = React.useRef();

    useEffect(() => {
        const currentTickRef = tickRef.current;
        tickInstance.current = Tick.DOM.create(currentTickRef, {value});
        return () => Tick.DOM.destroy(currentTickRef);
    }, []);

    useEffect(() => {
        if (!tickInstance.current) return;
        tickInstance.current.value = value;
    }, [value]);

    return (
        <div ref={tickRef} className="tick" style={{ fontSize: "10em" }}>
            <div data-repeat="true" aria-hidden="true">
                <span data-view="flip">Tick</span>
            </div>
        </div>
    );
}
