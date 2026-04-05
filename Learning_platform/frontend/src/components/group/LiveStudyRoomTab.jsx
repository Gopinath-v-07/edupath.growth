import React, { useState, useEffect } from 'react';
import { addStudyLog } from '../../services/api';

const LiveStudyRoomTab = ({ groupId }) => {
    const [timeLeft, setTimeLeft] = useState(25 * 60);
    const [isRunning, setIsRunning] = useState(false);
    const [mode, setMode] = useState('focus'); // focus, break

    useEffect(() => {
        let interval;
        if (isRunning && timeLeft > 0) {
            interval = setInterval(() => setTimeLeft((t) => t - 1), 1000);
        } else if (timeLeft === 0) {
            handleComplete();
        }
        return () => clearInterval(interval);
    }, [isRunning, timeLeft]);

    const handleComplete = async () => {
        setIsRunning(false);
        if (mode === 'focus') {
            alert('Focus session complete! Logging 25 minutes to group stats.');
            try {
                await addStudyLog(groupId, { topic: 'Live Group Space', duration_minutes: 25 });
            } catch (err) {
                console.error('Failed to log time', err);
            }
            setMode('break');
            setTimeLeft(5 * 60);
        } else {
            alert('Break complete! Ready to focus?');
            setMode('focus');
            setTimeLeft(25 * 60);
        }
    };

    const toggleTimer = () => setIsRunning(!isRunning);

    const resetTimer = () => {
        setIsRunning(false);
        setTimeLeft(mode === 'focus' ? 25 * 60 : 5 * 60);
    };

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    return (
        <div className="live-study-tab animate-fade-in" style={{ padding: '2rem', background: '#fff', borderRadius: '16px', border: '1px solid var(--border)', textAlign: 'center' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: '#0f172a' }}>Live Focus Space</h2>
            <p style={{ color: '#64748b', marginBottom: '2rem' }}>Synchronize your study blocks with the group.</p>

            <div style={{ display: 'inline-block', background: mode === 'focus' ? '#eff6ff' : '#ecfdf5', padding: '3rem 5rem', borderRadius: '24px', border: `2px solid ${mode === 'focus' ? '#3b82f6' : '#10b981'}` }}>
                <h3 style={{ margin: '0 0 1rem 0', color: mode === 'focus' ? '#1d4ed8' : '#047857', textTransform: 'uppercase', letterSpacing: '2px', fontSize: '0.9rem' }}>
                    {mode === 'focus' ? 'Deep Focus' : 'Short Break'}
                </h3>
                <div style={{ fontSize: '5rem', fontWeight: '800', color: '#0f172a', fontFamily: 'monospace', lineHeight: 1 }}>
                    {formatTime(timeLeft)}
                </div>
                
                <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                    <button onClick={toggleTimer} className="btn" style={{ background: mode === 'focus' ? '#3b82f6' : '#10b981', color: 'white', minWidth: '120px' }}>
                        {isRunning ? 'Pause' : 'Start'}
                    </button>
                    <button onClick={resetTimer} className="btn btn-secondary">
                        Reset
                    </button>
                </div>
            </div>

            <div style={{ marginTop: '3rem', padding: '1.5rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', textAlign: 'left' }}>
                <h4 style={{ margin: '0 0 0.5rem 0' }}>Who is here?</h4>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ padding: '0.5rem 1rem', background: '#dcfce7', color: '#166534', borderRadius: '99px', fontSize: '0.85rem', fontWeight: 'bold' }}>🟢 You are in the room</div>
                    <span style={{ fontSize: '0.85rem', color: '#64748b' }}>(Other members will appear here when active in WebRTC Phase 2)</span>
                </div>
            </div>
        </div>
    );
};

export default LiveStudyRoomTab;
