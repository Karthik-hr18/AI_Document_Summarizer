import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpenIcon, BoltIcon, ShieldCheckIcon, SparklesIcon } from '@heroicons/react/24/solid';

export default function RootPage() {
  return (
    // 1. Main container (fixed inset still ensures scrollable background covers entire screen)
    <div className="fixed inset-0 w-full h-full text-white overflow-y-auto overflow-x-hidden
                   bg-[url(/ai-graphicmain.jpg)] bg-cover bg-center bg-no-repeat bg-fixed
                   font-['Segoe_UI',_sans-serif]">

      {/* 2. Background IMAGE container (The "Box") */}
      <div className='flex justify-center'>
        {/* MODIFIED: Added max-w-4xl, mx-auto, my-12, and rounded-xl */}
        <div
          className="relative w-full max-w-5xl mx-auto my-12 md:my-20 
                     bg-[url(/ai-graphic2.jpg)] bg-cover bg-center bg-no-repeat 
                     rounded-xl shadow-2xl overflow-hidden" // Added shadow and overflow-hidden for better box look
        >
          {/* Subtle overlay for the image */}
          <div className="absolute inset-0 bg-black/40 lg:bg-black/30 z-0"></div>

          {/* 3. Navigation Bar (inside the image box) */}
          <nav className="relative z-10 w-full p-6 flex justify-between items-center">
            {/* Logo/Brand */}
            <Link to="/" className="flex items-center gap-2 group">
              <BookOpenIcon className="w-8 h-8 text-white transition-transform group-hover:rotate-6" />
              <span className="font-bold text-2xl tracking-tight">Personalized AI</span>
            </Link>

            {/* Auth Links */}
            <div className="flex gap-2 sm:gap-4 items-center">
              <Link
                to="/login"
                className="text-white font-medium px-4 py-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="bg-white text-[#1e3c72] font-bold px-4 py-2 rounded-lg shadow-md hover:bg-gray-200 transition-colors"
              >
                Sign Up
              </Link>
            </div>
          </nav>

          {/* 4. Hero Section (inside the image box) */}
          <main className="relative z-10 p-6 pt-0 flex flex-col md:flex-row items-center">

            {/* Left Column: Text Content & CTA */}
            <div className="md:w-full text-center md:text-left py-16"> {/* Added vertical padding (py-16) to increase height slightly */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight">
                Summarize Your Documents Instantly
              </h1>
              <p className="mt-6 text-lg text-gray-200 max-w-xl mx-auto md:mx-0">
                Stop drowning in text. Our advanced AI condenses any document into a concise,
                readable summary, extracting key insights so you can work smarter, not harder.
              </p>

              {/* Call-to-Action (CTA) Button */}
              <Link
                to="/register"
                className="mt-10 inline-block bg-white text-[#1e3c72] font-bold text-lg px-8 py-4 rounded-xl shadow-xl
                            hover:bg-gray-200 transform hover:-translate-y-1 transition-all duration-300 ease-in-out"
              >
                Get Started for Free
              </Link>
            </div>

            {/* Right Column: Empty, shows background image */}
            {/* Removed the right column width settings since we only have content in the left */}
            <div>
            </div>
          </main>
        </div>
      </div> {/* END of the background image container */}


      <hr className="my-10 border-t border-white/20" />

      {/* 5. Features Section (OUTSIDE the image box) */}
      <section className="relative z-10 w-full pb-20">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 p-6">

          {/* Feature Card 1 */}
          <div className="bg-white/10 p-6 rounded-xl shadow-lg backdrop-blur-sm border border-white/20 text-center">
            <SparklesIcon className="w-12 h-12 text-white mx-auto" />
            <h3 className="font-bold text-xl text-white mt-4">Highly Accurate</h3>
            <p className="mt-2 text-gray-300">
              Powered by our custom NLP model to capture key concepts and context.
            </p>
          </div>

          {/* Feature Card 2 */}
          <div className="bg-white/10 p-6 rounded-xl shadow-lg backdrop-blur-sm border border-white/20 text-center">
            <BoltIcon className="w-12 h-12 text-white mx-auto" />
            <h3 className="font-bold text-xl text-white mt-4">Fast & Efficient</h3>
            <p className="mt-2 text-gray-300">
              Get summaries in seconds. Supports PDF, DOCX, and TXT files.
            </p>
          </div>

          {/* Feature Card 3 */}
          <div className="bg-white/10 p-6 rounded-xl shadow-lg backdrop-blur-sm border border-white/20 text-center">
            <ShieldCheckIcon className="w-12 h-12 text-white mx-auto" />
            <h3 className="font-bold text-xl text-white mt-4">Secure & Private</h3>
            <p className="mt-2 text-gray-300">
              Your documents are encrypted and never stored without your permission.
            </p>
          </div>

        </div>
      </section>

      {/* 6. Footer */}
      <footer className="relative z-10 w-full text-center p-6 text-gray-300 text-sm bg-black/20 backdrop-blur-sm">
        &copy; {new Date().getFullYear()} All rights reserved.
      </footer>

    </div>
  );
}