import React, { useState } from 'react';
import './GroupLeaderboard.css';

const GroupLeaderboard = ({ members }) => {
    const [filter, setFilter] = useState('This Week');

    // Sort members based on weekly study hours (mocking filter behavior for now)
    const sortedMembers = [...members].sort((a, b) => {
        if (filter === 'Today') return b.today_study_hours - a.today_study_hours;
        // This Week and This Month uses weekly as proxy for now
        return b.weekly_study_hours - a.weekly_study_hours;
    });

    return (
        <div className="group-leaderboard">
            <div className="leaderboard-header">
                <h2>Leaderboard</h2>
                <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="leaderboard-filter"
                >
                    <option>Today</option>
                    <option>This Week</option>
                    <option>This Month</option>
                </select>
            </div>

            <ul className="leaderboard-list">
                {sortedMembers.map((member, index) => (
                    <li key={member.user_id} className={`leaderboard-item rank-${index + 1}`}>
                        <div className="rank">
                            {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                        </div>
                        <img
                            src={member.profile_photo || `https://api.dicebear.com/7.x/initials/svg?seed=${member.name}`}
                            alt={member.name}
                            className="lb-avatar"
                        />
                        <div className="lb-info">
                            <span className="lb-name">{member.name}</span>
                            <span className="lb-streak">{member.current_streak} Day Streak 🔥</span>
                        </div>
                        <div className="lb-score">
                            <strong>{filter === 'Today' ? member.today_study_hours : member.weekly_study_hours}h</strong>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default GroupLeaderboard;
