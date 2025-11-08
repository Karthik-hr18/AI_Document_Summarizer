import React, { useState, useRef, useEffect } from 'react';
import { Button, Spinner, ErrorDisplay, LogoutIcon } from '../components/UIComponents.jsx';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const UploadPage = () => {
  const [file, setFile] = useState(null);
  const [summary, setSummary] = useState('');
  const [history, setHistory] = useState([]); // ✅ For user summaries
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  // ✅ Fetch user history on mount
  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const res = await axios.get('http://127.0.0.1:8000/user/history', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setHistory(res.data);
    } catch (err) {
      console.error('Error fetching history:', err);
      setHistory([]); // just reset if none
    }
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setSummary('');
    setError('');
  };

  const handleSummarize = async () => {
    if (!file) {
      setError('Please select a file to summarize.');
      return;
    }

    setIsLoading(true);
    setError('');
    setSummary('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const formData = new FormData();
      formData.append('file', file);

      const res = await axios.post('http://127.0.0.1:8000/summarizer/file', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });

      setSummary(res.data.summary || 'No summary generated.');
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';

      // ✅ Refresh user history
      fetchHistory();
    } catch (err) {
      if (err.response) {
        if (err.response.status === 401) {
          setError('Authentication failed. Please log in again.');
          localStorage.removeItem('token');
          navigate('/login');
        } else if (err.response.data?.detail) {
          setError(`Summarization failed: ${err.response.data.detail}`);
        } else {
          setError(`Request failed with status: ${err.response.status}`);
        }
      } else {
        setError('Could not connect to the backend. Please check your server.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4 font-sans">
      {/* 🔴 Logout */}
      <div className="absolute top-4 right-4">
        <Button onClick={handleLogout} className="bg-red-500 hover:bg-red-600 flex items-center">
          <LogoutIcon /> Logout
        </Button>
      </div>

      <div className="w-full max-w-3xl p-8 space-y-6 bg-white rounded-2xl shadow-lg">
        <h2 className="text-2xl font-bold text-center text-gray-900">
          AI Document Summarizer
        </h2>

        <ErrorDisplay message={error} />

        {/* 📁 File upload */}
        <div className="flex flex-col items-center space-y-4">
          <input
            type="file"
            onChange={handleFileChange}
            ref={fileInputRef}
            accept=".txt,.pdf,.docx"
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
          />
          <Button onClick={handleSummarize} disabled={isLoading}>
            {isLoading ? <Spinner /> : 'Upload & Summarize'}
          </Button>
        </div>

        {/* 📄 Summary display */}
        {summary && (
          <div className="mt-8 p-6 border border-gray-200 rounded-lg bg-gray-50">
            <h3 className="text-xl font-semibold mb-2 text-gray-800">Summary</h3>
            <p className="text-gray-700 whitespace-pre-wrap">{summary}</p>
          </div>
        )}

        {/* 🕓 User History */}
        <div className="mt-10">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Your Summary History</h3>
          {history.length === 0 ? (
            <p className="text-gray-500 text-center">No summaries yet.</p>
          ) : (
            <ul className="space-y-3">
              {history.map((doc) => (
                <li key={doc.id} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                  <p className="font-semibold text-gray-800">{doc.title}</p>
                  <p className="text-gray-600 text-sm">Created: {new Date(doc.created_at).toLocaleString()}</p>
                  <p className="mt-2 text-gray-700 line-clamp-3">{doc.summary}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default UploadPage;
