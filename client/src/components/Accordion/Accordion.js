import React, { useState, useRef, useEffect } from "react";
import "./Accordion.css";
import arrowIcon from "../../assets/icons/iconamoon_arrow-down-2-light.svg";

export const Accordion = ({ children }) => {
    return <div className="accordion">{children}</div>;
};

export const AccordionItem = ({ title, children }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [height, setHeight] = useState(0);
    const contentRef = useRef(null);

    useEffect(() => {
        if (contentRef.current) {
            setHeight(isOpen ? contentRef.current.scrollHeight : 0);
        }
    }, [isOpen]);

    const toggleOpen = () => {
        setIsOpen(!isOpen);
    };

    return (
        <div className="accordion-item">
            <div className="accordion-header" onClick={toggleOpen}>
                {title}
                <img
                    src={arrowIcon}
                    alt="Toggle"
                    className={`accordion-icon ${isOpen ? "open" : ""}`}
                />
            </div>
            <div
                className="accordion-content"
                ref={contentRef}
                style={{ height: `${height}px` }}
            >
                <div className="accordion-content-inner">{children}</div>
            </div>
        </div>
    );
};