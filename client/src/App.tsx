import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import CreatePoll from './CreatePoll';
import ViewPoll from './ViewPoll';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        <Routes>
          <Route path="/" element={<CreatePoll />} />
          <Route path="/poll/:id" element={<ViewPoll />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
