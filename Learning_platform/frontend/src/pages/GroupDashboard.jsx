import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getGroupDashboard } from '../services/api';
import MemberProgressCard from '../components/group/MemberProgressCard';
import GroupLeaderboard from '../components/group/GroupLeaderboard';
import AIGroupInsightPanel from '../components/group/AIGroupInsightPanel';
import { FiArrowLeft } from 'react-icons/fi';
import OverviewTab from '../components/group/OverviewTab';
import LiveStudyRoomTab from '../components/group/LiveStudyRoomTab';
import ChallengesTab from '../components/group/ChallengesTab';
import DoubtBoardTab from '../components/group/DoubtBoardTab';
import GroupSettingsTab from '../components/group/GroupSettingsTab';
import { fetchMe } from '../services/api';
import './GroupDashboard.css';

const GroupDashboard = () => {
    const { groupId } = useParams();
    const navigate = useNavigate();
    const [groupData, setGroupData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('Friends Dashboard');
    const [currentUser, setCurrentUser] = useState(null);

    const fetchDashboard = async () => {
        try {
            const userRes = await fetchMe();
            setCurrentUser(userRes.data);
            const response = await getGroupDashboard(groupId);
            setGroupData(response.data);
        } catch (error) {
            console.error("Failed to fetch group dashboard", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboard();
    }, [groupId]);

    if (loading) {
        return (
            <div className="group-loading">Loading group space...</div>
        );
    }
    
    if (!groupData) {
        return (
            <div className="group-error">Failed to load group.</div>
        );
    }

    const navTabs = [
        "Overview", "Friends Dashboard", "Live Study Room", "Challenges", "Doubt Board", "Settings"
    ];

    return (
            <div className="dashboard-main animate-fade-in" style={{ padding: 0 }}>
                <div className="group-study-space">
                    <header className="group-header">
                        <button 
                            className="btn btn-secondary" 
                            style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', marginBottom: '1.25rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                            onClick={() => navigate('/groups')}
                        >
                            <FiArrowLeft /> Back to Groups
                        </button>
                        
                        <div className="group-header-info">
                            <h1>{groupData.group.name}</h1>
                            <span className="group-badge">Collaborative Workspace</span>
                        </div>
                        <nav className="group-nav">
                            {navTabs.map(tab => (
                                <button
                                    key={tab}
                                    className={`group-nav-btn ${activeTab === tab ? 'active' : ''}`}
                                    onClick={() => setActiveTab(tab)}
                                >
                                    {tab}
                                </button>
                            ))}
                        </nav>
                    </header>

                    <main className="group-main-content">
                        {activeTab === 'Friends Dashboard' && (
                            <div className="friends-dashboard">
                                <section className="dashboard-top-section">
                                    <AIGroupInsightPanel groupId={groupData.group.id} />
                                    <GroupLeaderboard members={groupData.members} />
                                </section>

                                <section className="members-grid">
                                    {groupData.members.map(member => (
                                        <MemberProgressCard
                                            key={member.user_id}
                                            member={member}
                                            groupId={groupData.group.id}
                                        />
                                    ))}
                                </section>
                            </div>
                        )}

                        {activeTab === 'Overview' && <OverviewTab groupData={groupData} />}
                        {activeTab === 'Live Study Room' && <LiveStudyRoomTab groupId={groupData.group.id} />}
                        {activeTab === 'Challenges' && <ChallengesTab groupId={groupData.group.id} />}
                        {activeTab === 'Doubt Board' && <DoubtBoardTab groupId={groupData.group.id} currentMemberId={currentUser?.id} />}
                        {activeTab === 'Settings' && <GroupSettingsTab groupData={groupData} currentUserId={currentUser?.id} onGroupUpdate={fetchDashboard} />}
                    </main>
                </div>
            </div>
    );
};

export default GroupDashboard;
