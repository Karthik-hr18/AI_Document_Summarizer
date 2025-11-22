// export default UploadPage;
import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { 
  PaperAirplaneIcon, 
  PlusIcon, 
  DocumentTextIcon, 
  UserCircleIcon,
  XMarkIcon,
  Bars3Icon,
  ClockIcon // Added for history visual
} from '@heroicons/react/24/outline';

const UploadPage = () => {
  const [file, setFile] = useState(null);
  const [summary, setSummary] = useState('');
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [username, setUsername] = useState("User"); // Default name
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchHistory();
    
    // 1. Get username from Local Storage
    const storedUser = localStorage.getItem("username");
    if (storedUser) {
      setUsername(storedUser);
    }
  },[]);

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
      setHistory([]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setSummary('');
      setError('');
    }
  };

  const handleSummarize = async () => {
    if (!file) return;

    setIsLoading(true);
    setError('');
    setSummary('');

    try {
      const token = localStorage.getItem('token');
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
      fetchHistory();
    } catch (err) {
      const errMsg = err.response?.data?.detail || 'Summarization failed.';
      setError(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username'); // Clear name on logout
    navigate('/login');
  };

  const loadHistoryItem = (doc) => {
    setSummary(doc.summary);
    setError('');
    setFile(null);
  };

  const resetView = () => {
    setSummary('');
    setFile(null);
    setError('');
  };

  // Helper to format date/time
  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    // 2. FIXED INSET-0: Forces this div to cover the WHOLE screen, hiding any blue background
    <div className="fixed inset-0 w-screen h-screen bg-[#212121] text-gray-100 font-sans flex overflow-hidden z-50">
      
      {/* SIDEBAR */}
      <div className={`${sidebarOpen ? 'w-[280px]' : 'w-0'} bg-[#171717] flex-shrink-0 transition-all duration-300 flex flex-col border-r border-white/5 relative`}>
        
        {/* New Chat Button */}
        <div className="p-3">
          <button 
            onClick={resetView}
            className="flex items-center gap-3 px-3 py-3 w-full text-sm text-white bg-transparent hover:bg-[#212121] border border-white/20 rounded-md transition-colors text-left"
          >
            <PlusIcon className="w-4 h-4" />
            New Summary
          </button>
        </div>

        {/* History List with Date/Time */}
        <div className="flex-1 overflow-y-auto px-3 py-2 custom-scrollbar">
          <div className="text-xs font-medium text-gray-500 mb-2 px-2">Recent</div>
          <div className="space-y-1">
            {history.map((doc) => (
              <button
                key={doc.id}
                onClick={() => loadHistoryItem(doc)}
                className="w-full text-left flex items-start gap-3 px-3 py-3 hover:bg-[#212121] rounded-md group transition-colors"
              >
                <DocumentTextIcon className="w-5 h-5 text-gray-500 mt-0.5 group-hover:text-white flex-shrink-0" />
                <div className="overflow-hidden">
                  {/* Title */}
                  <p className="text-sm text-gray-300 truncate font-medium">
                    {doc.title || "Untitled Document"}
                  </p>
                  {/* 3. Date and Time */}
                  <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                    <ClockIcon className="w-3 h-3" />
                    <span>{formatDateTime(doc.created_at)}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* User / Logout Area */}
        <div className="p-3 border-t border-white/10 bg-[#171717]">
          <div className="flex items-center gap-3 px-3 py-3 w-full text-sm text-white rounded-md">
            <UserCircleIcon className="w-9 h-9 text-gray-400" />
            <div className="flex flex-col flex-1 overflow-hidden">
              {/* 4. Actual Username Display */}
              <span className="font-medium truncate">{username}</span>
              <button 
                onClick={handleLogout} 
                className="text-xs text-gray-500 hover:text-white text-left transition-colors"
              >
                Log out
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col relative h-full min-w-0">
        
        {/* Mobile Toggle */}
        <div className="md:hidden flex items-center p-4 text-gray-300 bg-[#212121] border-b border-white/5">
          <button onClick={() => setSidebarOpen(!sidebarOpen)}>
            <Bars3Icon className="w-6 h-6" />
          </button>
          <span className="ml-4 font-semibold">Personalized AI</span>
        </div>

        {/* Content Scroll Area */}
        <div className="flex-1 overflow-y-auto w-full p-4 md:p-0 pb-32 scroll-smooth">
          
          {error && (
            <div className="max-w-3xl mx-auto mt-6 bg-red-500/10 border border-red-500/20 text-red-200 p-4 rounded-lg">
              {error}
            </div>
          )}

          {/* Empty State */}
          {!summary && !isLoading && (
            <div className="flex flex-col items-center justify-center h-full opacity-80">
              <div className="bg-[#2f2f2f] p-4 rounded-2xl mb-6 shadow-xl">
                 <DocumentTextIcon className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-2xl font-semibold mb-2">Personalized AI</h2>
              <p className="text-sm text-gray-400">Upload a document to generate a summary</p>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
             <div className="max-w-3xl mx-auto mt-10 flex items-start gap-4 p-4 animate-pulse">
                <div className="w-8 h-8 rounded-sm bg-green-600 flex items-center justify-center flex-shrink-0">
                  <DocumentTextIcon className="w-5 h-5 text-white" />
                </div>
                <div className="space-y-3 w-full">
                  <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-700 rounded w-1/2"></div>
                  <div className="h-4 bg-gray-700 rounded w-5/6"></div>
                </div>
             </div>
          )}

          {/* Summary Result */}
          {summary && !isLoading && (
            <div className="w-full border-b border-black/10 dark:border-gray-900/50">
               <div className="max-w-3xl mx-auto flex gap-4 md:gap-6 p-4 md:py-10">
                 <div className="w-8 h-8 rounded-sm bg-green-500 flex items-center justify-center flex-shrink-0 mt-1">
                    <DocumentTextIcon className="w-5 h-5 text-white" />
                 </div>
                 <div className="relative flex-1 overflow-hidden">
                    <div className="prose prose-invert max-w-none leading-7 text-gray-100">
                      <p className="whitespace-pre-wrap">{summary}</p>
                    </div>
                 </div>
               </div>
            </div>
          )}
        </div>

        {/* BOTTOM INPUT BAR */}
        <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-[#212121] via-[#212121] to-transparent pb-8 pt-10 px-4">
          <div className="max-w-3xl mx-auto">
            <div className="relative flex items-center w-full p-3 bg-[#2f2f2f] rounded-xl border border-white/10 shadow-lg focus-within:border-gray-500 transition-colors">
              
              <button 
                onClick={() => fileInputRef.current.click()}
                className="p-2 text-gray-400 hover:text-white bg-transparent rounded-md transition-colors"
                title="Upload file"
              >
                <PlusIcon className="w-5 h-5" />
              </button>

              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".txt,.pdf,.docx"
                className="hidden"
              />

              <div className="flex-1 ml-3 text-sm text-gray-300 overflow-hidden">
                {file ? (
                  <span className="flex items-center gap-2 text-white font-medium bg-white/10 px-2 py-1 rounded w-fit">
                    <DocumentTextIcon className="w-4 h-4" />
                    {file.name}
                    <button onClick={(e) => { e.stopPropagation(); setFile(null); }} className="hover:text-red-400">
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  </span>
                ) : (
                  <span className="text-gray-500">Upload a document (.pdf, .docx, .txt)...</span>
                )}
              </div>

              <button 
                onClick={handleSummarize}
                disabled={!file || isLoading}
                className={`p-2 rounded-md transition-all duration-200 
                  ${file && !isLoading 
                    ? 'bg-white text-black hover:bg-gray-200' 
                    : 'bg-transparent text-gray-500 cursor-not-allowed'}`}
              >
                <PaperAirplaneIcon className="w-5 h-5" />
              </button>
            </div>
            <p className="text-center text-xs text-gray-500 mt-2">
              AI Can Make Mistake Please Double Verify it!
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default UploadPage;