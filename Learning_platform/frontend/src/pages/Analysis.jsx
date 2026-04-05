import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchSkillAnalysis, generateReadiness, fetchProgressReport } from '../services/api';
import {
    Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
    ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell
} from 'recharts';
import { FiMonitor, FiCpu, FiUpload } from 'react-icons/fi';
import './Analysis.css';

const CustomBar = (props) => {
    const { x, y, width, height, fill } = props;
    const radius = 8;
    return (
        <path
            d={`M${x},${y + radius} Q${x},${y} ${x + radius},${y} L${x + width - radius},${y} Q${x + width},${y} ${x + width},${y + radius} L${x + width},${y + height} L${x},${y + height} Z`}
            fill={fill}
        />
    );
};

const Analysis = () => {
    const [data, setData] = useState({ radar_data: [], raw_scores: [] });
    const [readiness, setReadiness] = useState(null);
    const [progress, setProgress] = useState({
        hours_spent_minutes: 0,
        avg_quiz_percent: 0,
        total_topics: 0,
        completed_topics: 0,
        completion_percent: 0,
        monthly_hours: [],
    });
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const currentMonthIndex = (progress?.monthly_hours?.length || 1) - 1;

    useEffect(() => {
        const loadAnalysis = async () => {
            try {
                const [skillData, readinessData, progressData] = await Promise.all([
                    fetchSkillAnalysis(),
                    generateReadiness(),
                    fetchProgressReport()
                ]);
                setData(skillData.data);
                setReadiness(readinessData.data);
                setProgress(progressData.data);
            } catch (err) {
                console.error("Failed to load analysis", err);
            } finally {
                setLoading(false);
            }
        };
        loadAnalysis();
    }, []);

    return (
        <div className="analysis-scroll-area">
            {/* ── Progress Header ── */}
                <div className="progress-header-bar">
                    <h2 className="progress-page-title">Progress</h2>
                    <p className="progress-motivation">
                        Your progress this week is <strong>Awesome</strong>. Let's keep it up and get a lot of points reward!
                    </p>
                </div>

                {/* ── Stat Cards ── */}
                <div className="progress-stats-row">
                    <div className="progress-stat-card">
                        <div className="stat-icon-box">
                            <FiMonitor size={22} />
                        </div>
                        <div className="stat-label">Hours Spent</div>
                        <div className="stat-value">{loading ? '—' : `${Math.round((progress?.hours_spent_minutes || 0) / 60)}h`}</div>
                    </div>
                    <div className="progress-stat-card">
                        <div className="stat-icon-box">
                            <FiCpu size={22} />
                        </div>
                        <div className="stat-label">Test Results</div>
                        <div className="stat-value">{loading ? '—' : `${Math.round(progress?.avg_quiz_percent || 0)}%`}</div>
                    </div>
                    <div className="progress-stat-card">
                        <div className="stat-icon-box">
                            <FiUpload size={22} />
                        </div>
                        <div className="stat-label">Course Completed</div>
                        <div className="stat-value">{loading ? '—' : (progress?.courses_completed || 0)}</div>
                    </div>
                </div>

                {/* ── Time Spendings Chart ── */}
                <div className="time-spendings-card">
                    <div className="ts-card-header">
                        <div>
                            <div className="ts-title">Time Spendings</div>
                            <div className="ts-total">
                                {loading ? 'Loading...' : `${Math.round((progress?.hours_spent_minutes || 0) / 60)}h ${Math.round((progress?.hours_spent_minutes || 0) % 60)}m`}
                                <span className="ts-trend">{loading ? '' : `${Math.round(progress?.completion_percent || 0)}% syllabus completion`}</span>
                            </div>
                        </div>
                        <button className="ts-period-btn">Monthly</button>
                    </div>
                    <div className="ts-chart-wrapper">
                        <ResponsiveContainer width="100%" height={280}>
                            <BarChart data={progress?.monthly_hours || []} barSize={38} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 13 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 13 }} ticks={[0, 200, 400, 600, 800]} />
                                <Tooltip
                                    cursor={{ fill: 'transparent' }}
                                    contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13 }}
                                    formatter={(val) => [`${val}h`, 'Hours']}
                                />
                                <Bar dataKey="hours" shape={<CustomBar />}>
                                    {(progress?.monthly_hours || []).map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={index === currentMonthIndex ? '#4db6ac' : '#d6eeeb'}
                                        />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* ── Existing Skill Analysis ── */}
                {!loading && (
                    <div className="analysis-grid" style={{ marginTop: '2rem' }}>
                        <div className="card chart-card">
                            <h3>Skill Matrix</h3>
                            <div className="chart-wrapper" style={{ width: '100%', height: 350 }}>
                                <ResponsiveContainer>
                                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data.radar_data}>
                                        <PolarGrid />
                                        <PolarAngleAxis dataKey="subject" />
                                        <PolarRadiusAxis angle={30} domain={[0, 100]} />
                                        <Radar name="Your Score" dataKey="A" stroke="#4db6ac" fill="#4db6ac" fillOpacity={0.4} />
                                    </RadarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="card readiness-card">
                            <h3>Career Readiness Index</h3>
                            <div className={`readiness-score ${readiness?.status_category.toLowerCase().replace(' ', '-')}`}>
                                <span className="big-number">{Math.round(readiness?.cri_score || 0)}%</span>
                                <span className="status-badge">{readiness?.status_category}</span>
                            </div>
                            <div className="raw-scores-list">
                                <h4>Detailed Classifications</h4>
                                {data.raw_scores.map(s => (
                                    <div key={s.id} className="score-item">
                                        <span>{s.skill_name.charAt(0).toUpperCase() + s.skill_name.slice(1)}</span>
                                        <span className={`badge ${s.classification.toLowerCase()}`}>{s.classification}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
        </div>
    );
};

export default Analysis;
