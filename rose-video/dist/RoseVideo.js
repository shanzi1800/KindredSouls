import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
const ROSES = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 90,
    speed: 0.3 + Math.random() * 0.7,
    size: 20 + Math.random() * 30,
    rotationSpeed: (Math.random() - 0.5) * 3,
    sway: Math.random() * 40 + 10,
    opacity: 0.6 + Math.random() * 0.4,
}));
export const RoseVideo = ({ audioSrc }) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();
    return (_jsxs(AbsoluteFill, { style: { background: "linear-gradient(180deg, #1A1F4B 0%, #0D0D1A 100%)" }, children: [ROSES.map((rose) => {
                const elapsed = Math.max(0, frame - rose.delay * fps * 0.1);
                const fallY = (elapsed / fps) * rose.speed * 1080;
                const loopedY = fallY % 1200;
                const swayX = Math.sin((frame + rose.delay * 10) * 0.02) * rose.sway;
                const rotate = frame * rose.rotationSpeed;
                const fadeIn = interpolate(frame, [rose.delay * 5, rose.delay * 5 + 20], [0, rose.opacity], {
                    extrapolateRight: "clamp",
                });
                return (_jsx("div", { style: {
                        position: "absolute",
                        left: `calc(${rose.left}% + ${swayX}px)`,
                        top: `${loopedY - 100}px`,
                        width: rose.size,
                        height: rose.size,
                        opacity: fadeIn,
                        transform: `rotate(${rotate}deg)`,
                        pointerEvents: "none",
                    }, children: _jsxs("svg", { viewBox: "0 0 100 100", width: rose.size, height: rose.size, children: [_jsx("circle", { cx: "50", cy: "50", r: "18", fill: "#D4AF37", opacity: "0.9" }), _jsx("ellipse", { cx: "50", cy: "42", rx: "12", ry: "16", fill: "#FF6B8A", opacity: "0.85", transform: "rotate(-20 50 42)" }), _jsx("ellipse", { cx: "50", cy: "42", rx: "12", ry: "16", fill: "#FF4D6D", opacity: "0.7", transform: "rotate(20 50 42)" }), _jsx("ellipse", { cx: "50", cy: "50", rx: "10", ry: "14", fill: "#FF8FA3", opacity: "0.8" }), _jsx("line", { x1: "50", y1: "68", x2: "50", y2: "95", stroke: "#50C878", strokeWidth: "2.5" }), _jsx("ellipse", { cx: "44", cy: "80", rx: "8", ry: "4", fill: "#50C878", transform: "rotate(-30 44 80)", opacity: "0.8" })] }) }, rose.id));
            }), _jsx("div", { style: {
                    position: "absolute",
                    inset: 0,
                    background: "radial-gradient(ellipse at center, transparent 40%, rgba(13,13,26,0.6) 100%)",
                    pointerEvents: "none",
                } })] }));
};
