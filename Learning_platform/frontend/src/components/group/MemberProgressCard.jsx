import React from 'react';
import LiveStatusIndicator from './LiveStatusIndicator';
import './MemberProgressCard.css';

const MemberProgressCard = ({ member, groupId }) => {
    // Determine live status from elsewhere, mocking for now
    const liveStatus = member.current_streak > 0 ? "Studying" : "Offline";

    return (
        <div className="member-progress-card">
            <div className="card-header">
                <img
                    src={member.profile_photo || `https://api.dicebear.com/7.x/initials/svg?seed=${member.name}`}
                    alt={member.name}
                    className="profile-avatar"
                />
                <div className="member-info">
                    <h3>{member.name}</h3>
                    <LiveStatusIndicator groupId={groupId} userId={member.user_id} initialStatus={liveStatus} />
                </div>
            </div>

            <div className="card-body">
                <div className="stat-row">
                    <span className="stat-label">Goal:</span>
                    <span className="stat-value goal">{member.goal}</span>
                </div>

                <div className="stat-grid">
                    <div className="stat-box">
                        <span className="box-val">{member.today_study_hours}h</span>
                        <span className="box-label">Today</span>
                    </div>
                    <div className="stat-box">
                        <span className="box-val">{member.current_streak}</span>
                        <span className="box-label">Streak 🔥</span>
                    </div>
                </div>

                <div className="progress-section">
                    <div className="progress-header">
                        <span>Weekly Progress</span>
                        <span>{member.weekly_completion_percentage}%</span>
                    </div>
                    <div className="progress-bar-bg">
                        <div
                            className="progress-bar-fill"
                            style={{ width: `${member.weekly_completion_percentage}%` }}
                        ></div>
                    </div>
                </div>

                <div className="strength-topic">
                    <span className="topic-icon">💡</span>
                    <div className="topic-text">
                        <small>Strongest Topic</small>
                        <strong>{member.strongest_topic}</strong>
                    </div>
                </div>
            </div>

            <div className="card-actions">
                <button className="action-btn ping-btn">👋 Ping</button>
                <button className="action-btn invite-btn">Invite to Live Room</button>
            </div>
        </div>
    );
};

export default MemberProgressCard;
