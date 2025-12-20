import { useState, useEffect } from 'react';

interface WorkflowActiveViewProps {
    frequency: string;
    selectedDay: string;
    selectedTime: string;
    channels: { id: string; name: string; enabled: boolean }[];
    onPause: () => void;
    onStop: () => void;
    onViewStats: () => void;
}

const FREQUENCY_LABELS: Record<string, string> = {
    'week': 'week',
    '2weeks': '2 weeks',
    'month': 'month',
};

export function WorkflowActiveView({
    frequency,
    onStop,
}: WorkflowActiveViewProps) {
    const [, setIsDarkMode] = useState(true);

    useEffect(() => {
        const checkDarkMode = () => {
            setIsDarkMode(document.documentElement.classList.contains('dark'));
        };
        checkDarkMode();
        const observer = new MutationObserver(checkDarkMode);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        return () => observer.disconnect();
    }, []);

    const frequencyLabel = FREQUENCY_LABELS[frequency] || frequency;

    // All dimensions based on the mockup (in card-relative pixels)
    // Card width: 340px
    // Node width: ~160px, height: 36px
    // Center X: 170 (half of card width)

    return (
        <div className="min-h-full w-full" style={{ background: '#0a0a12' }}>
            {/* Ambient glow behind card */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                    style={{
                        width: '600px',
                        height: '700px',
                        background: 'radial-gradient(ellipse, rgba(139, 92, 246, 0.35) 0%, rgba(99, 102, 241, 0.15) 40%, transparent 70%)',
                    }}
                />
            </div>

            <div className="flex items-center justify-center min-h-screen p-8 relative z-10">
                {/* Main card */}
                <div
                    className="relative rounded-2xl"
                    style={{
                        width: '340px',
                        padding: '24px 20px 32px 20px',
                        background: 'linear-gradient(180deg, rgba(18, 16, 35, 0.97) 0%, rgba(10, 8, 22, 0.99) 100%)',
                        border: '1.5px solid rgba(139, 92, 246, 0.4)',
                        boxShadow: `
              0 0 80px rgba(139, 92, 246, 0.3),
              0 0 120px rgba(99, 102, 241, 0.2),
              inset 0 1px 0 rgba(255, 255, 255, 0.04)
            `
                    }}
                >
                    {/* Active badge */}
                    <div className="flex justify-center mb-4">
                        <div
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full"
                            style={{
                                background: 'rgba(34, 197, 94, 0.1)',
                                border: '1px solid rgba(34, 197, 94, 0.4)'
                            }}
                        >
                            <div
                                className="w-2 h-2 rounded-full"
                                style={{
                                    background: '#22c55e',
                                    boxShadow: '0 0 8px #22c55e, 0 0 12px #22c55e'
                                }}
                            />
                            <span className="text-xs font-medium" style={{ color: '#4ade80' }}>Active</span>
                        </div>
                    </div>

                    {/* Title */}
                    <h2 className="text-center text-lg font-semibold mb-6">
                        <span className="text-white">Email Automation:</span>{' '}
                        <span style={{ color: '#9ca3af' }}>Cold Outreach</span>
                    </h2>

                    {/* Flowchart - exact mockup proportions */}
                    <div className="relative" style={{ height: '420px' }}>
                        <svg
                            className="absolute top-0 left-0 w-full h-full pointer-events-none"
                            viewBox="0 0 300 420"
                            preserveAspectRatio="xMidYMid meet"
                        >
                            <defs>
                                {/* Gradient for purple lines */}
                                <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <stop offset="0%" stopColor="#a855f7" />
                                    <stop offset="100%" stopColor="#8b5cf6" />
                                </linearGradient>

                                {/* Diamond fill gradient */}
                                <linearGradient id="diamondGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#c084fc" />
                                    <stop offset="100%" stopColor="#9333ea" />
                                </linearGradient>

                                {/* Glow filter */}
                                <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                                    <feGaussianBlur stdDeviation="2.5" result="blur" />
                                    <feMerge>
                                        <feMergeNode in="blur" />
                                        <feMergeNode in="SourceGraphic" />
                                    </feMerge>
                                </filter>

                                {/* Stronger glow for diamond */}
                                <filter id="diamondGlow" x="-100%" y="-100%" width="300%" height="300%">
                                    <feGaussianBlur stdDeviation="8" result="blur" />
                                    <feMerge>
                                        <feMergeNode in="blur" />
                                        <feMergeNode in="SourceGraphic" />
                                    </feMerge>
                                </filter>
                            </defs>

                            {/* ===== MAIN VERTICAL FLOW LINES ===== */}
                            {/* Entry line into Find Leads (from above) */}
                            <line x1="150" y1="0" x2="150" y2="18" stroke="url(#lineGradient)" strokeWidth="3" filter="url(#glow)" />

                            {/* Find Leads → Send Email */}
                            <line x1="150" y1="54" x2="150" y2="75" stroke="url(#lineGradient)" strokeWidth="3" filter="url(#glow)" />

                            {/* Send Email → Wait 3 Days */}
                            <line x1="150" y1="111" x2="150" y2="132" stroke="url(#lineGradient)" strokeWidth="3" filter="url(#glow)" />

                            {/* Wait 3 Days → Check Reply Diamond */}
                            <line x1="150" y1="168" x2="150" y2="212" stroke="url(#lineGradient)" strokeWidth="3" filter="url(#glow)" />

                            {/* Diamond → Follow Up */}
                            <line x1="150" y1="288" x2="150" y2="335" stroke="url(#lineGradient)" strokeWidth="3" filter="url(#glow)" />

                            {/* ===== NO REPLY BRANCH ===== */}
                            {/* From diamond right side, curves down to Follow Up right side */}
                            <path
                                d="M 185 250 
                   L 230 250 
                   Q 255 250 255 275 
                   L 255 355 
                   Q 255 375 230 375 
                   L 210 375"
                                fill="none"
                                stroke="url(#lineGradient)"
                                strokeWidth="3"
                                filter="url(#glow)"
                            />

                            {/* "No Reply" label */}
                            <text x="230" y="232" fill="#9ca3af" fontSize="11" fontWeight="500" textAnchor="middle">No Reply</text>

                            {/* ===== LEFT SIDE REPEAT LOOP ===== */}
                            {/* Dashed curved line from below Follow Up, going left, up, and back to top */}
                            <path
                                d="M 90 375 
                   Q 35 375 35 320 
                   L 35 55 
                   Q 35 18 85 18"
                                fill="none"
                                stroke="#6366f1"
                                strokeWidth="2.5"
                                strokeDasharray="8 5"
                                strokeLinecap="round"
                                opacity="0.75"
                            />

                            {/* Arrow pointing right at top of loop */}
                            <polygon points="83,10 83,26 98,18" fill="#6366f1" opacity="0.75" />

                            {/* Repeat label pill */}
                            <rect x="2" y="185" width="90" height="24" rx="12"
                                fill="rgba(10, 8, 20, 0.95)"
                                stroke="rgba(99, 102, 241, 0.5)"
                                strokeWidth="1.5" />
                            <text x="47" y="202" fill="#a5b4fc" fontSize="10" textAnchor="middle" fontWeight="500">
                                Repeat every {frequencyLabel}
                            </text>

                            {/* ===== CHECK REPLY DIAMOND ===== */}
                            <g transform="translate(150, 250)">
                                {/* Diamond glow */}
                                <rect
                                    x="-28" y="-28"
                                    width="56" height="56"
                                    rx="10"
                                    fill="url(#diamondGrad)"
                                    transform="rotate(45)"
                                    filter="url(#diamondGlow)"
                                    opacity="0.5"
                                />
                                {/* Diamond shape */}
                                <rect
                                    x="-26" y="-26"
                                    width="52" height="52"
                                    rx="9"
                                    fill="url(#diamondGrad)"
                                    transform="rotate(45)"
                                />
                                {/* Question mark inside */}
                                <text x="0" y="8" fill="white" fontSize="24" textAnchor="middle" fontWeight="600" fontFamily="system-ui">?</text>
                            </g>

                            {/* "Check Reply" label below diamond */}
                            <text x="150" y="305" fill="white" fontSize="11" textAnchor="middle" fontWeight="500">Check</text>
                            <text x="150" y="320" fill="white" fontSize="11" textAnchor="middle" fontWeight="500">Reply</text>
                        </svg>

                        {/* ===== NODES ===== */}
                        {/* Find Leads */}
                        <div
                            className="absolute left-1/2 -translate-x-1/2"
                            style={{
                                top: '18px',
                                width: '160px',
                                height: '36px',
                                borderRadius: '18px',
                                background: 'linear-gradient(135deg, rgba(50, 45, 75, 0.92) 0%, rgba(35, 30, 55, 0.95) 100%)',
                                border: '1px solid rgba(140, 120, 180, 0.2)',
                                boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
                                display: 'flex',
                                alignItems: 'center',
                                padding: '0 14px',
                                gap: '10px'
                            }}
                        >
                            <div style={{
                                width: '26px',
                                height: '26px',
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, #c084fc 0%, #a855f7 100%)',
                                boxShadow: '0 0 12px rgba(168, 85, 247, 0.6)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0
                            }}>
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="11" cy="11" r="8" />
                                    <path d="m21 21-4.35-4.35" />
                                </svg>
                            </div>
                            <span className="text-white font-medium text-sm">Find Leads</span>
                        </div>

                        {/* Send Email */}
                        <div
                            className="absolute left-1/2 -translate-x-1/2"
                            style={{
                                top: '75px',
                                width: '160px',
                                height: '36px',
                                borderRadius: '18px',
                                background: 'linear-gradient(135deg, rgba(50, 45, 75, 0.92) 0%, rgba(35, 30, 55, 0.95) 100%)',
                                border: '1px solid rgba(140, 120, 180, 0.2)',
                                boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
                                display: 'flex',
                                alignItems: 'center',
                                padding: '0 14px',
                                gap: '10px'
                            }}
                        >
                            <div style={{
                                width: '26px',
                                height: '26px',
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, #c084fc 0%, #a855f7 100%)',
                                boxShadow: '0 0 12px rgba(168, 85, 247, 0.6)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0
                            }}>
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <rect width="20" height="16" x="2" y="4" rx="2" />
                                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                                </svg>
                            </div>
                            <span className="text-white font-medium text-sm">Send Email</span>
                        </div>

                        {/* Wait 3 Days */}
                        <div
                            className="absolute left-1/2 -translate-x-1/2"
                            style={{
                                top: '132px',
                                width: '160px',
                                height: '36px',
                                borderRadius: '18px',
                                background: 'linear-gradient(135deg, rgba(50, 45, 75, 0.92) 0%, rgba(35, 30, 55, 0.95) 100%)',
                                border: '1px solid rgba(140, 120, 180, 0.2)',
                                boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
                                display: 'flex',
                                alignItems: 'center',
                                padding: '0 14px',
                                gap: '10px'
                            }}
                        >
                            <div style={{
                                width: '26px',
                                height: '26px',
                                borderRadius: '50%',
                                background: 'transparent',
                                border: '2px solid #a855f7',
                                boxShadow: '0 0 10px rgba(168, 85, 247, 0.4)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0
                            }}>
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#c084fc" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10" />
                                    <polyline points="12 6 12 12 16 14" />
                                </svg>
                            </div>
                            <span className="text-white font-medium text-sm">Wait 3 Days</span>
                        </div>

                        {/* Follow Up */}
                        <div
                            className="absolute left-1/2 -translate-x-1/2"
                            style={{
                                top: '357px',
                                width: '160px',
                                height: '36px',
                                borderRadius: '18px',
                                background: 'linear-gradient(135deg, rgba(50, 45, 75, 0.92) 0%, rgba(35, 30, 55, 0.95) 100%)',
                                border: '1px solid rgba(140, 120, 180, 0.2)',
                                boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
                                display: 'flex',
                                alignItems: 'center',
                                padding: '0 14px',
                                gap: '10px'
                            }}
                        >
                            <div style={{
                                width: '26px',
                                height: '26px',
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, #c084fc 0%, #a855f7 100%)',
                                boxShadow: '0 0 12px rgba(168, 85, 247, 0.6)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0
                            }}>
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <rect width="20" height="16" x="2" y="4" rx="2" />
                                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                                </svg>
                            </div>
                            <span className="text-white font-medium text-sm">Follow Up</span>
                        </div>
                    </div>

                    {/* Stop button */}
                    <div className="flex justify-center mt-4">
                        <button
                            onClick={onStop}
                            className="px-6 py-2.5 rounded-full font-medium text-sm transition-all duration-200 hover:scale-105 active:scale-95"
                            style={{
                                background: 'rgba(239, 68, 68, 0.12)',
                                border: '1px solid rgba(239, 68, 68, 0.4)',
                                color: '#fca5a5'
                            }}
                        >
                            Stop Workflow
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
