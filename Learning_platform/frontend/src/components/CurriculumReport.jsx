import React from 'react';
import ReactMarkdown from 'react-markdown';
import './CurriculumReport.css';

const CurriculumReport = ({ courseInfo, topics }) => {
    const totalDays = topics.length;
    const weekCount = Math.ceil(totalDays / 7);

    // Parse content safely
    const parseContent = (raw) => {
        try {
            return JSON.parse(raw);
        } catch {
            return { notes: raw || '', youtube_query: '' };
        }
    };

    // Group topics by week (7 days per week)
    const weeks = [];
    for (let w = 0; w < weekCount; w++) {
        const start = w * 7;
        const end = Math.min(start + 7, totalDays);
        weeks.push({ weekNum: w + 1, days: topics.slice(start, end) });
    }

    return (
        <div className="cr-report" id="ai-pdf-report-content">
            {/* ── Course Header ── */}
            <div className="cr-header">
                <div className="cr-header-left">
                    <div className="cr-logo-row">
                        <span className="cr-logo-icon">🎓</span>
                        <span className="cr-logo-text">Edu<span>Path</span></span>
                    </div>
                    <h1 className="cr-course-title">{courseInfo?.title || 'Your Learning Plan'}</h1>
                    <div className="cr-meta-chips">
                        <span className="cr-chip">📅 {totalDays} days</span>
                        <span className="cr-chip">🗓 {weekCount} Weeks</span>
                        <span className="cr-chip">🎯 Beginner → Advanced</span>
                    </div>
                </div>
            </div>

            {/* ── Course Overview ── */}
            <div className="cr-section">
                <h2 className="cr-section-title">Course Overview</h2>
                <p className="cr-overview-text">
                    This AI-generated curriculum guides you through <strong>{courseInfo?.title}</strong> in {weekCount} structured weeks.
                    Each day includes dedicated study time, concept notes, and hands-on practice exercises designed to build real-world skills progressively.
                </p>
                <div className="cr-stats-row">
                    <div className="cr-stat-box"><div className="cr-stat-label">Level</div><div className="cr-stat-value">Beginner</div></div>
                    <div className="cr-stat-box"><div className="cr-stat-label">Duration</div><div className="cr-stat-value">{weekCount} Weeks ({totalDays} days)</div></div>
                    <div className="cr-stat-box"><div className="cr-stat-label">Total Weeks</div><div className="cr-stat-value">{weekCount}</div></div>
                </div>
            </div>

            {/* ── Weekly Curriculum ── */}
            <div className="cr-section">
                <h2 className="cr-section-title">Course Curriculum</h2>
                <p className="cr-sub-text">Weekly breakdown designed to guide your learning</p>

                {weeks.map(({ weekNum, days }) => (
                    <div key={weekNum} className="cr-week-block">
                        <div className="cr-week-header">
                            <div className="cr-week-badge">Week {weekNum}</div>
                            <span className="cr-week-meta">{days.length} days · {days.length * 2} topics</span>
                        </div>

                        {days.map((topic, di) => {
                            const parsed = parseContent(topic.content);
                            const notes = parsed.notes || '';

                            return (
                                <div key={topic.id} className="cr-day-block">
                                    <div className="cr-day-label">{topic.title}</div>
                                    <div className="cr-notes-body">
                                        <ReactMarkdown
                                            components={{
                                                h1: ({ children }) => <h3 className="cr-md-h3">{children}</h3>,
                                                h2: ({ children }) => <h3 className="cr-md-h3">{children}</h3>,
                                                h3: ({ children }) => <h4 className="cr-md-h4">{children}</h4>,
                                                strong: ({ children }) => <strong className="cr-md-strong">{children}</strong>,
                                                ul: ({ children }) => <ul className="cr-md-ul">{children}</ul>,
                                                ol: ({ children }) => <ol className="cr-md-ol">{children}</ol>,
                                                li: ({ children }) => <li className="cr-md-li">{children}</li>,
                                                p: ({ children }) => <p className="cr-md-p">{children}</p>,
                                            }}
                                        >
                                            {notes}
                                        </ReactMarkdown>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>

            <div className="cr-footer">
                <span>Generated by EduPath AI · {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
        </div>
    );
};

export default CurriculumReport;
