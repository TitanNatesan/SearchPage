"use client";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FaCalendarAlt, FaClock } from "react-icons/fa";

export default function DateTime() {
    const [currentDateTime, setCurrentDateTime] = useState(new Date());
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const timer = setInterval(() => {
            setCurrentDateTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    if (!mounted) {
        return null;
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="absolute top-4 right-4 p-6 rounded-xl shadow-2xl flex flex-col items-center space-y-4 bg-white/30 backdrop-blur-xl border border-white/30"
        >
            <div className="flex items-center space-x-2 bg-white p-4 rounded-full shadow-lg">
                <FaCalendarAlt className="text-blue-500 text-3xl" />
                <p className="text-3xl font-bold text-gray-800">
                    {currentDateTime.toLocaleDateString()}
                </p>
            </div>
            <div className="flex items-center space-x-2 bg-white p-4 rounded-full shadow-lg">
                <FaClock className="text-purple-500 text-2xl" />
                <p className="text-2xl font-semibold text-gray-800">
                    {currentDateTime.toLocaleTimeString()}
                </p>
            </div>
        </motion.div>
    );
}