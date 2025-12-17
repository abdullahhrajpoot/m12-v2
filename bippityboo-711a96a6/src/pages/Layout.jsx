
import React from 'react';
import { motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import ConnectButton from '@/components/ConnectButton';

export default function Layout({ children }) {
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
      <nav className="fixed w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="bg-indigo-600 p-1.5 rounded-lg group-hover:bg-indigo-500 transition-colors">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl tracking-tight text-slate-900">bippity.boo</span>
            </Link>
            {isHome && (
              <div className="hidden md:flex items-center space-x-8">
                <a href="#how-it-works" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">How it Works</a>
                <a href="#privacy" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">Privacy</a>
                <ConnectButton className="bg-slate-900 text-white px-5 py-2 rounded-full text-sm font-medium hover:bg-slate-800 transition-all hover:shadow-lg hover:shadow-indigo-500/20">
                  Get Started
                </ConnectButton>
              </div>
            )}
          </div>
        </div>
      </nav>
      <main className="pt-16">
        {children}
      </main>
      <footer className="bg-slate-900 text-slate-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <span className="font-bold text-lg text-white">bippity.boo</span>
          </div>
          <div className="text-sm">
            © {new Date().getFullYear()} Bippity.boo. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
