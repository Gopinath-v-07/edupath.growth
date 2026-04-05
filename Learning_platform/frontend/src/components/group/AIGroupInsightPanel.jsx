import React, { useEffect, useState } from 'react';
import { getGroupInsights } from '../../services/api';
import './AIGroupInsightPanel.css';

const AIGroupInsightPanel = ({ groupId }) => {
    const [insights, setInsights] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchInsights = async () => {
            try {
                const response = await getGroupInsights(groupId);
                setInsights(response.data);
            } catch (error) {
                console.error("Failed to load insights", error);
            } finally {
                setLoading(false);
            }
        };
        fetchInsights();
    }, [groupId]);

    if (loading) {
        return <div className="ai-insight-panel skeleton">Loading AI Insights...</div>;
    }

    if (!insights) {
        return null;
    }

    return (
        <div className="ai-insight-panel">
            <div className="insight-header">
                <span className="insight-icon">🤖</span>
                <h2>AI Group Insights</h2>
            </div>

            <div className="insight-content">
                <p className="motivation-text">"{insights.motivation_message}"</p>

                <div className="insight-grid">
                    <div className="insight-card positive">
                        <h4>Group Strength</h4>
                        <p>{insights.group_strength}</p>
                    </div>
                    <div className="insight-card focus">
                        <h4>Focus Area</h4>
                        <p>{insights.weak_topic}</p>
                    </div>
                    <div className="insight-card stellar">
                        <h4>MVP</h4>
                        <p>{insights.most_consistent_member}</p>
                    </div>
                </div>

                <div className="suggestion-box">
                    <strong>Suggestion:</strong> {insights.improvement_suggestion}
                </div>
            </div>
        </div>
    );
};

export default AIGroupInsightPanel;
