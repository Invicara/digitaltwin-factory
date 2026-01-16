import React, { useState, useRef, useEffect } from 'react';

const CompareView = ({
    mode = 'overlay',
    orientation = 'horizontal',
    onDividerMove,
    children,
}) => {
    const [dividerPosition, setDividerPosition] = useState(50);
    const [isDragging, setIsDragging] = useState(false);
    const containerRef = useRef();

    const [rightChild, leftChild] = React.Children.toArray(children);

    const updateDivider = (clientX, clientY) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        let newPos;

        if (orientation === 'horizontal') {
            const offsetX = clientX - rect.left;
            newPos = Math.max(0, Math.min(100, (offsetX / rect.width) * 100));
        } else {
            const offsetY = clientY - rect.top;
            newPos = Math.max(0, Math.min(100, (offsetY / rect.height) * 100));
        }

        setDividerPosition(newPos);
        if (onDividerMove) onDividerMove(newPos);
    };

    const handleMouseMove = (e) => {
        if (mode === 'overlay' && isDragging) {
            updateDivider(e.clientX, e.clientY);
        }
    };

    const handleMouseUp = () => {
        if (isDragging) setIsDragging(false);
    };

    useEffect(() => {
        document.addEventListener('mouseup', handleMouseUp);
        return () => document.removeEventListener('mouseup', handleMouseUp);
    }, [isDragging]);

    const isOverlay = mode === 'overlay';

    return (
        <div
            ref={containerRef}
            onMouseMove={handleMouseMove}
            style={{
                position: 'relative',
                display: isOverlay ? 'block' : 'flex',
                flexDirection: orientation === 'horizontal' ? 'row' : 'column',
                width: '100%',
                height: '100%',
                overflow: 'hidden',
            }}
        >

            {mode === 'parallel' && (
                <>
                    <div
                        style={{
                            width: orientation === 'horizontal' ? '50%' : '100%',
                            height: orientation === 'horizontal' ? '100%' : '50%',
                            overflow: 'hidden',
                        }}
                    >
                        {leftChild}
                    </div>

                    <div
                        style={{
                            background: '#ccc',
                            width: orientation === 'horizontal' ? '2px' : '100%',
                            height: orientation === 'horizontal' ? '100%' : '2px',
                            flexShrink: 0,
                        }}
                    />

                    <div
                        style={{
                            width: orientation === 'horizontal' ? '50%' : '100%',
                            height: orientation === 'horizontal' ? '100%' : '50%',
                            overflow: 'hidden',
                        }}
                    >
                        {rightChild}
                    </div>
                </>
            )}

            {isOverlay && (
                <>
                    {/* Bottom layer (left child) */}
                    <div
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            zIndex: 0,
                        }}
                    >
                        {leftChild}
                    </div>

                    {/* Top layer (right child) with mask effect */}
                    <div
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            zIndex: 1,
                            pointerEvents: 'none', // prevent it from blocking mouse drag
                            clipPath:
                                orientation === 'horizontal'
                                    ? `inset(0 ${100 - dividerPosition}% 0 0)`
                                    : `inset(0 0 ${100 - dividerPosition}% 0)`,
                        }}
                    >
                        {rightChild}
                    </div>

                    {/* Divider */}
                    <div
                        onMouseDown={() => setIsDragging(true)}
                        style={{
                            position: 'absolute',
                            background: 'red',
                            width: orientation === 'horizontal' ? '2px' : '100%',
                            height: orientation === 'horizontal' ? '100%' : '2px',
                            left: orientation === 'horizontal' ? `${dividerPosition}%` : 0,
                            top: orientation === 'horizontal' ? 0 : `${dividerPosition}%`,
                            zIndex: 2,
                            cursor: orientation === 'horizontal' ? 'ew-resize' : 'ns-resize',
                        }}
                    />
                </>
            )}

        </div>
    );
};

export default CompareView;
