import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { useToast } from '../components/ui/ToastContext';

const API_URL = import.meta.env.VITE_API_URL || '';

const CreatePoll = () => {
    const [question, setQuestion] = useState('');
    const [options, setOptions] = useState(['', '']);
    const navigate = useNavigate();
    const { showToast } = useToast();

    const handleOptionChange = (index: number, value: string) => {
        const newOptions = [...options];
        newOptions[index] = value;
        setOptions(newOptions);
    };

    const addOption = () => {
        setOptions([...options, '']);
    };

    const removeOption = (index: number) => {
        if (options.length > 2) {
            const newOptions = options.filter((_, i) => i !== index);
            setOptions(newOptions);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const validOptions: string[] = options.filter((opt: string) => opt.trim() !== '');
        if (validOptions.length < 2) {
            showToast('Please provide at least two valid options.', 'error');
            return;
        }

        try {
            const response = await fetch(`${API_URL}/api/polls`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ question, options: validOptions }),
            });

            if (!response.ok) {
                throw new Error('Failed to create poll');
            }

            const data = await response.json();
            showToast('Poll created successfully!', 'success');
            navigate(`/poll/${data.id}`);
        } catch (error) {
            console.error(error);
            showToast('Error creating poll', 'error');
        }
    };

    return (
        <Card className="p-8 md:p-10 max-w-2xl mx-auto mt-10 animate-fade-in-up">
            <div className="text-center mb-8">
                <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Create a New Poll</h1>
                <p className="text-slate-500 mt-2 text-lg">Ask your question and get real-time feedback.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <Input
                    label="Question"
                    placeholder="e.g., What's the best programming language?"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    required
                    autoFocus
                    className="text-lg"
                />

                <div className="space-y-3">
                    <label className="block text-slate-700 font-semibold mb-2 text-lg">Options</label>
                    {options.map((option, index) => (
                        <div key={index} className="flex gap-3 group">
                            <Input
                                placeholder={`Option ${index + 1}`}
                                value={option}
                                onChange={(e) => handleOptionChange(index, e.target.value)}
                                required
                            />
                            {options.length > 2 && (
                                <button
                                    type="button"
                                    onClick={() => removeOption(index)}
                                    className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                                    aria-label="Remove option"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                                </button>
                            )}
                        </div>
                    ))}

                    <Button
                        type="button"
                        variant="ghost"
                        onClick={addOption}
                        className="mt-2 text-violet-600 hover:text-violet-800 font-medium px-2 py-1"
                        icon={<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M12 5v14" /></svg>}
                    >
                        Add another option
                    </Button>
                </div>

                <div className="pt-4">
                    <Button
                        type="submit"
                        fullWidth
                        className="text-lg shadow-violet-200"
                    >
                        Create Poll
                    </Button>
                </div>
            </form>
        </Card>
    );
};

export default CreatePoll;
