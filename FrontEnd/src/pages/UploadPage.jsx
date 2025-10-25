import React, { useState, useRef } from 'react';
// --- FIX: Added .jsx extension ---
import { Button, Spinner, ErrorDisplay, LogoutIcon } from '../components/UIComponents.jsx';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const UploadPage = () => {
  const [file, setFile] = useState(null);
  const [summary, setSummary] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null); // Ref for file input
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setSummary(''); // Clear previous summary when new file selected
    setError('');
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file first.');
      return;
    }
    const formData = new FormData();
    formData.append('file', file);
    setError('');
    setIsLoading(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        // If no token, redirect to login
        navigate('/login');
        return;
      }

      // --- FIX: Add Authorization header ---
      const res = await axios.post('http://127.0.0.1:8000/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`, // Send the token
        },
      });
      setSummary(res.data.summary);
      setFile(null); // Clear file input after successful upload
      if (fileInputRef.current) {
        fileInputRef.current.value = ''; // Reset file input visually
      }
    } catch (err) {
      if (err.response) {
        if (err.response.status === 401) {
          setError('Authentication failed. Please log in again.');
          localStorage.removeItem('token'); // Clear invalid token
          navigate('/login'); // Redirect to login
        } else if (err.response.data && err.response.data.detail) {
          setError(`Upload failed: ${err.response.data.detail}`);
        } else {
          setError(`Upload failed with status: ${err.response.status}`);
        }
      } else {
        setError('Upload failed! Please check your connection and try again.');
      }
      // --- FIX: Removed alert ---
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
       <div className="absolute top-4 right-4">
         <Button onClick={handleLogout} className="bg-red-500 hover:bg-red-600 flex items-center">
           <LogoutIcon /> Logout
         </Button>
       </div>
      <div className="w-full max-w-2xl p-8 space-y-6 bg-white rounded-2xl shadow-lg">
        <h2 className="text-2xl font-bold text-center text-gray-900">Upload Document for Summarization</h2>

        <ErrorDisplay message={error} />

        <div className="flex flex-col items-center space-y-4">
          <input
            type="file"
            onChange={handleFileChange}
            ref={fileInputRef} // Assign ref
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
            accept=".txt,.pdf,.docx" // Specify acceptable file types if needed
          />
          <Button onClick={handleUpload} disabled={isLoading || !file}>
            {isLoading ? <Spinner /> : 'Upload & Summarize'}
          </Button>
        </div>

        {summary && (
          <div className="mt-8 p-6 border border-gray-200 rounded-lg bg-gray-50">
            <h3 className="text-xl font-semibold mb-2 text-gray-800">Summary</h3>
            <p className="text-gray-700 whitespace-pre-wrap">{summary}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadPage;

