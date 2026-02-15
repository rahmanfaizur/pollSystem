import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { io } from 'socket.io-client';

const socket = io(); // Auto-detects host

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

    useEffect(() => {
        // Check local storage for vote fairness
        const votedPolls = JSON.parse(localStorage.getItem('votedPolls') || '[]');
        if (votedPolls.includes(id)) {
            setHasVoted(true);
        }

        // Fetch initial poll data
        fetch(`/api/polls/${id}`)
            .then(res => res.json())
            .then(data => {
                setPoll(data);
            })
            .catch(err => console.error(err));

        // Join socket room
        socket.emit('join_poll', id);

        // Listen for updates
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
            alert(msg);
        });

        return () => {
            socket.off('update_results');
            socket.off('error');
        };
    }, [id]);

    const handleVote = (optionId: number) => {
        if (hasVoted) return;

        // Optimistic UI update or just wait for server?
        // Let's wait for server but mark local state as voted to prevent double clicks

        socket.emit('vote', { pollId: id, optionId });

        // Save to local storage
        const votedPolls = JSON.parse(localStorage.getItem('votedPolls') || '[]');
        localStorage.setItem('votedPolls', JSON.stringify([...votedPolls, id]));
        setHasVoted(true);
        setSelectedOption(optionId);
    };

    const copyLink = () => {
        navigator.clipboard.writeText(window.location.href);
        alert('Link copied to clipboard!');
    };

    if (!poll) return <div className="text-center mt-10">Loading poll...</div>;

    const totalVotes = poll.options.reduce((acc, curr) => acc + curr.votes, 0);

    return (
        <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-xl mt-10">
            <h1 className="text-3xl font-bold mb-4 text-gray-800">{poll.question}</h1>

            <div className="space-y-4">
                {poll.options.map((option) => {
                    const percentage = totalVotes === 0 ? 0 : Math.round((option.votes / totalVotes) * 100);

                    return (
                        <div
                            key={option.id}
                            className={`p-4 border rounded-lg cursor-pointer transition-all relative overflow-hidden ${hasVoted ? 'cursor-default' : 'hover:bg-gray-50'}`}
                            onClick={() => !hasVoted && handleVote(option.id)}
                        >
                            {/* Progress Bar Background */}
                            <div
                                className="absolute top-0 left-0 h-full bg-blue-100 transition-all duration-500"
                                style={{ width: `${percentage}%`, zIndex: 0 }}
                            />

                            <div className="relative z-10 flex justify-between items-center">
                                <span className="font-semibold text-gray-800">{option.text}</span>
                                {hasVoted && (
                                    <span className="font-bold text-blue-600">{percentage}% ({option.votes} votes)</span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="mt-8 flex justify-between items-center text-gray-600">
                <p>{totalVotes} votes</p>
                <button onClick={copyLink} className="text-blue-600 hover:underline">
                    Share Poll
                </button>
            </div>

            {hasVoted && (
                <p className="mt-4 text-center text-sm text-green-600 font-medium">
                    You check 'em results update in real-time!
                </p>
            )}
        </div>
    );
};

export default ViewPoll;
