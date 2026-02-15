import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const CreatePoll = () => {
    const [question, setQuestion] = useState('');
    const [options, setOptions] = useState(['', '']);
    const navigate = useNavigate();

    const handleOptionChange = (index, value) => {
        const newOptions = [...options];
        newOptions[index] = value;
        setOptions(newOptions);
    };

    const addOption = () => {
        setOptions([...options, '']);
    };

    const removeOption = (index) => {
        if (options.length > 2) {
            const newOptions = options.filter((_, i) => i !== index);
            setOptions(newOptions);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const validOptions: string[] = options.filter((opt: string) => opt.trim() !== '');
        if (validOptions.length < 2) {
            alert('Please provide at least two valid options.');
            return;
        }

        try {
            const response = await fetch('/api/polls', {
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
            navigate(`/poll/${data.id}`);
        } catch (error) {
            console.error(error);
            alert('Error creating poll');
        }
    };

    return (
        <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-xl mt-10">
            <h1 className="text-3xl font-bold mb-6 text-gray-800">Create a Poll</h1>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-gray-700 font-semibold mb-2">Question</label>
                    <input
                        type="text"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="What would you like to ask?"
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        required
                    />
                </div>

                <div>
                    <label className="block text-gray-700 font-semibold mb-2">Options</label>
                    {options.map((option, index) => (
                        <div key={index} className="flex gap-2 mb-2">
                            <input
                                type="text"
                                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder={`Option ${index + 1}`}
                                value={option}
                                onChange={(e) => handleOptionChange(index, e.target.value)}
                                required
                            />
                            {options.length > 2 && (
                                <button
                                    type="button"
                                    onClick={() => removeOption(index)}
                                    className="px-3 py-2 text-red-500 hover:bg-red-50 rounded-lg"
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                    ))}
                    <button
                        type="button"
                        onClick={addOption}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                        + Add Option
                    </button>
                </div>

                <button
                    type="submit"
                    className="w-full py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition duration-300"
                >
                    Create Poll
                </button>
            </form>
        </div>
    );
};

export default CreatePoll;
