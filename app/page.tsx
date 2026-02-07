"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Check,
  Calendar,
  Mail,
  Sparkles,
  MousePointer2,
  Send,
  Phone,
  ListChecks,
} from "lucide-react";
import { toast } from "sonner";
import ConnectButton from "@/components/ConnectButton";

// --- Subcomponents ---

const ChaosBackground = () => {
  interface IOSNotificationProps {
    app: string;
    message: string;
    time: string;
    style: string;
  }

  const IOSNotification = ({
    app,
    message,
    time,
    style,
  }: IOSNotificationProps) => (
    <div
      className={`absolute bg-white p-3 rounded-xl shadow-lg border border-slate-200 w-64 flex items-start gap-3 z-0 ${style}`}
    >
      <div
        className={`w-9 h-9 rounded-lg shrink-0 flex items-center justify-center text-white font-bold text-[10px] shadow-sm
        ${
          app === "ParentSquare"
            ? "bg-green-500"
            : app === "TeamSnap"
            ? "bg-orange-500"
            : app === "ClassDojo"
            ? "bg-emerald-500"
            : app === "Remind"
            ? "bg-blue-500"
            : "bg-indigo-500"
        }`}
      >
        {app.slice(0, 2).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-baseline mb-0.5">
          <span className="font-semibold text-xs text-slate-900 uppercase tracking-tight">
            {app}
          </span>
          <span className="text-[10px] text-slate-400">{time}</span>
        </div>
        <p className="text-xs text-slate-600 leading-snug font-medium line-clamp-2">
          {message}
        </p>
      </div>
    </div>
  );

  interface EmailSnippetProps {
    sender: string;
    subject: string;
    style: string;
  }

  const EmailSnippet = ({ sender, subject, style }: EmailSnippetProps) => (
    <div
      className={`absolute bg-white p-4 rounded-lg shadow-md border border-slate-200 w-60 ${style}`}
    >
      <div className="flex items-center gap-2 mb-2 border-b border-slate-100 pb-2">
        <Mail className="w-3 h-3 text-slate-400" />
        <span className="text-xs font-bold text-slate-700 truncate">
          {sender}
        </span>
      </div>
      <div className="text-xs font-semibold text-slate-900 mb-1 line-clamp-1">
        {subject}
      </div>
      <div className="space-y-1 opacity-50">
        <div className="h-1.5 bg-slate-200 rounded w-full"></div>
        <div className="h-1.5 bg-slate-200 rounded w-2/3"></div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Chaos Messages - Low opacity and grayscale for readability */}
      <div className="absolute inset-0 opacity-[0.08] grayscale">
        <IOSNotification
          app="ParentSquare"
          message="Urgent: Bus 42 running 15 mins late due to traffic."
          time="Now"
          style="top-[10%] left-[5%] -rotate-6"
        />
        <IOSNotification
          app="TeamSnap"
          message="Game time changed to 9:00 AM vs Tigers."
          time="2m ago"
          style="top-[15%] right-[8%] rotate-12"
        />
        <IOSNotification
          app="ClassDojo"
          message="Mrs. K shared a new photo of Sara's project."
          time="15m ago"
          style="top-[45%] left-[15%] rotate-3"
        />
        <EmailSnippet
          sender="Konstella"
          subject="Volunteer Signups Closing Soon for Art Docent"
          style="bottom-[30%] right-[10%] -rotate-3"
        />
        <IOSNotification
          app="BrightWheel"
          message="Mike checked in at 8:05 AM."
          time="1h ago"
          style="bottom-[20%] left-[8%] -rotate-12"
        />
        <IOSNotification
          app="Remind"
          message="Don't forget library books tomorrow!"
          time="5m ago"
          style="top-[25%] right-[25%] rotate-6"
        />
        <IOSNotification
          app="BAND"
          message="RSVP for End of Season Party due today."
          time="1h ago"
          style="top-[60%] left-[5%] -rotate-2"
        />
        <IOSNotification
          app="Seesaw"
          message="New item added to Sara's journal."
          time="Now"
          style="bottom-[40%] right-[5%] rotate-4"
        />
        <EmailSnippet
          sender="Bloomz"
          subject="Supply List Update: Glue Sticks Needed"
          style="top-[35%] left-[30%] rotate-12"
        />
        <IOSNotification
          app="Schoology"
          message="New Assignment: History Project due Friday."
          time="30m ago"
          style="bottom-[10%] left-[30%] -rotate-3"
        />
        <IOSNotification
          app="SchoolStatus"
          message="Attendance Notice: Please verify absence."
          time="2h ago"
          style="top-[5%] right-[35%] rotate-2"
        />
        <EmailSnippet
          sender="ClassTag"
          subject="Parent-Teacher Conference Signups"
          style="top-[50%] right-[30%] -rotate-6"
        />
      </div>

      {/* Blurred Blobs - Kept independent of the chaos opacity */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-100/50 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-purple-100/50 rounded-full blur-3xl -z-10" />
    </div>
  );
};

interface FadeInProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}

