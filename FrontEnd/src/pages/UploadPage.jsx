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
  ClockIcon,
  MagnifyingGlassIcon,
  TrashIcon,
  ArrowUpTrayIcon,
  SparklesIcon,
  ClipboardDocumentCheckIcon,
  ClipboardDocumentIcon,
  ArrowDownTrayIcon,
  CheckIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  InformationCircleIcon,
  ArrowPathIcon,
  BoltIcon,
  ShieldCheckIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline';

const UploadPage = () => {
  // State management
  const [file, setFile] = useState(null);
  const [textInput, setTextInput] = useState('');
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' or 'text'
  const [summary, setSummary] = useState('');
  const [originalText, setOriginalText] = useState('');
  const [summaryStats, setSummaryStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all', 'pdf', 'docx', 'txt'
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [username, setUsername] = useState("User");
  const [summaryStyle, setSummaryStyle] = useState('executive'); // 'executive', 'bullets', 'deep'
  const [summaryLength, setSummaryLength] = useState('medium'); // 'short', 'medium', 'detailed'
  const [fontSize, setFontSize] = useState('text-base'); // 'text-sm', 'text-base', 'text-lg'
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [activeHistoryId, setActiveHistoryId] = useState(null);
  const [viewMode, setViewMode] = useState('summary'); // 'summary' or 'source'

  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  // Loading indicator steps simulation
  useEffect(() => {
    let interval;
    if (isLoading) {
      setLoadingStep(1);
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev < 3 ? prev + 1 : prev));
      }, 1800);
    } else {
      setLoadingStep(0);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  useEffect(() => {
    fetchHistory();
    const storedUser = localStorage.getItem("username");
    if (storedUser) {
      setUsername(storedUser);
    }

    // Clean up speech on unmount
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

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
      setHistory(res.data || []);
    } catch (err) {
      console.error('Error fetching history:', err);
      setHistory([]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      processSelectedFile(selectedFile);
    }
  };

  const processSelectedFile = (selectedFile) => {
    const validTypes = ['.pdf', '.docx', '.txt'];
    const fileExt = '.' + selectedFile.name.split('.').pop().toLowerCase();
    
    if (!validTypes.includes(fileExt)) {
      setError(`Unsupported file format (${fileExt}). Please upload .pdf, .docx, or .txt`);
      return;
    }

    if (selectedFile.size > 25 * 1024 * 1024) {
      setError('File size exceeds maximum limit of 25MB.');
      return;
    }

    setFile(selectedFile);
    setSummary('');
    setOriginalText('');
    setSummaryStats(null);
    setError('');
    setActiveHistoryId(null);
  };

  // Drag and Drop handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleSummarize = async () => {
    if (!file && !textInput.trim()) {
      setError('Please select a document file or enter text to summarize.');
      return;
    }

    setIsLoading(true);
    setError('');
    setSummary('');
    setOriginalText('');
    setSummaryStats(null);

    // Stop speaking if running
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    setIsSpeaking(false);

    try {
      const token = localStorage.getItem('token');
      let res;

      if (activeTab === 'upload' && file) {
        const formData = new FormData();
        formData.append('file', file);
        
        res = await axios.post('http://127.0.0.1:8000/summarizer/file', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`,
          },
        });
      } else {
        res = await axios.post('http://127.0.0.1:8000/summarizer/text', {
          text: textInput,
          max_length: summaryLength === 'short' ? 100 : summaryLength === 'medium' ? 250 : 500,
          min_length: summaryLength === 'short' ? 30 : summaryLength === 'medium' ? 80 : 150,
        }, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });
      }

      const generatedSummary = res.data.summary || 'No summary generated.';
      const origLength = res.data.original_length || (textInput ? textInput.length : 1500);
      const summLength = res.data.summary_length || generatedSummary.length;
      const compression = Math.max(5, Math.min(95, Math.round((1 - (summLength / Math.max(origLength, 1))) * 100)));
      const timeSaved = Math.max(1, Math.round((origLength / 1200))); // ~200 wpm estimate

      setSummary(generatedSummary);
      setSummaryStats({
        origLength,
        summLength,
        compression,
        timeSaved,
        wordsCount: generatedSummary.split(/\s+/).filter(Boolean).length
      });

      setFile(null);
      setTextInput('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      fetchHistory();
      showToast('Summary generated successfully!');
    } catch (err) {
      console.error('Summarization error:', err);
      const errMsg = err.response?.data?.detail || 'Summarization failed. Please check the backend connection.';
      setError(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    navigate('/login');
  };

  const loadHistoryItem = (doc) => {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    setIsSpeaking(false);
    
    setSummary(doc.summary);
    setOriginalText(doc.content || '');
    setActiveHistoryId(doc.id);
    setError('');
    setFile(null);

    const origLen = doc.content ? doc.content.length : doc.summary.length * 4;
    const summLen = doc.summary.length;
    const compression = Math.max(10, Math.min(92, Math.round((1 - (summLen / Math.max(origLen, 1))) * 100)));
    
    setSummaryStats({
      origLength: origLen,
      summLength: summLen,
      compression,
      timeSaved: Math.max(1, Math.round(origLen / 1200)),
      wordsCount: doc.summary.split(/\s+/).filter(Boolean).length
    });
    setViewMode('summary');
  };

  const resetView = () => {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setSummary('');
    setOriginalText('');
    setFile(null);
    setTextInput('');
    setError('');
    setSummaryStats(null);
    setActiveHistoryId(null);
  };

  const handleCopySummary = () => {
    if (!summary) return;
    navigator.clipboard.writeText(summary);
    setIsCopied(true);
    showToast('Summary copied to clipboard!');
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleDownload = (format) => {
    if (!summary) return;
    let content = summary;
    let mimeType = 'text/plain';
    let filename = `summary_${new Date().toISOString().slice(0, 10)}.${format}`;

    if (format === 'md') {
      content = `# AI Document Summary\n\n*Generated on ${new Date().toLocaleDateString()}*\n\n---\n\n${summary}`;
      mimeType = 'text/markdown';
    }

    const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(`Downloaded as ${format.toUpperCase()}`);
  };

  const toggleSpeech = () => {
    if (!('speechSynthesis' in window)) {
      showToast('Text-to-Speech not supported on this browser.');
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      const utterance = new SpeechSynthesisUtterance(summary);
      utterance.rate = 1.0;
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    }
  };

  const loadSampleDoc = (type) => {
    setActiveTab('text');
    let sampleText = "";
    if (type === 'tech') {
      sampleText = `Artificial Intelligence (AI) and Machine Learning (ML) have evolved from theoretical computer science concepts into fundamental drivers of global industrial transformation. Modern Deep Learning models, particularly Transformer-based architectures, leverage multi-head attention mechanisms to process sequential data with unprecedented accuracy. This paper evaluates the operational efficiency, computational overhead, and memory bandwidth requirements of deploying LLMs at the edge. We demonstrate that quantization techniques such as FP8 and INT4 reduce latency by 45% while preserving 98.5% of model accuracy.`;
    } else if (type === 'business') {
      sampleText = `Q3 Financial Analysis & Quarterly Strategy Report:\nThe company achieved record gross revenue of $14.2 Million in Q3, representing a 28% year-over-year growth trajectory. Cloud subscription services accounted for 64% of recurring revenues. Operating margins expanded by 340 basis points due to automated workflow efficiencies. Strategic priorities for Q4 include expanding North American enterprise sales teams, scaling customer success hubs, and accelerating product integrations with major CRM platforms.`;
    } else {
      sampleText = `Legal Agreement Summary & Compliance Terms:\nThis Master Services Agreement ("Agreement") governs the terms under which Confidential Information, Intellectual Property Rights, and Proprietary Data are handled between the Contracting Parties. Data protection standards strictly align with GDPR, CCPA, and ISO/IEC 27001 requirements. Neither party shall disclose confidential materials without explicit written consent. Termination clauses require a 30-day written notice window with full data wipe guarantees.`;
    }
    setTextInput(sampleText);
    setError('');
    showToast('Loaded sample text into summarizer input!');
  };

  // Helper date formatter
  const formatDateTime = (dateString) => {
    if (!dateString) return 'Recent';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  // Filter history
  const filteredHistory = history.filter(doc => {
    const matchesSearch = (doc.title || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (doc.summary || '').toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (filterType === 'all') return true;
    const title = (doc.title || '').toLowerCase();
    if (filterType === 'pdf') return title.endsWith('.pdf');
    if (filterType === 'docx') return title.endsWith('.docx');
    if (filterType === 'txt') return title.endsWith('.txt') || !title.includes('.');
    return true;
  });

  return (
    <div className="fixed inset-0 w-screen h-screen bg-[#0b0f17] text-gray-100 font-sans flex overflow-hidden z-50 selection:bg-indigo-500/30 selection:text-indigo-200">
      
      {/* Background Ambient Glow Effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[45vw] h-[45vw] rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none animate-pulse-glow" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-cyan-600/10 blur-[130px] pointer-events-none animate-pulse-glow" />
      <div className="absolute top-[30%] right-[20%] w-[30vw] h-[30vw] rounded-full bg-emerald-600/5 blur-[140px] pointer-events-none" />

      {/* Toast Notification Popup */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-[100] flex items-center gap-2 bg-indigo-600 text-white text-sm font-medium px-4 py-3 rounded-xl shadow-2xl border border-indigo-400/30 animate-bounce">
          <CheckIcon className="w-5 h-5 text-emerald-300" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* SIDEBAR NAVIGATION */}
      <div className={`${sidebarOpen ? 'w-[300px] md:w-[320px]' : 'w-0'} bg-[#121826]/90 backdrop-blur-xl flex-shrink-0 transition-all duration-300 flex flex-col border-r border-white/10 relative z-20 overflow-hidden`}>
        
        {/* Brand Header */}
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <SparklesIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-sm text-white tracking-wide flex items-center gap-2">
                Personalized AI
                <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-1.5 py-0.5 rounded font-mono">v2.5</span>
              </h1>
              <p className="text-[11px] text-gray-400">Smart Document Summarizer</p>
            </div>
          </div>
        </div>

        {/* New Summary CTA */}
        <div className="p-3">
          <button 
            onClick={resetView}
            className="flex items-center justify-center gap-2 px-4 py-3 w-full text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 rounded-xl shadow-lg shadow-indigo-600/25 hover:shadow-indigo-500/35 transition-all duration-200 group active:scale-[0.98]"
          >
            <PlusIcon className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200" />
            New Document Summary
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="px-3 pb-2 space-y-2">
          <div className="relative">
            <MagnifyingGlassIcon className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input 
              type="text"
              placeholder="Search past summaries..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900/80 text-xs text-gray-200 pl-9 pr-3 py-2 rounded-lg border border-white/10 focus:border-indigo-500/50 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all placeholder:text-gray-500"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-2.5 text-gray-500 hover:text-white">
                <XMarkIcon className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Filter Pills */}
          <div className="flex items-center gap-1 text-[11px] font-medium text-gray-400 px-1">
            {['all', 'pdf', 'docx', 'txt'].map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-2.5 py-1 rounded-md capitalize transition-all ${
                  filterType === type 
                    ? 'bg-white/15 text-white font-semibold' 
                    : 'hover:bg-white/5 text-gray-400'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* History List */}
        <div className="flex-1 overflow-y-auto px-3 py-1 custom-scrollbar space-y-1">
          <div className="flex items-center justify-between text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-2 my-2">
            <span>Recent Documents</span>
            <span className="bg-white/10 text-gray-300 px-1.5 py-0.5 rounded text-[10px] font-mono">{filteredHistory.length}</span>
          </div>

          {filteredHistory.length === 0 ? (
            <div className="text-center py-10 px-4">
              <DocumentTextIcon className="w-8 h-8 text-gray-600 mx-auto mb-2 opacity-50" />
              <p className="text-xs text-gray-400">No summaries found</p>
              <p className="text-[11px] text-gray-500 mt-1">Upload a document to get started</p>
            </div>
          ) : (
            filteredHistory.map((doc) => {
              const isPdf = (doc.title || '').toLowerCase().endsWith('.pdf');
              const isDocx = (doc.title || '').toLowerCase().endsWith('.docx');
              const isActive = activeHistoryId === doc.id;

              return (
                <button
                  key={doc.id}
                  onClick={() => loadHistoryItem(doc)}
                  className={`w-full text-left flex items-start gap-3 p-2.5 rounded-xl transition-all duration-200 border group ${
                    isActive 
                      ? 'bg-indigo-600/20 border-indigo-500/40 shadow-sm' 
                      : 'bg-white/[0.02] hover:bg-white/[0.06] border-transparent hover:border-white/10'
                  }`}
                >
                  <div className={`p-2 rounded-lg flex-shrink-0 mt-0.5 ${
                    isPdf ? 'bg-red-500/15 text-red-400 border border-red-500/20' :
                    isDocx ? 'bg-blue-500/15 text-blue-400 border border-blue-500/20' :
                    'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                  }`}>
                    <DocumentTextIcon className="w-4 h-4" />
                  </div>

                  <div className="overflow-hidden flex-1 min-w-0">
                    <p className={`text-xs truncate font-medium ${isActive ? 'text-indigo-200' : 'text-gray-200 group-hover:text-white'}`}>
                      {doc.title || "Untitled Summary"}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1 text-[10px] text-gray-400 font-mono">
                      <ClockIcon className="w-3 h-3 text-gray-500" />
                      <span>{formatDateTime(doc.created_at)}</span>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* User Account / Footer */}
        <div className="p-3 border-t border-white/10 bg-[#0d121d]">
          <div className="flex items-center gap-3 p-2 rounded-xl bg-white/[0.03] border border-white/5">
            <div className="relative">
              <UserCircleIcon className="w-9 h-9 text-gray-300" />
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-[#0d121d]" />
            </div>
            <div className="flex flex-col flex-1 overflow-hidden">
              <span className="text-xs font-semibold text-white truncate">{username}</span>
              <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-mono">
                AI Ready
              </span>
            </div>
            <button 
              onClick={handleLogout}
              className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
              title="Logout"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* MAIN WORKSPACE AREA */}
      <div className="flex-1 flex flex-col relative h-full min-w-0 overflow-hidden bg-[#0b0f17]/50">
        
        {/* Top Navbar */}
        <header className="h-16 border-b border-white/10 px-4 md:px-6 flex items-center justify-between bg-[#121826]/40 backdrop-blur-md z-10">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              title="Toggle sidebar"
            >
              <Bars3Icon className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-200">Workspace</span>
              <span className="text-gray-600">/</span>
              <span className="text-xs text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full font-medium">
                {summary ? 'Summary View' : 'Document Processing'}
              </span>
            </div>
          </div>

          {/* Quick Toolbar Actions */}
          <div className="flex items-center gap-2">
            {summary && (
              <>
                <div className="hidden sm:flex items-center bg-slate-900/80 border border-white/10 rounded-lg p-1 text-xs">
                  <button 
                    onClick={() => setViewMode('summary')}
                    className={`px-3 py-1 rounded-md font-medium transition-all ${
                      viewMode === 'summary' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    AI Summary
                  </button>
                  {originalText && (
                    <button 
                      onClick={() => setViewMode('source')}
                      className={`px-3 py-1 rounded-md font-medium transition-all ${
                        viewMode === 'source' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      Original Text
                    </button>
                  )}
                </div>

                {/* Font Size Adjuster */}
                <div className="hidden md:flex items-center bg-slate-900/80 border border-white/10 rounded-lg text-xs">
                  <button 
                    onClick={() => setFontSize('text-sm')} 
                    className={`px-2 py-1 hover:text-white ${fontSize === 'text-sm' ? 'text-indigo-400 font-bold' : 'text-gray-400'}`}
                    title="Small font"
                  >
                    A-
                  </button>
                  <button 
                    onClick={() => setFontSize('text-base')} 
                    className={`px-2 py-1 hover:text-white ${fontSize === 'text-base' ? 'text-indigo-400 font-bold' : 'text-gray-400'}`}
                    title="Normal font"
                  >
                    A
                  </button>
                  <button 
                    onClick={() => setFontSize('text-lg')} 
                    className={`px-2 py-1 hover:text-white ${fontSize === 'text-lg' ? 'text-indigo-400 font-bold' : 'text-gray-400'}`}
                    title="Large font"
                  >
                    A+
                  </button>
                </div>
              </>
            )}

            <button
              onClick={resetView}
              className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors flex items-center gap-1.5 text-xs"
              title="Reset view"
            >
              <ArrowPathIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          </div>
        </header>

        {/* Content Scroll View */}
        <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 custom-scrollbar pb-36">
          <div className="max-w-4xl mx-auto space-y-6">

            {/* Error Alert Box */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-200 p-4 rounded-2xl flex items-start gap-3 shadow-lg">
                <InformationCircleIcon className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1 text-xs leading-relaxed">
                  <p className="font-semibold text-red-300">Summarization Alert</p>
                  <p className="mt-0.5 text-red-200/90">{error}</p>
                </div>
                <button onClick={() => setError('')} className="text-red-400 hover:text-white">
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* INITIAL / EMPTY WORKSPACE VIEW */}
            {!summary && !isLoading && (
              <div className="space-y-8">
                
                {/* Hero Title Header */}
                <div className="text-center py-6">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold mb-4">
                    <SparklesIcon className="w-4 h-4 text-indigo-400" />
                    <span>AI-Powered NLP Document Intelligence</span>
                  </div>
                  <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
                    Transform Long Documents into <span className="bg-gradient-to-r from-indigo-400 via-cyan-300 to-emerald-400 bg-clip-text text-transparent">Actionable Insights</span>
                  </h2>
                  <p className="text-sm text-gray-400 max-w-xl mx-auto mt-3 leading-relaxed">
                    Upload your research papers, financial reports, or legal contracts to generate executive summaries in seconds.
                  </p>
                </div>

                {/* Input Method Selector Tabs */}
                <div className="flex justify-center border-b border-white/10 max-w-md mx-auto">
                  <button
                    onClick={() => setActiveTab('upload')}
                    className={`pb-3 px-6 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
                      activeTab === 'upload' 
                        ? 'border-indigo-500 text-indigo-400' 
                        : 'border-transparent text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    <ArrowUpTrayIcon className="w-4 h-4" />
                    Upload File (.pdf, .docx, .txt)
                  </button>
                  <button
                    onClick={() => setActiveTab('text')}
                    className={`pb-3 px-6 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
                      activeTab === 'text' 
                        ? 'border-indigo-500 text-indigo-400' 
                        : 'border-transparent text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    <DocumentTextIcon className="w-4 h-4" />
                    Paste Raw Text
                  </button>
                </div>

                {/* TAB 1: FILE UPLOAD DROPZONE */}
                {activeTab === 'upload' && (
                  <div 
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`glass-panel p-8 md:p-12 rounded-3xl border-2 border-dashed transition-all duration-300 text-center cursor-pointer relative overflow-hidden group ${
                      dragActive 
                        ? 'border-indigo-500 bg-indigo-500/10 scale-[1.01]' 
                        : 'border-white/15 hover:border-indigo-500/50 hover:bg-white/[0.03]'
                    }`}
                  >
                    <input 
                      type="file" 
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept=".txt,.pdf,.docx"
                      className="hidden"
                    />

                    <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300 shadow-xl shadow-indigo-500/10">
                      <ArrowUpTrayIcon className="w-8 h-8" />
                    </div>

                    <h3 className="text-lg font-bold text-white mb-1">
                      {file ? file.name : "Drag & Drop your document here"}
                    </h3>
                    <p className="text-xs text-gray-400 mb-4">
                      {file ? `${(file.size / (1024 * 1024)).toFixed(2)} MB • Ready to analyze` : "or click anywhere to browse local files"}
                    </p>

                    {/* Supported file pills */}
                    <div className="flex items-center justify-center gap-2 font-mono text-[11px]">
                      <span className="px-2.5 py-1 rounded-md bg-red-500/10 text-red-300 border border-red-500/20">.PDF</span>
                      <span className="px-2.5 py-1 rounded-md bg-blue-500/10 text-blue-300 border border-blue-500/20">.DOCX</span>
                      <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">.TXT</span>
                      <span className="text-gray-500 ml-2">Up to 25MB</span>
                    </div>
                  </div>
                )}

                {/* TAB 2: RAW TEXT INPUT AREA */}
                {activeTab === 'text' && (
                  <div className="glass-panel p-4 rounded-3xl border border-white/10 space-y-3">
                    <textarea
                      rows={8}
                      placeholder="Paste your article, meeting notes, research abstract, or essay here..."
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      className="w-full bg-slate-950/60 text-sm text-gray-100 p-4 rounded-2xl border border-white/10 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 custom-scrollbar resize-none placeholder:text-gray-500"
                    />
                    <div className="flex items-center justify-between text-xs text-gray-400 px-2">
                      <span>Character count: {textInput.length}</span>
                      {textInput && (
                        <button onClick={() => setTextInput('')} className="text-gray-400 hover:text-red-400">
                          Clear Text
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* QUICK SAMPLE TRY BUTTONS */}
                <div className="glass-panel p-5 rounded-2xl border border-white/10">
                  <div className="flex items-center gap-2 mb-3">
                    <BoltIcon className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-semibold text-gray-300">Quick Test with Preset Samples:</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <button 
                      onClick={() => loadSampleDoc('tech')}
                      className="p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 hover:border-indigo-500/30 text-left transition-all group"
                    >
                      <p className="text-xs font-semibold text-gray-200 group-hover:text-indigo-300">💻 Tech & AI Paper</p>
                      <p className="text-[11px] text-gray-400 mt-1 line-clamp-1">Transformer LLMs & FP8 Quantization</p>
                    </button>
                    <button 
                      onClick={() => loadSampleDoc('business')}
                      className="p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 hover:border-indigo-500/30 text-left transition-all group"
                    >
                      <p className="text-xs font-semibold text-gray-200 group-hover:text-indigo-300">📈 Q3 Business Report</p>
                      <p className="text-[11px] text-gray-400 mt-1 line-clamp-1">Financial Analysis & Revenue Margins</p>
                    </button>
                    <button 
                      onClick={() => loadSampleDoc('legal')}
                      className="p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 hover:border-indigo-500/30 text-left transition-all group"
                    >
                      <p className="text-xs font-semibold text-gray-200 group-hover:text-indigo-300">⚖️ Legal Agreement</p>
                      <p className="text-[11px] text-gray-400 mt-1 line-clamp-1">Services MSA & Data Compliance</p>
                    </button>
                  </div>
                </div>

                {/* Feature Highlights Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                      <SparklesIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">NLP Extractor</h4>
                      <p className="text-[11px] text-gray-400 mt-0.5">Captures key insights & themes without losing context.</p>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
                      <BoltIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">Instant Speed</h4>
                      <p className="text-[11px] text-gray-400 mt-0.5">Processes complex multi-page documents in seconds.</p>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                      <ShieldCheckIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">Private & Secure</h4>
                      <p className="text-[11px] text-gray-400 mt-0.5">Encrypted token authentication for user document history.</p>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* LOADING STATE ANIMATION */}
            {isLoading && (
              <div className="glass-panel p-8 md:p-12 rounded-3xl border border-white/10 text-center space-y-6">
                <div className="relative w-20 h-20 mx-auto">
                  <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
                  <div className="absolute inset-2 rounded-full border-4 border-cyan-500/20 border-b-cyan-400 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <SparklesIcon className="w-8 h-8 text-indigo-400 animate-pulse" />
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-white">Synthesizing Document Insights</h3>
                  <div className="flex items-center justify-center gap-2 text-xs text-indigo-300 font-mono">
                    <span className={`px-2 py-0.5 rounded ${loadingStep >= 1 ? 'bg-indigo-600 text-white' : 'bg-white/10 text-gray-500'}`}>1. Parsing</span>
                    <span>→</span>
                    <span className={`px-2 py-0.5 rounded ${loadingStep >= 2 ? 'bg-indigo-600 text-white' : 'bg-white/10 text-gray-500'}`}>2. NLP Analysis</span>
                    <span>→</span>
                    <span className={`px-2 py-0.5 rounded ${loadingStep >= 3 ? 'bg-indigo-600 text-white' : 'bg-white/10 text-gray-500'}`}>3. Generating</span>
                  </div>
                </div>

                {/* Shimmer skeleton lines */}
                <div className="max-w-md mx-auto space-y-3 pt-4">
                  <div className="h-4 skeleton-shimmer rounded-lg w-full" />
                  <div className="h-4 skeleton-shimmer rounded-lg w-5/6" />
                  <div className="h-4 skeleton-shimmer rounded-lg w-4/6" />
                </div>
              </div>
            )}

            {/* SUMMARY RESULTS DISPLAY */}
            {summary && !isLoading && (
              <div className="space-y-6">
                
                {/* METRICS & STATS HEADER BAR */}
                {summaryStats && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="glass-panel p-4 rounded-2xl border border-white/10 text-center">
                      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Original Size</p>
                      <p className="text-lg font-bold text-white mt-1 font-mono">{summaryStats.origLength.toLocaleString()} <span className="text-xs text-gray-400 font-sans">chars</span></p>
                    </div>
                    <div className="glass-panel p-4 rounded-2xl border border-white/10 text-center">
                      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Summary Words</p>
                      <p className="text-lg font-bold text-indigo-400 mt-1 font-mono">{summaryStats.wordsCount} <span className="text-xs text-gray-400 font-sans">words</span></p>
                    </div>
                    <div className="glass-panel p-4 rounded-2xl border border-white/10 text-center">
                      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Compression</p>
                      <p className="text-lg font-bold text-emerald-400 mt-1 font-mono">-{summaryStats.compression}%</p>
                    </div>
                    <div className="glass-panel p-4 rounded-2xl border border-white/10 text-center">
                      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Time Saved</p>
                      <p className="text-lg font-bold text-cyan-400 mt-1 font-mono">~{summaryStats.timeSaved} <span className="text-xs text-gray-400 font-sans">mins</span></p>
                    </div>
                  </div>
                )}

                {/* SUMMARY CONTENT CARD */}
                <div className="glass-panel rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
                  
                  {/* Card Header Actions */}
                  <div className="p-4 md:px-6 border-b border-white/10 flex flex-wrap items-center justify-between gap-3 bg-slate-900/60">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
                        <SparklesIcon className="w-4 h-4" />
                      </div>
                      <h3 className="font-bold text-sm text-white">
                        {viewMode === 'summary' ? 'AI Executive Summary' : 'Original Document Text'}
                      </h3>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={toggleSpeech}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all border ${
                          isSpeaking 
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' 
                            : 'bg-white/5 hover:bg-white/10 text-gray-300 border-white/10'
                        }`}
                      >
                        {isSpeaking ? <SpeakerXMarkIcon className="w-4 h-4" /> : <SpeakerWaveIcon className="w-4 h-4" />}
                        <span>{isSpeaking ? 'Stop Audio' : 'Listen'}</span>
                      </button>

                      <button
                        onClick={handleCopySummary}
                        className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-semibold text-gray-200 hover:text-white flex items-center gap-1.5 transition-all"
                      >
                        {isCopied ? <ClipboardDocumentCheckIcon className="w-4 h-4 text-emerald-400" /> : <ClipboardDocumentIcon className="w-4 h-4" />}
                        <span>{isCopied ? 'Copied!' : 'Copy'}</span>
                      </button>

                      {/* Export Dropdown */}
                      <div className="flex items-center bg-white/5 border border-white/10 rounded-lg text-xs font-semibold text-gray-200">
                        <button 
                          onClick={() => handleDownload('md')}
                          className="px-2.5 py-1.5 hover:bg-white/10 hover:text-white transition-colors border-r border-white/10"
                        >
                          .MD
                        </button>
                        <button 
                          onClick={() => handleDownload('txt')}
                          className="px-2.5 py-1.5 hover:bg-white/10 hover:text-white transition-colors"
                        >
                          .TXT
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Summary Text Body */}
                  <div className="p-6 md:p-8">
                    {viewMode === 'summary' ? (
                      <div className={`prose prose-invert max-w-none text-gray-200 leading-relaxed ${fontSize}`}>
                        <div className="bg-indigo-500/5 border-l-4 border-indigo-500 p-4 rounded-r-xl mb-6">
                          <p className="text-xs font-bold text-indigo-300 uppercase tracking-wider mb-1">Key Insight Overview</p>
                          <p className="text-sm text-gray-300 italic">
                            This document has been condensed into concise structured bullet points for rapid reading and review.
                          </p>
                        </div>
                        
                        <div className="whitespace-pre-wrap font-sans text-gray-100 leading-8">
                          {summary}
                        </div>
                      </div>
                    ) : (
                      <div className={`whitespace-pre-wrap font-mono text-xs text-gray-300 bg-slate-950/60 p-6 rounded-2xl border border-white/5 max-h-[500px] overflow-y-auto custom-scrollbar`}>
                        {originalText || "No original text saved for this document."}
                      </div>
                    )}
                  </div>

                  {/* Feedback Footer */}
                  <div className="p-4 bg-slate-950/40 border-t border-white/5 flex items-center justify-between text-xs text-gray-400">
                    <span className="flex items-center gap-1.5">
                      <ShieldCheckIcon className="w-4 h-4 text-emerald-400" />
                      Generated with NLP AI Security Standard
                    </span>
                    <div className="flex items-center gap-3">
                      <span>Was this summary helpful?</span>
                      <button onClick={() => showToast('Thank you for your feedback!')} className="hover:text-white">👍</button>
                      <button onClick={() => showToast('Thank you for your feedback!')} className="hover:text-white">👎</button>
                    </div>
                  </div>

                </div>

              </div>
            )}

          </div>
        </div>

        {/* FLOATING BOTTOM INPUT BAR */}
        <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-[#0b0f17] via-[#0b0f17]/95 to-transparent pt-8 pb-6 px-4 md:px-8 z-20">
          <div className="max-w-4xl mx-auto">
            <div className="glass-panel p-2.5 rounded-2xl border border-white/15 shadow-2xl flex items-center gap-3 focus-within:border-indigo-500/50 transition-all">
              
              {/* Attachment Icon */}
              <button 
                onClick={() => {
                  setActiveTab('upload');
                  fileInputRef.current?.click();
                }}
                className="p-2.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors relative flex-shrink-0"
                title="Attach Document"
              >
                <PlusIcon className="w-5 h-5" />
              </button>

              {/* Selected File Badge or Helper Text */}
              <div className="flex-1 overflow-hidden">
                {file ? (
                  <div className="flex items-center gap-2 bg-indigo-600/20 border border-indigo-500/40 text-indigo-200 px-3 py-1.5 rounded-lg w-fit text-xs font-semibold">
                    <DocumentTextIcon className="w-4 h-4 text-indigo-400" />
                    <span className="truncate max-w-[200px] sm:max-w-[350px]">{file.name}</span>
                    <button onClick={() => setFile(null)} className="hover:text-red-400 ml-1">
                      <XMarkIcon className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <input 
                    type="text"
                    placeholder="Upload document or paste text above, then click summarize..."
                    value={textInput}
                    onChange={(e) => {
                      setActiveTab('text');
                      setTextInput(e.target.value);
                    }}
                    className="w-full bg-transparent text-sm text-gray-100 placeholder:text-gray-500 focus:outline-none"
                  />
                )}
              </div>

              {/* Summary Length Selector Pill */}
              <div className="hidden sm:flex items-center bg-slate-900/80 border border-white/10 rounded-lg p-1 text-[11px] font-medium text-gray-400">
                {['short', 'medium', 'detailed'].map((len) => (
                  <button
                    key={len}
                    onClick={() => setSummaryLength(len)}
                    className={`px-2.5 py-1 rounded-md capitalize transition-all ${
                      summaryLength === len ? 'bg-indigo-600 text-white font-semibold' : 'hover:text-white'
                    }`}
                  >
                    {len}
                  </button>
                ))}
              </div>

              {/* Action Submit Button */}
              <button 
                onClick={handleSummarize}
                disabled={(!file && !textInput.trim()) || isLoading}
                className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all duration-200 flex-shrink-0 ${
                  (file || textInput.trim()) && !isLoading 
                    ? 'bg-gradient-to-r from-indigo-600 to-cyan-500 text-white shadow-lg shadow-indigo-600/30 hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.98]' 
                    : 'bg-white/5 text-gray-500 cursor-not-allowed border border-white/5'
                }`}
              >
                <SparklesIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Summarize</span>
              </button>

            </div>
            
            <p className="text-center text-[11px] text-gray-500 mt-2 font-medium">
              Powered by Custom AI Summarizer Engine • Double check critical legal/financial info
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default UploadPage;