import React, { useMemo } from "react";

// This function creates a poker chip avatar with user's initials
export const createPokerChipAvatar = (username, firstName, lastName) => {
    // Hash function to ensure consistent colors for the same username
    const hashCode = (str) => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) - hash) + str.charCodeAt(i);
            hash = hash & hash; // Convert to 32bit integer
        }
        return Math.abs(hash);
    };

    const hash = hashCode(username);

    // Color palettes with variety and modern colors
    const chipColors = [
        { main: '#E74C3C', accent: '#FFFFFF' }, // Red with white
        { main: '#3498DB', accent: '#FFFFFF' }, // Blue with white
        { main: '#2ECC71', accent: '#FFFFFF' }, // Green with white
        { main: '#F39C12', accent: '#FFFFFF' }, // Orange with white
        { main: '#9B59B6', accent: '#FFFFFF' }, // Purple with white
        { main: '#1ABC9C', accent: '#FFFFFF' }, // Teal with white
        { main: '#34495E', accent: '#FFFFFF' }, // Navy with white
        { main: '#7F8C8D', accent: '#FFFFFF' }, // Gray with white
        { main: '#FFFFFF', accent: '#E74C3C' }, // White with red
        { main: '#FFFFFF', accent: '#3498DB' }, // White with blue
        { main: '#FFFFFF', accent: '#2ECC71' }, // White with green
        { main: '#FFFFFF', accent: '#F39C12' }, // White with orange
        { main: '#D81B60', accent: '#FFFFFF' }, // Pink with white
        { main: '#8E24AA', accent: '#FFFFFF' }, // Deep purple with white
        { main: '#5E35B1', accent: '#FFFFFF' }, // Indigo with white
        { main: '#1E88E5', accent: '#FFFFFF' }, // Light blue with white
        { main: '#00897B', accent: '#FFFFFF' }, // Turquoise with white
        { main: '#43A047', accent: '#FFFFFF' }, // Light green with white
        { main: '#C0CA33', accent: '#FFFFFF' }, // Lime with white
        { main: '#FFB300', accent: '#FFFFFF' }, // Amber with white
        { main: '#FB8C00', accent: '#FFFFFF' }, // Dark orange with white
        { main: '#F4511E', accent: '#FFFFFF' }, // Deep orange with white
        { main: '#6D4C41', accent: '#FFFFFF' }, // Brown with white
        { main: '#757575', accent: '#FFFFFF' }, // Medium gray with white
        { main: '#546E7A', accent: '#FFFFFF' }, // Blue gray with white
        { main: '#FFFFFF', accent: '#D81B60' }, // White with pink
        { main: '#FFFFFF', accent: '#8E24AA' }, // White with deep purple
        { main: '#FFFFFF', accent: '#5E35B1' }, // White with indigo
        { main: '#FFFFFF', accent: '#1E88E5' }, // White with light blue
        { main: '#FFFFFF', accent: '#00897B' }, // White with turquoise
        { main: '#FFFFFF', accent: '#43A047' }, // White with light green
        { main: '#FFFFFF', accent: '#C0CA33' }, // White with lime
        { main: '#FFFFFF', accent: '#FFB300' }, // White with amber
        { main: '#FFFFFF', accent: '#FB8C00' }, // White with dark orange
        { main: '#FFFFFF', accent: '#F4511E' }, // White with deep orange
        { main: '#FFFFFF', accent: '#6D4C41' }, // White with brown
    ];

    const colorIndex = hash % chipColors.length;
    const chipColor = chipColors[colorIndex].main;
    const accentColor = chipColors[colorIndex].accent;

    const initials = (firstName?.charAt(0) || '') + (lastName?.charAt(0) || '');

    // Create SVG
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 100 100");
    svg.setAttribute("width", "100%");
    svg.setAttribute("height", "100%");
    svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");

    // Shadow for depth
    const shadow = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    shadow.setAttribute("cx", "50");
    shadow.setAttribute("cy", "52");
    shadow.setAttribute("r", "46");
    shadow.setAttribute("fill", "rgba(0,0,0,0.2)");
    svg.appendChild(shadow);

    // Base of the chip
    const baseCircle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    baseCircle.setAttribute("cx", "50");
    baseCircle.setAttribute("cy", "50");
    baseCircle.setAttribute("r", "46");
    baseCircle.setAttribute("fill", chipColor);
    baseCircle.setAttribute("stroke", "#000000");
    baseCircle.setAttribute("stroke-width", "0.5");
    svg.appendChild(baseCircle);

    // Edge ring
    const edgeRing = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    edgeRing.setAttribute("cx", "50");
    edgeRing.setAttribute("cy", "50");
    edgeRing.setAttribute("r", "0");  // Changed from 0 to 46 to make it visible
    edgeRing.setAttribute("fill", "none");
    edgeRing.setAttribute("stroke", "#000000");
    edgeRing.setAttribute("stroke-width", "4");
    edgeRing.setAttribute("stroke-opacity", "0.3");
    svg.appendChild(edgeRing);

    // Inner circle with proper color handling
    const innerCircle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    innerCircle.setAttribute("cx", "50");
    innerCircle.setAttribute("cy", "50");
    innerCircle.setAttribute("r", "39");

    // Determine if the main color is white or very light
    const isLightColor = chipColor === '#FFFFFF' || chipColor.toLowerCase() === '#fff';

    // If the main color is white, use the accent color for the inner circle instead
    innerCircle.setAttribute("fill", isLightColor ? accentColor : chipColor);
    innerCircle.setAttribute("stroke", "#000000");
    innerCircle.setAttribute("stroke-width", "0.5");
    svg.appendChild(innerCircle);

    // Checkered pattern
    const segmentCount = 16;
    const segmentGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");

    for (let i = 0; i < segmentCount; i++) {
        const startAngle = (i * 360 / segmentCount) % 360;
        const endAngle = ((i + 1) * 360 / segmentCount) % 360;

        if (i % 2 === 0) {
            const startRadians = (startAngle * Math.PI) / 180;
            const endRadians = (endAngle * Math.PI) / 180;

            const outerStartX = 50 + 46 * Math.cos(startRadians);
            const outerStartY = 50 + 46 * Math.sin(startRadians);
            const outerEndX = 50 + 46 * Math.cos(endRadians);
            const outerEndY = 50 + 46 * Math.sin(endRadians);
            const innerStartX = 50 + 39 * Math.cos(endRadians);
            const innerStartY = 50 + 39 * Math.sin(endRadians);
            const innerEndX = 50 + 39 * Math.cos(startRadians);
            const innerEndY = 50 + 39 * Math.sin(startRadians);

            const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
            path.setAttribute("d", `
        M ${outerStartX} ${outerStartY}
        A 46 46 0 0 1 ${outerEndX} ${outerEndY}
        L ${innerStartX} ${innerStartY}
        A 39 39 0 0 0 ${innerEndX} ${innerEndY} 
        Z
      `);
            path.setAttribute("fill", accentColor);
            path.setAttribute("stroke", "#000000");
            path.setAttribute("stroke-width", "0.2");
            path.setAttribute("stroke-opacity", "0.3");
            segmentGroup.appendChild(path);
        }
    }
    svg.appendChild(segmentGroup);

    // Center circle
    const centerCircle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    centerCircle.setAttribute("cx", "50");
    centerCircle.setAttribute("cy", "50");
    centerCircle.setAttribute("r", "30");
    centerCircle.setAttribute("fill", "#FFFFFF");
    centerCircle.setAttribute("stroke", "#000000");
    centerCircle.setAttribute("stroke-width", "0.5");
    svg.appendChild(centerCircle);

    // Highlight/glare effect
    const highlight = document.createElementNS("http://www.w3.org/2000/svg", "ellipse");
    highlight.setAttribute("cx", "35");
    highlight.setAttribute("cy", "35");
    highlight.setAttribute("rx", "15");
    highlight.setAttribute("ry", "10");
    highlight.setAttribute("fill", "rgba(255, 255, 255, 0.2)");
    highlight.setAttribute("transform", "rotate(-30, 35, 35)");
    svg.appendChild(highlight);

    // Add user's initials
    if (initials) {
        const initialsText = document.createElementNS("http://www.w3.org/2000/svg", "text");
        initialsText.setAttribute("x", "50");
        initialsText.setAttribute("y", "52");
        initialsText.setAttribute("text-anchor", "middle");
        initialsText.setAttribute("dominant-baseline", "middle");
        initialsText.setAttribute("font-size", "22");
        initialsText.setAttribute("font-weight", "600");
        initialsText.setAttribute("fill", "#000000");

        // Import Outfit font
        const styleElement = document.createElementNS("http://www.w3.org/2000/svg", "style");
        styleElement.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@600&display=swap');
      text { font-family: 'Outfit', sans-serif; }
    `;
        svg.appendChild(styleElement);

        initialsText.setAttribute("font-family", "Outfit, sans-serif");
        initialsText.textContent = initials;
        svg.appendChild(initialsText);
    }

    const serializer = new XMLSerializer();
    return serializer.serializeToString(svg);
};

// Reusable component that can be imported throughout the app
const PokerChipAvatar = ({ username, firstName, lastName, ...props }) => {
    const svgURI = useMemo(
        () =>
            "data:image/svg+xml;utf8," +
            encodeURIComponent(
                createPokerChipAvatar(username, firstName, lastName)
            ),
        [username, firstName, lastName]
    );
    return <img src={svgURI} alt={username} {...props} />;
};

export default PokerChipAvatar;