const FadeIn = ({ children, delay = 0, className = "" }: FadeInProps) => (
  <div className={className}>{children}</div>
);

interface FeatureCardProps {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  color: string;
  iconContent?: React.ReactNode;
  iconWrapperClass?: string;
}

const FeatureCard = ({
  icon: Icon,
  title,
  description,
  color,
  iconContent,
  iconWrapperClass,
}: FeatureCardProps) => (
  <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
    <div
      className={`h-12 rounded-xl flex items-center justify-center mb-6 ${color} relative overflow-hidden ${
        iconWrapperClass || "w-12"
      }`}
    >
      {iconContent
        ? iconContent
        : Icon && <Icon className="w-6 h-6 text-white" />}
    </div>
    <h3 className="text-xl font-bold text-slate-900 mb-3">{title}</h3>
    <p className="text-slate-600 leading-relaxed">{description}</p>
  </div>
);

const PortalIcons = () => (
  <div className="flex items-center justify-center gap-3 w-full h-full px-1">
    <img
      src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/694066209015b91c711a96a6/5223fcf2d_PS.png"
      alt="ParentSquare"
      className="w-8 h-8 rounded-md"
    />
    <img
      src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/694066209015b91c711a96a6/e967cd324_cd.jpeg"
      alt="ClassDojo"
      className="w-8 h-8 rounded-full"
    />
    <img
      src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/694066209015b91c711a96a6/4fcaaa027_bw.png"
      alt="Brightwheel"
      className="w-8 h-8 rounded-md"
    />
  </div>
);

const ActionIcons = () => (
  <div className="flex items-center justify-center gap-3 w-full h-full">
    <MousePointer2 className="w-5 h-5 text-white/90 fill-white stroke-purple-500" />
    <div className="w-8 h-8 bg-indigo-400 rounded-full flex items-center justify-center border border-indigo-300 shadow-sm">
      <Send className="w-4 h-4 text-white" />
    </div>
    <div className="w-8 h-8 bg-emerald-400 rounded-full flex items-center justify-center border border-emerald-300 shadow-sm">
      <Phone className="w-4 h-4 text-white" />
    </div>
  </div>
);

