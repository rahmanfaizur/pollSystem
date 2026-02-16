import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useToast } from '../components/ui/ToastContext';

const API_URL = import.meta.env.VITE_API_URL || '';
const socket = io(API_URL);

interface PollOption {
    id: number;
    poll_id: string;
    text: string;
    votes: number;
}

interface Poll {
    id: string;
    question: string;
    created_at: string;
    options: PollOption[];
}

const ViewPoll = () => {
    const { id } = useParams<{ id: string }>();
    const [poll, setPoll] = useState<Poll | null>(null);
    const [hasVoted, setHasVoted] = useState<boolean>(false);
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const { showToast } = useToast();

    useEffect(() => {
        const votedPolls = JSON.parse(localStorage.getItem('votedPolls') || '[]');
        if (votedPolls.includes(id)) {
            setHasVoted(true);
        }

        let voterId = localStorage.getItem('voterId');
        if (!voterId) {
            voterId = crypto.randomUUID();
            localStorage.setItem('voterId', voterId);
        }

        fetch(`${API_URL}/api/polls/${id}`)
            .then(res => res.json())
            .then(data => {
                setPoll(data);
            })
            .catch(err => {
                console.error(err);
                showToast('Failed to load poll', 'error');
            });

        socket.emit('join_poll', id);

        socket.on('update_results', (newResults: Record<number, number>) => {
            setPoll(prevPoll => {
                if (!prevPoll) return prevPoll;
                const updatedOptions = prevPoll.options.map((opt: PollOption) => ({
                    ...opt,
                    votes: newResults[opt.id] || 0
                }));
                return { ...prevPoll, options: updatedOptions };
            });
        });

        socket.on('error', (msg) => {
            showToast(msg, 'error');
        });

        return () => {
            socket.off('update_results');
            socket.off('error');
        };
    }, [id, showToast]);

    const handleVote = (optionId: number) => {
        if (hasVoted) return;

        // Optimistic UI Update
        setHasVoted(true);
        setSelectedOption(optionId);

        // Immediately update the local poll state to show 100% responsiveness
        setPoll(prevPoll => {
            if (!prevPoll) return prevPoll;
            const updatedOptions = prevPoll.options.map(opt => {
                if (opt.id === optionId) {
                    return { ...opt, votes: opt.votes + 1 };
                }
                return opt;
            });
            return { ...prevPoll, options: updatedOptions };
        });

        const voterId = localStorage.getItem('voterId');
        socket.emit('vote', { pollId: id, optionId, voterId });

        const votedPolls = JSON.parse(localStorage.getItem('votedPolls') || '[]');
        localStorage.setItem('votedPolls', JSON.stringify([...votedPolls, id]));

        showToast('Vote submitted successfully!', 'success');
    };

    const copyLink = () => {
        navigator.clipboard.writeText(window.location.href);
        showToast('Link copied to clipboard!', 'info');
    };

    if (!poll) return <div className="text-center mt-10 text-slate-500">Loading poll...</div>;

    const totalVotes = poll.options.reduce((acc, curr) => acc + curr.votes, 0);

    return (
        <Card className="p-6 md:p-10 max-w-2xl mx-auto mt-6 animate-fade-in-up">
            <h1 className="text-2xl md:text-3xl font-extrabold mb-6 text-slate-800 leading-tight">{poll.question}</h1>

            <div className="space-y-4">
                {poll.options.map((option) => {
                    const percentage = totalVotes === 0 ? 0 : Math.round((option.votes / totalVotes) * 100);

                    return (
                        <div
                            key={option.id}
                            className={`relative border rounded-xl overflow-hidden transition-all duration-300 ${hasVoted
                                ? 'border-transparent bg-slate-50'
                                : 'border-slate-200 hover:border-violet-300 hover:shadow-md cursor-pointer bg-white'
                                } ${selectedOption === option.id ? 'ring-2 ring-violet-500 ring-offset-2' : ''}`}
                            onClick={() => !hasVoted && handleVote(option.id)}
                        >
                            {/* Progress Bar Background */}
                            <div
                                className={`absolute top-0 left-0 h-full transition-all duration-700 ease-out ${hasVoted
                                    ? selectedOption === option.id
                                        ? 'bg-gradient-to-r from-violet-200/70 to-indigo-200/70'
                                        : 'bg-slate-200/50'
                                    : 'bg-white'
                                    }`}
                                style={{ width: hasVoted ? `${percentage}%` : '0%' }}
                            />

                            <div className="relative z-10 p-4 flex justify-between items-center">
                                <span className={`font-medium text-lg ${hasVoted && selectedOption === option.id ? 'text-violet-900 font-bold' : 'text-slate-700'}`}>
                                    {option.text}
                                    {hasVoted && selectedOption === option.id && <span className="ml-2 text-sm text-violet-600">(You)</span>}
                                </span>

                                {hasVoted && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-bold text-slate-900">{percentage}%</span>
                                        <span className="text-xs text-slate-500">({option.votes} votes)</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="text-slate-500 font-medium flex items-center gap-2">
                    <span className="inline-flex items-center justify-center bg-slate-100 p-2 rounded-full">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-600"><path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-3 3" /></svg>
                    </span>
                    {totalVotes} total votes
                </div>

                <Button
                    variant="secondary"
                    onClick={copyLink}
                    icon={<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" x2="12" y1="2" y2="15" /></svg>}
                >
                    Share Poll Link
                </Button>
            </div>

            {hasVoted && (
                <div className="mt-6 p-4 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100 text-center text-sm font-medium animate-pulse-once">
                    Vote recorded! watching real-time updates...
                </div>
            )}
        </Card>
    );
};

export default ViewPoll;
