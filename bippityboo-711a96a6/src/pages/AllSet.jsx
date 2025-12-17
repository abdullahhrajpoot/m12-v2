import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Mail, MessageSquare, ArrowRight, Clock, Search, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AllSet() {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="max-w-2xl w-full">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-slate-100 text-center"
        >
          <div className="inline-flex items-center justify-center p-4 bg-indigo-50 rounded-full mb-8">
            <Sparkles className="w-8 h-8 text-indigo-600" />
          </div>
          
          <h1 className="text-4xl font-bold text-slate-900 mb-6">Perfect, I'm on it ✨</h1>
          
          <p className="text-lg text-slate-600 mb-8 leading-relaxed">
            I'll start with scanning your emails from the last 30 days with all your family context in mind and start adding events and to-dos to your calendar automatically. After that I'll check every 5 minutes for new relevant emails.
          </p>

          <div className="bg-slate-50 rounded-2xl p-8 text-left border border-slate-100 mb-8">
            <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Mail className="w-5 h-5 text-indigo-500" />
              How to reach me
            </h3>
            
            <p className="text-slate-600 mb-6">
              Email <a href="mailto:fgm@bippity.boo" className="text-indigo-600 font-semibold hover:underline">fgm@bippity.boo</a> anytime:
            </p>

            <div className="space-y-4 mb-8">
              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center shrink-0 mt-0.5">
                  <Search className="w-4 h-4 text-slate-400" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900">Ask me anything</div>
                  <div className="text-slate-500 italic">"What's this week look like?"</div>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center shrink-0 mt-0.5">
                  <MessageSquare className="w-4 h-4 text-slate-400" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900">Give me instructions</div>
                  <div className="text-slate-500 italic">"Stop tracking soccer"</div>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center shrink-0 mt-0.5">
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900">Forward an email</div>
                  <div className="text-slate-500">And I'll handle it</div>
                </div>
              </div>
            </div>


          </div>
          
          <Link to="/" className="inline-flex items-center text-sm font-medium text-slate-400 hover:text-indigo-600 transition-colors">
            Return to home
          </Link>
        </motion.div>
      </div>
    </div>
  );
}