const CalendarMockup = () => (
  <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden text-slate-800 font-sans">
    {/* Calendar Header */}
    <div className="bg-white border-b border-slate-100 p-4 flex justify-between items-center">
      <div className="font-bold text-lg text-slate-900">Tuesday, Dec 16</div>
      <div className="flex gap-2">
        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">
          D
        </div>
        <div className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-xs text-slate-400">
          W
        </div>
        <div className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-xs text-slate-400">
          M
        </div>
      </div>
    </div>

    {/* Calendar Body */}
    <div className="p-4 space-y-3 bg-slate-50 min-h-[340px]">
      {/* Time slot */}
      <div className="flex gap-3">
        <div className="w-12 text-xs text-slate-400 text-right pt-2 font-medium">
          8:00 AM
        </div>
        <div className="flex-1">
          <div className="bg-indigo-100 border-l-4 border-indigo-500 p-2.5 rounded-r-lg text-sm mb-1 shadow-sm relative overflow-hidden">
            <div className="font-bold text-indigo-900">Drop off Sara</div>
            <div className="text-xs text-indigo-700 font-medium">School</div>
            <div className="absolute top-2 right-2 bg-indigo-200 text-indigo-800 text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
              Location Updated
            </div>
          </div>
        </div>
      </div>

      {/* Task inserted in timeline */}
      <div className="flex gap-3 group">
        <div className="w-12 text-xs text-slate-400 text-right pt-2 font-medium">
          9:00 AM
        </div>
        <div className="flex-1">
          <div className="bg-white border border-emerald-200 shadow-sm p-3 rounded-lg flex items-center gap-3 transition-transform hover:scale-[1.02]">
            <div className="w-5 h-5 rounded border-2 border-emerald-500 flex items-center justify-center cursor-pointer bg-emerald-50">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <div>
              <div className="font-bold text-slate-700 text-sm line-through decoration-slate-400 text-slate-400">
                Sign Permission Slip
              </div>
              <div className="text-[10px] text-emerald-600 font-bold uppercase tracking-wide flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Auto-added from Newsletters while nothing
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-3 h-12">
        <div className="w-12 text-xs text-slate-400 text-right pt-2 font-medium">
          1:00 am
        </div>
        <div className="flex-1 border-t border-slate-200 border-dashed mt-4"></div>
      </div>

      <div className="flex gap-3">
        <div className="w-12 text-xs text-slate-400 text-right pt-2 font-medium">
          3:30 PM
        </div>
        <div className="flex-1">
          <div className="bg-purple-100 border-l-4 border-purple-500 p-2.5 rounded-r-lg text-sm relative overflow-hidden shadow-sm">
            <div className="font-bold text-purple-900">Soccer Practice</div>
            <div className="text-xs text-purple-700 font-medium">
              Fields 4 & 5
            </div>
            <div className="absolute top-2 right-2 bg-purple-200 text-purple-800 text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
              Time Slot Updated
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <div className="w-12 text-xs text-slate-400 text-right pt-2 font-medium">
          5:00 PM
        </div>
        <div className="flex-1">
          <div className="bg-white border border-slate-200 shadow-sm p-3 rounded-lg flex items-center gap-3">
            <div className="w-5 h-5 rounded border-2 border-slate-300 hover:border-slate-400 cursor-pointer"></div>
            <div>
              <div className="font-bold text-slate-700 text-sm">
                Buy Snack for Game
              </div>
              <div className="text-[10px] text-rose-500 font-bold uppercase tracking-wide">
                Due Tomorrow
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// --- Main Page Component ---

export default function Home() {
  const router = useRouter();

  // Handle Unipile session parameter redirects and error parameters
  // NOTE: Legacy Google OAuth (Supabase Auth) redirects have been removed
  // All new signups should use Unipile OAuth flow via /api/auth/unipile/connect
  useEffect(() => {
    // Check URL for parameters (client-side only)
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const error = urlParams.get("error");
      const errorDescription = urlParams.get("error_description");
      const session = urlParams.get("session");
      const code = urlParams.get("code"); // Legacy Supabase OAuth code - deprecated

      // Handle Unipile session parameter - redirect to whatwefound
      if (session) {
        router.replace(`/whatwefound?session=${session}`);
        return;
      }

      // Legacy Google OAuth code - redirect to Unipile flow instead
      if (code) {
        console.warn(
          "⚠️ Legacy Google OAuth detected. Redirecting to Unipile flow."
        );
        // Clean URL and redirect to Unipile connect
        router.replace("/api/auth/unipile/connect");
        return;
      }

      // Handle OAuth errors (from Unipile or legacy)
      if (error) {
        const errorCode = urlParams.get("error_code");
        console.error("OAuth error detected:", {
          error,
          errorCode,
          errorDescription,
        });

        // Clean URL by removing error parameters
        const cleanUrl = new URL(window.location.href);
        cleanUrl.searchParams.delete("error");
        cleanUrl.searchParams.delete("error_code");
        cleanUrl.searchParams.delete("error_description");
        router.replace(cleanUrl.pathname + cleanUrl.search);

        // Show user-friendly error message
        let errorMessage = "OAuth connection failed. Please try again.";
        if (errorCode === "bad_oauth_state") {
          errorMessage =
            "Authentication session expired. Please try signing in again.";
        } else if (errorDescription) {
          errorMessage = errorDescription.replace(/\+/g, " ");
        }
        toast.error(errorMessage);
      }
    }
  }, [router]);
  return (
    <div className="relative min-h-screen">
      {/* Header with Logo */}
      <header className="relative z-50 bg-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img
                src="/logo.png"
                alt="bippity.boo"
                className="w-auto h-[100px] object-contain"
              />
              <span className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                bippity.boo
              </span>
            </div>
            <nav className="hidden sm:flex items-center gap-6">
              <a
                href="#how-it-works"
                className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                How it works
              </a>
              <a
                href="#privacy"
                className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                Privacy
              </a>
            </nav>
          </div>
        </div>
      </header>

      <ChaosBackground />

      {/* Hero Section */}
      <section className="relative pt-8 pb-20 lg:pt-12 lg:pb-32 bg-transparent z-10">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full overflow-hidden pointer-events-none -z-10">
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-purple-100/30 rounded-full blur-3xl -translate-y-1/2" />
          <div className="absolute top-20 right-1/4 w-[400px] h-[400px] bg-indigo-50/30 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <FadeIn>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-sm font-medium mb-8">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                </span>
                Accepting early access users
              </div>
              <h1 className="text-5xl lg:text-7xl font-bold tracking-tight text-slate-900 mb-8 leading-[1.1]">
                Stay on top of everything without{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                  reading any of it.
                </span>
              </h1>
              <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
                School. Soccer. Ballet. I find what's relevant to your kid,
                update your calendar, create tasks, and catch conflicts — so you
                don't have to read every message.
              </p>
              <div className="border-2 flex flex-col items-center justify-center gap-4">
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <ConnectButton />
                  <a
                    href="/waitlist"
                    className="text-sm font-medium text-indigo-600 hover:text-indigo-700 underline underline-offset-4 transition-colors"
                  >
                    Get on waiting list
                  </a>
                </div>
                <p className="text-sm text-slate-500">
                  Less time in email. <br className="hidden sm:block" /> More
                  quality time.
                </p>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* "Not Another App" Section */}
      <section className="py-12 bg-slate-50 border-y border-slate-100 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl font-bold text-slate-900 mb-6">
                Not Another App to Check
              </h2>
              <p className="text-lg text-slate-600 mb-12">
                I work inside what you already use. No new login. No new place
                to check. Your calendar just starts being right.
              </p>
              <div className="flex justify-center gap-8 lg:gap-16 opacity-70 grayscale hover:grayscale-0 transition-all duration-500">
                <div className="flex items-center gap-2 text-xl font-bold text-slate-700">
                  <img
                    src="https://upload.wikimedia.org/wikipedia/commons/7/7e/Gmail_icon_%282020%29.svg"
                    className="w-8 h-8"
                    alt="Gmail"
                  />
                  Gmail
                </div>
                <div className="flex items-center gap-2 text-xl font-bold text-slate-700">
                  <img
                    src="https://upload.wikimedia.org/wikipedia/commons/a/a5/Google_Calendar_icon_%282020%29.svg"
                    className="w-8 h-8"
                    alt="Calendar"
                  />
                  Calendar
                </div>
                <div className="flex items-center gap-2 text-xl font-bold text-slate-700">
                  <img
                    src="https://upload.wikimedia.org/wikipedia/commons/5/5b/Google_Tasks_2021.svg"
                    className="w-8 h-8"
                    alt="Tasks"
                  />
                  Tasks
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* The Problem Section */}
      <section className="py-24 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Visual Column */}
            <FadeIn>
              <div className="relative w-full max-w-sm mx-auto lg:mx-0 lg:ml-auto">
                <div className="bg-white p-8 rounded-xl shadow-xl border border-indigo-100 transform transition-all duration-500 hover:scale-105">
                  <div className="absolute -top-3 -right-3 w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                    <div className="w-3 h-3 bg-white rounded-full"></div>
                  </div>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center">
                      <Mail className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                      <div className="font-bold text-xl text-slate-900">
                        School Newsletter
                      </div>
                      <div className="text-sm text-slate-500">
                        1000 words • 5 mins read
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="h-3 w-full bg-slate-100 rounded-full"></div>
                    <div className="h-3 w-full bg-slate-100 rounded-full"></div>
                    <div className="h-3 w-5/6 bg-slate-100 rounded-full"></div>
                    <div className="p-5 bg-indigo-50 border border-indigo-100 rounded-xl mt-6 relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
                      <p className="text-lg text-indigo-900 font-medium leading-relaxed">
                        "Somewhere in here is a permission slip due tomorrow."
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </FadeIn>

            {/* Text Column */}
            <FadeIn>
              <h2 className="text-3xl font-bold text-slate-900 mb-6">
                The Problem
              </h2>
              <p className="text-xl text-slate-600 leading-relaxed mb-8">
                The school newsletter is 1000 words. One sentence is about your
                kid's class. Multiply that by two kids, six activities, and a
                job — and something's going to slip.
              </p>

              <h3 className="text-2xl font-bold text-slate-900 mb-4">
                It's not you. It's just not humanly possible.
              </h3>
              <p className="text-lg text-slate-600 leading-relaxed border-l-4 border-indigo-300 pl-6 italic">
                That background anxiety — "did I miss something?" — follows you
                everywhere.
              </p>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* How It Works (What I Actually Do) */}
      <section
        id="how-it-works"
        className="py-24 bg-slate-900 text-white relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-20 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-indigo-600 rounded-full blur-[120px]" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              What I Actually Do
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              I act as your personal filter and executive assistant for your
              kids' lives.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
            <FadeIn className="space-y-8">
              <div className="flex gap-6">
                <div className="w-12 h-12 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0 border border-indigo-500/30">
                  <Mail className="w-6 h-6 text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">
                    Find what's relevant to YOUR kid
                  </h3>
                  <p className="text-slate-400">
                    I ask Gmail for emails about "Grade 1" or "AYSO Playground"
                    — not your whole inbox. I find the one line that matters,
                    not the 1000-word newsletter.
                  </p>
                </div>
              </div>

              <div className="flex gap-6">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 border border-emerald-500/30">
                  <Calendar className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">
                    One view for everything
                  </h3>
                  <p className="text-slate-400">
                    Practice changes? Updated. Permission slip due? Task
                    created. I put everything on your calendar so you can stop
                    cross-referencing five different apps.
                  </p>
                </div>
              </div>
            </FadeIn>

            <FadeIn className="relative">
              <CalendarMockup />
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Privacy Section */}
      <section id="privacy" className="py-24 bg-white relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-slate-900 mb-6">
              "But you're reading my email?"
            </h2>
            <p className="text-lg text-slate-600 leading-relaxed">
              Your privacy comes first. We only see what we need to - we set up
              our Gmail integration to filter out sensitive content before it
              ever reaches us. Faster for everyone, safer for everyone. And yes,
              I run on a SOC2 Type II certified platform.
            </p>
          </div>
        </div>
      </section>

      {/* Coming Soon Section */}
      <section className="py-24 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-indigo-600 font-semibold tracking-wider text-sm uppercase">
              Roadmap
            </span>
            <h2 className="text-3xl font-bold text-slate-900 mt-2 mb-4">
              Coming Soon
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              You've probably got 5+ apps to check. It doesn't make sense to
              check them all, all the time.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <FeatureCard
              color="bg-slate-100"
              iconContent={<PortalIcons />}
              iconWrapperClass="w-36"
              title="Portal Access"
              description="I'll check your school and activity portals too — same filtering, same calendar updates. Supports ParentSquare, Konstella, and more."
            />
            <FeatureCard
              color="bg-purple-500"
              iconContent={<ActionIcons />}
              iconWrapperClass="w-36"
              title="Act on your behalf"
              description="RSVP to the party. Sign up for volunteer slot. Message teacher about absence. With your approval — I handle the busywork."
            />
            <FeatureCard
              icon={ListChecks}
              color="bg-emerald-500"
              title="Offer solutions"
              description="Schedule conflict options: A) reschedule piano lesson B) skip soccer C) ask Jane's dad to swap carpool duty this afternoon."
            />
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 bg-white text-center relative z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-8">
              Let someone else <br className="lg:hidden" />{" "}
              <span className="text-indigo-600">keep track for once</span>
            </h2>
            <div className="flex flex-col items-center gap-6">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <ConnectButton className="px-10 py-5 text-xl" />
                <a
                  href="/waitlist"
                  className="text-base font-medium text-indigo-600 hover:text-indigo-700 underline underline-offset-4 transition-colors"
                >
                  Get on waiting list
                </a>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              <span className="font-bold text-lg text-white">bippity.boo</span>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <a
                href="/privacy"
                className="text-slate-400 hover:text-white transition-colors"
              >
                Privacy Policy
              </a>
              <a
                href="/terms"
                className="text-slate-400 hover:text-white transition-colors"
              >
                Terms of Service
              </a>
            </div>
            <div className="text-sm text-slate-500">
              © {new Date().getFullYear()} Bippity.boo. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
