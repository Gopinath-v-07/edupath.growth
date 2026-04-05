import React from 'react';

const OverviewTab = ({ groupData }) => {
    if (!groupData) return null;

    return (
        <div className="overview-tab animate-fade-in" style={{ padding: '1rem', background: 'white', borderRadius: '16px', border: '1px solid var(--border)' }}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', color: '#0f172a' }}>Group Overview</h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                <div style={{ background: '#f8fafc', padding: '1.2rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <h4 style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>Total Members</h4>
                    <p style={{ margin: '0.5rem 0 0 0', fontSize: '1.5rem', fontWeight: 'bold', color: '#3B82F6' }}>
                        {groupData.members.length}
                    </p>
                </div>
                <div style={{ background: '#f8fafc', padding: '1.2rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <h4 style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>Group Formed</h4>
                    <p style={{ margin: '0.5rem 0 0 0', fontSize: '1.2rem', fontWeight: 'bold', color: '#10B981' }}>
                        {new Date(groupData.group.created_at || Date.now()).toLocaleDateString()}
                    </p>
                </div>
            </div>

            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: '#1e293b' }}>Recent Member Activity</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {groupData.members.slice(0, 5).map((m, i) => (
                    <div key={m.user_id || i} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                        <img src={m.profile_photo || `https://api.dicebear.com/7.x/initials/svg?seed=${m.name}`} alt="avatar" style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
                        <div>
                            <p style={{ margin: 0, fontWeight: 'bold', fontSize: '0.9rem' }}>{m.name}</p>
                            <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>Studied {m.today_study_hours} hours today</p>
                        </div>
                        <div style={{ marginLeft: 'auto' }}>
                            <span style={{ fontSize: '0.75rem', background: '#eff6ff', color: '#3b82f6', padding: '0.2rem 0.6rem', borderRadius: '99px' }}>
                                Streak: {m.current_streak} days
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default OverviewTab;
