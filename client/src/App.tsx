import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastProvider } from './components/ui/ToastContext';
import { Layout } from './components/layout/Layout';
import CreatePoll from './pages/CreatePoll';
import ViewPoll from './pages/ViewPoll';

function App() {
  return (
    <ToastProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<CreatePoll />} />
            <Route path="/poll/:id" element={<ViewPoll />} />
          </Routes>
        </Layout>
      </Router>
    </ToastProvider>
  );
}

export default App;
