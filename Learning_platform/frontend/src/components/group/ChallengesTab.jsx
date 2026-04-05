import React, { useState, useEffect } from 'react';
import { getGroupChallenges, createGroupChallenge } from '../../services/api';

const ChallengesTab = ({ groupId }) => {
    const [challenges, setChallenges] = useState([]);
    const [loading, setLoading] = useState(true);
    const [title, setTitle] = useState('');
    const [desc, setDesc] = useState('');

    useEffect(() => {
        fetchChallenges();
    }, [groupId]);

    const fetchChallenges = async () => {
        try {
            const res = await getGroupChallenges(groupId);
            setChallenges(res.data);
        } catch (err) {
            console.error('Failed to get challenges', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await createGroupChallenge(groupId, { title, description: desc });
            setTitle('');
            setDesc('');
            fetchChallenges();
        } catch (err) {
            console.error('Failed to create challenge', err);
        }
    };

    if (loading) return <div>Loading challenges...</div>;

    return (
        <div className="challenges-tab animate-fade-in" style={{ padding: '0', display: 'flex', gap: '2rem' }}>
            <div style={{ flex: 2 }}>
                <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', color: '#0f172a' }}>Active Challenges</h2>
                
                {challenges.length === 0 ? (
                    <div style={{ padding: '2rem', textAlign: 'center', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1', color: '#64748b' }}>
                        No active challenges. Create one to motivate your group!
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {challenges.map(c => (
                            <div key={c.id} style={{ padding: '1.5rem', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', position: 'relative', overflow: 'hidden' }}>
                                <div style={{ position: 'absolute', top: 0, left: 0, w: '100%', height: '4px', background: 'var(--primary)', width: '100%' }}></div>
                                <h3 style={{ margin: '0 0 0.5rem 0', color: '#1e293b' }}>{c.title}</h3>
                                <p style={{ margin: '0 0 1.5rem 0', color: '#64748b', fontSize: '0.9rem' }}>{c.description}</p>
                                
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#64748b', marginBottom: '0.4rem' }}>
                                        <span>Group Progress (Conceptual)</span>
                                        <span>Ends: {new Date(c.expires_at).toLocaleDateString()}</span>
                                    </div>
                                    <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '99px', overflow: 'hidden' }}>
                                        <div style={{ width: '45%', height: '100%', background: '#10b981', borderRadius: '99px' }}></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div style={{ flex: 1 }}>
                <div style={{ padding: '1.5rem', background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem' }}>New Challenge</h3>
                    <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.3rem' }}>Title</label>
                            <input 
                                type="text"
                                className="cyber-input"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                placeholder="e.g. 50 Hours Total"
                                required
                                style={{ padding: '0.6rem' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.3rem' }}>Description</label>
                            <textarea 
                                className="cyber-input"
                                value={desc}
                                onChange={e => setDesc(e.target.value)}
                                placeholder="Describe the goal..."
                                required
                                rows={3}
                                style={{ padding: '0.6rem', resize: 'vertical' }}
                            />
                        </div>
                        <button type="submit" className="btn" style={{ width: '100%', padding: '0.6rem' }}>Create</button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ChallengesTab;
