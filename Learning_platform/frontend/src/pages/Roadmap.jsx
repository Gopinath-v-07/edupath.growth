import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import ProgressBar from '../components/ProgressBar';
import html2pdf from 'html2pdf.js';
import CurriculumReport from '../components/CurriculumReport';
import { FiLock, FiStar, FiCheck, FiArrowLeft, FiChevronDown, FiChevronUp, FiDownload, FiMail } from 'react-icons/fi';
import './Roadmap.css';

const Roadmap = () => {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const [courseInfo, setCourseInfo] = useState(null);
    const [topics, setTopics] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('game'); // 'game' or 'summary'
    const [expandedTopicId, setExpandedTopicId] = useState(null);
    const [emailStatus, setEmailStatus] = useState('idle'); // idle, sending, sent, error

    useEffect(() => {
        const fetchRoadmap = async () => {
            try {
                const { data: coursesData } = await api.get('/roadmap/courses');
                const course = coursesData.courses.find(c => c.id === parseInt(courseId));
                setCourseInfo(course);

                const { data: topicsData } = await api.get(`/roadmap/course/${courseId}/topics`);
                setTopics(topicsData.topics || []);
            } catch (error) {
                console.error("Error fetching roadmap", error);
            } finally {
                setLoading(false);
            }
        };
        fetchRoadmap();
    }, [courseId]);

    if (loading) return <div className="page-container" style={{ textAlign: 'center', marginTop: '4rem' }}>Loading your map...</div>;

    const progress = courseInfo?.total_topics > 0
        ? (courseInfo.completed_topics / courseInfo.total_topics) * 100
        : 0;

    // Candy Crush Style Path Calculations
    const rowHeight = 140;
    const containerWidth = 340;
    const centerX = containerWidth / 2;
    const amplitude = 110;

    const nodeCoords = topics.map((_, index) => {
        const y = index * rowHeight + 80;
        const x = centerX + Math.sin(index * (Math.PI / 2)) * amplitude;
        return { x, y };
    });

    const totalHeight = topics.length > 0 ? nodeCoords[topics.length - 1].y + 120 : 400;

    let svgPath = '';
    if (nodeCoords.length > 0) {
        svgPath = `M ${nodeCoords[0].x} ${nodeCoords[0].y}`;
        for (let i = 0; i < nodeCoords.length - 1; i++) {
            const p1 = nodeCoords[i];
            const p2 = nodeCoords[i + 1];
            // Control points for a smooth vertical S-curve
            const ctrlY = (p1.y + p2.y) / 2;
            svgPath += ` C ${p1.x} ${ctrlY}, ${p2.x} ${ctrlY}, ${p2.x} ${p2.y}`;
        }
    }

    const handleSendEmail = async () => {
        const element = document.getElementById('ai-pdf-report-content');
        if (!element) return;

        setEmailStatus('sending');
        try {
            const opt = {
                margin:       0.5,
                filename:     'report.pdf',
                image:        { type: 'jpeg', quality: 0.98 },
                html2canvas:  { scale: 2 },
                jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
            };

            // Generate PDF as blob instead of downloading
            const pdfBlob = await html2pdf().set(opt).from(element).output('blob');

            // Create form data
            const formData = new FormData();
            formData.append('file', pdfBlob, 'Curriculum_Report.pdf');
            formData.append('course_title', courseInfo?.title || 'Learning Plan');

            await api.post('/email/send-pdf', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            setEmailStatus('sent');
            setTimeout(() => setEmailStatus('idle'), 3000);
        } catch (err) {
            console.error('Failed to send email:', err);
            setEmailStatus('error');
            setTimeout(() => setEmailStatus('idle'), 3000);
        }
    };

    const handleDownloadReport = () => {
        const element = document.getElementById('ai-pdf-report-content');
        if (!element) return;

        const opt = {
            margin:       0.5,
            filename:     `${courseInfo?.title?.replace(/\s+/g, '_') || 'Learning_Plan'}.pdf`,
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2 },
            jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
        };

        html2pdf().set(opt).from(element).save();
    };

    const btnStyle = {
        display: 'flex', alignItems: 'center', gap: '0.4rem',
        padding: '0.45rem 0.9rem', borderRadius: '8px', cursor: 'pointer',
        fontSize: '0.82rem', fontWeight: 700, whiteSpace: 'nowrap',
        background: '#FFFFFF', color: '#475569',
        border: '1.5px solid #CBD5E1', transition: 'all 0.2s',
        boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
    };

    return (
        <div className="roadmap-game-container animate-fade-in">
            <header className="roadmap-header">
                {/* Back button */}
                <button className="roadmap-back-btn" onClick={() => navigate('/dashboard')}>
                    <FiArrowLeft /> Dashboard
                </button>

                {/* Title + Toggle — centered, flex: 1 */}
                <div className="roadmap-title-area">
                    <h2 className="game-title">{courseInfo?.title || "Your Learning Map"}</h2>
                    <div className="view-toggle">
                        <button
                            className={`toggle-btn ${viewMode === 'game' ? 'active' : ''}`}
                            onClick={() => setViewMode('game')}
                        >
                            Game View
                        </button>
                        <button
                            className={`toggle-btn ${viewMode === 'summary' ? 'active' : ''}`}
                            onClick={() => setViewMode('summary')}
                        >
                            Plan Summary
                        </button>
                    </div>
                </div>

                {/* Right-side actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginLeft: 'auto' }}>
                    {viewMode === 'summary' && (
                        <div style={{ display: 'flex', gap: '0.6rem' }}>
                            <button
                                onClick={handleDownloadReport}
                                style={btnStyle}
                                onMouseEnter={e => { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.borderColor = '#94A3B8'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = '#FFFFFF'; e.currentTarget.style.borderColor = '#CBD5E1'; }}
                            >
                                <FiDownload size={13}/> Download PDF
                            </button>
                            <button
                                onClick={handleSendEmail}
                                disabled={emailStatus !== 'idle'}
                                style={{
                                    ...btnStyle,
                                    cursor: emailStatus !== 'idle' ? 'default' : 'pointer',
                                    opacity: emailStatus === 'sending' ? 0.7 : 1,
                                    color: emailStatus === 'sent' ? '#10B981' : emailStatus === 'error' ? '#EF4444' : '#475569',
                                    borderColor: emailStatus === 'sent' ? '#10B981' : emailStatus === 'error' ? '#EF4444' : '#CBD5E1',
                                }}
                                onMouseEnter={e => { if(emailStatus === 'idle') { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.borderColor = '#94A3B8'; } }}
                                onMouseLeave={e => { if(emailStatus === 'idle') { e.currentTarget.style.background = '#FFFFFF'; e.currentTarget.style.borderColor = '#CBD5E1'; } }}
                            >
                                {emailStatus === 'idle' && <><FiMail size={13}/> Email Report</>}
                                {emailStatus === 'sending' && '📨 Sending...'}
                                {emailStatus === 'sent' && <><FiCheck size={13}/> Sent!</>}
                                {emailStatus === 'error' && '⚠ Retry'}
                            </button>
                        </div>
                    )}

                    {/* Mastery progress */}
                    <div
                        className="progress-section game-progress"
                        onClick={() => navigate('/dashboard')}
                        title="Go to Dashboard"
                        style={{ cursor: 'pointer', margin: 0 }}
                    >
                        <span className="mastery-text">{Math.round(progress)}% Mastery</span>
                        <ProgressBar progress={progress} height="8px" />
                    </div>
                </div>
            </header>


            {viewMode === 'game' ? (
                <div className="game-board" style={{ height: `${totalHeight}px`, width: `${containerWidth}px` }}>
                    {/* SVG Tracks */}
                <svg
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 }}
                >
                    <path d={svgPath} fill="none" stroke="#e0e0e0" strokeWidth="24" strokeLinecap="round" strokeLinejoin="round" />
                    <path d={svgPath} fill="none" stroke="#fff" strokeWidth="18" strokeLinecap="round" strokeLinejoin="round" />
                    <path d={svgPath} fill="none" stroke="#ff5252" strokeWidth="18" strokeDasharray="20 20" strokeLinecap="round" strokeLinejoin="round" />
                </svg>

                {/* Nodes */}
                {topics.map((topic, index) => {
                    const coords = nodeCoords[index];
                    let statusClass = 'locked';
                    if (topic.is_completed) statusClass = 'completed';
                    else if (topic.is_unlocked) statusClass = 'active';

                    let labelClass = 'label-right';
                    if (coords.x > centerX) labelClass = 'label-left';
                    else if (coords.x < centerX) labelClass = 'label-right';
                    else labelClass = index % 2 === 0 ? 'label-right' : 'label-left';

                    return (
                        <div
                            key={topic.id}
                            className="absolute-node"
                            style={{
                                left: `${coords.x - 40}px`,
                                top: `${coords.y - 40}px`
                            }}
                        >
                            <div
                                className={`game-level-button ${statusClass}`}
                                onClick={() => topic.is_unlocked && navigate(`/topic/${topic.id}`)}
                            >
                                <div className="level-number">
                                    {statusClass === 'completed' ? <FiCheck strokeWidth={3} /> : statusClass === 'locked' ? <FiLock /> : index + 1}
                                </div>

                                {statusClass === 'completed' && (
                                    <div className="stars">
                                        <FiStar fill="#FFD700" color="#FFD700" size={16} />
                                        <FiStar fill="#FFD700" color="#FFD700" size={16} />
                                        <FiStar fill="#FFD700" color="#FFD700" size={16} />
                                    </div>
                                )}
                            </div>
                            <div className={`node-title-label ${labelClass}`}>
                                {topic.title}
                            </div>
                        </div>
                    );
                })}
            </div>
            ) : (
                <div className="summary-list" style={{ marginTop: '1rem' }}>
                    <CurriculumReport courseInfo={courseInfo} topics={topics} />
                </div>
            )}
        </div>
    );
};

export default Roadmap;
