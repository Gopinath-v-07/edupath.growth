import React, { useState, useEffect } from 'react';
import { getGroupDoubts, createGroupDoubt, replyToGroupDoubt, resolveGroupDoubt } from '../../services/api';

const DoubtBoardTab = ({ groupId, currentMemberId }) => {
    const [doubts, setDoubts] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // New doubt state
    const [title, setTitle] = useState('');
    const [desc, setDesc] = useState('');
    const [isPosting, setIsPosting] = useState(false);

    // Reply state
    const [replyContents, setReplyContents] = useState({});

    useEffect(() => {
        fetchDoubts();
    }, [groupId]);

    const fetchDoubts = async () => {
        try {
            const res = await getGroupDoubts(groupId);
            setDoubts(res.data);
        } catch (err) {
            console.error('Failed to get doubts', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateDoubt = async (e) => {
        e.preventDefault();
        setIsPosting(true);
        try {
            await createGroupDoubt(groupId, { title, description: desc });
            setTitle('');
            setDesc('');
            fetchDoubts();
        } catch (err) {
            console.error('Failed to post doubt', err);
        } finally {
            setIsPosting(false);
        }
    };

    const handleReply = async (doubtId) => {
        const content = replyContents[doubtId];
        if (!content || !content.trim()) return;

        try {
            await replyToGroupDoubt(groupId, doubtId, { content });
            setReplyContents({ ...replyContents, [doubtId]: '' });
            fetchDoubts();
        } catch (err) {
            console.error('Failed to reply', err);
        }
    };

    const handleResolve = async (doubtId) => {
        try {
            await resolveGroupDoubt(groupId, doubtId);
            fetchDoubts();
        } catch (err) {
            console.error('Failed to resolve doubt', err);
        }
    };

    if (loading) return <div>Loading doubt board...</div>;

    return (
        <div className="doubt-board-tab animate-fade-in" style={{ padding: 0 }}>
            
            {/* Post Area */}
            <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--border)', marginBottom: '2rem' }}>
                <h3 style={{ margin: '0 0 1rem 0', color: '#0f172a' }}>Ask a Question</h3>
                <form onSubmit={handleCreateDoubt} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <input 
                        type="text" 
                        className="cyber-input" 
                        placeholder="What's your question about?" 
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        required
                    />
                    <textarea 
                        className="cyber-input" 
                        placeholder="Provide details..." 
                        rows={3}
                        value={desc}
                        onChange={e => setDesc(e.target.value)}
                        required
                        style={{ resize: 'vertical' }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button type="submit" className="btn" disabled={isPosting}>
                            {isPosting ? 'Posting...' : 'Post Doubt'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Questions List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {doubts.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b', background: '#f8fafc', borderRadius: '12px' }}>
                        No questions yet. Be the first to ask!
                    </div>
                ) : (
                    doubts.map(doubt => (
                        <div key={doubt.id} style={{ background: '#fff', borderRadius: '16px', border: doubt.is_resolved ? '1px solid #10b981' : '1px solid var(--border)', overflow: 'hidden' }}>
                            {/* Question Header */}
                            <div style={{ padding: '1.25rem', borderBottom: '1px solid #e2e8f0', background: doubt.is_resolved ? '#ecfdf5' : 'transparent' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                                    <h4 style={{ margin: 0, fontSize: '1.1rem', color: '#0f172a', fontWeight: 'bold' }}>
                                        {doubt.is_resolved && <span style={{ color: '#10b981', marginRight: '0.5rem' }}>✓ Resolved</span>}
                                        {doubt.title}
                                    </h4>
                                    {!doubt.is_resolved && (
                                        <button onClick={() => handleResolve(doubt.id)} className="btn-secondary btn-sm" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}>
                                            Mark Resolved
                                        </button>
                                    )}
                                </div>
                                <p style={{ margin: '0 0 1rem 0', color: '#4b5563', fontSize: '0.95rem' }}>{doubt.description}</p>
                                <div style={{ fontSize: '0.8rem', color: '#9ca3af' }}>
                                    Asked by <strong style={{ color: '#64748b' }}>{doubt.user_name}</strong> on {new Date(doubt.created_at).toLocaleDateString()}
                                </div>
                            </div>

                            {/* Replies */}
                            <div style={{ padding: '1rem 1.25rem', background: '#f8fafc' }}>
                                {doubt.replies.length > 0 && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginBottom: '1.5rem' }}>
                                        {doubt.replies.map(r => (
                                            <div key={r.id} style={{ background: '#fff', padding: '0.8rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                                <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.3rem', fontWeight: 'bold' }}>{r.user_name}</div>
                                                <p style={{ margin: 0, fontSize: '0.9rem', color: '#334155' }}>{r.content}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                
                                {!doubt.is_resolved && (
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <input 
                                            type="text" 
                                            className="cyber-input" 
                                            placeholder="Write a reply..." 
                                            value={replyContents[doubt.id] || ''}
                                            onChange={e => setReplyContents({ ...replyContents, [doubt.id]: e.target.value })}
                                            style={{ padding: '0.5rem 0.8rem', fontSize: '0.85rem' }}
                                        />
                                        <button onClick={() => handleReply(doubt.id)} className="btn btn-sm" style={{ padding: '0.5rem 1rem' }}>
                                            Reply
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default DoubtBoardTab;
