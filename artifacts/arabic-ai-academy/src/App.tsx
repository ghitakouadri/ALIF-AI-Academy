import { useEffect, useMemo, useRef, useState } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { ClerkProvider, SignIn, SignUp, useAuth, useClerk, useUser } from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { shadcn } from '@clerk/themes';
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Check,
  ChevronLeft,
  CircleAlert,
  Clock3,
  Film,
  History,
  LogOut,
  Menu,
  Play,
  Quote,
  Sparkles,
  X,
} from 'lucide-react';
import {
  getListLessonCommentsQueryKey,
  getListLessonsQueryKey,
  getListRecentActivityQueryKey,
  type ActivityLogEntry,
  type Lesson,
  type LessonComment,
  useCreateLessonComment,
  useListLessonComments,
  useListLessons,
  useListRecentActivity,
  useRecordActivity,
} from '@workspace/api-client-react';
import { Link, Redirect, Route, Switch, Router as WouterRouter, useLocation } from 'wouter';
import { ErrorBoundary } from '@/components/error-boundary';
import NotFound from '@/pages/not-found';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';

const queryClient = new QueryClient();
const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');
const clerkPubKey = publishableKeyFromHost(window.location.hostname, import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

function stripBase(path: string) {
  return basePath && path.startsWith(basePath) ? path.slice(basePath.length) || '/' : path;
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: 'clerk',
  options: {
    logoPlacement: 'inside' as const,
    logoLinkUrl: basePath || '/',
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: '#C89F53',
    colorForeground: '#0F1D24',
    colorMutedForeground: '#696C68',
    colorDanger: '#9E3A31',
    colorBackground: '#F6F4EE',
    colorInput: '#F0EBE1',
    colorInputForeground: '#0F1D24',
    colorNeutral: '#DFD7CB',
    fontFamily: 'Manrope, Noto Kufi Arabic, sans-serif',
    borderRadius: '1rem',
  },
  elements: {
    rootBox: 'w-full flex justify-center',
    cardBox: 'bg-[#F6F4EE] rounded-t-[3rem] rounded-b-3xl w-[440px] max-w-full overflow-hidden shadow-2xl shadow-[#0F1D24]/10 border border-[#DFD7CB]',
    card: '!shadow-none !border-0 !bg-transparent !rounded-none',
    footer: '!shadow-none !border-0 !bg-transparent !rounded-none',
    headerTitle: 'text-[#0F1D24] font-semibold',
    headerSubtitle: 'text-[#696C68]',
    socialButtonsBlockButtonText: 'text-[#0F1D24]',
    formFieldLabel: 'text-[#0F1D24]',
    footerActionLink: 'text-[#0F1D24] font-semibold',
    footerActionText: 'text-[#696C68]',
    dividerText: 'text-[#696C68]',
    identityPreviewEditButton: 'text-[#0F1D24]',
    formFieldSuccessText: 'text-[#255946]',
    alertText: 'text-[#9E3A31]',
    logoBox: 'h-14',
    logoImage: 'h-12 w-12 rounded-t-xl rounded-b-md',
    socialButtonsBlockButton: 'border-[#DFD7CB] bg-[#FCFBFA] hover:bg-[#EFEADF]',
    formButtonPrimary: 'bg-[#0F1D24] text-[#FCFBFA] hover:bg-[#1A2F39]',
    formFieldInput: 'border-[#DFD7CB] bg-[#FCFBFA] text-[#0F1D24]',
    footerAction: 'border-t border-[#DFD7CB] pt-5',
    dividerLine: 'bg-[#DFD7CB]',
    alert: 'border-[#E8BDB9] bg-[#F7E6E4]',
    otpCodeFieldInput: 'border-[#DFD7CB] bg-[#FCFBFA]',
    formFieldRow: 'gap-2',
    main: 'gap-5',
  },
};

type Language = 'en' | 'ar';

function Logo({ invert = false }: { invert?: boolean }) {
  return (
    <Link href="/" className="focus-ring inline-flex items-center gap-3" data-testid="link-brand-home">
      <span className={`grid size-10 place-items-center rounded-t-2xl rounded-b-lg ${invert ? 'bg-[#C89F53]' : 'bg-[#0F1D24]'}`}>
        <span className={`font-mono text-sm font-medium ${invert ? 'text-[#0F1D24]' : 'text-[#FCFBFA]'}`}>AI</span>
      </span>
      <span className={`leading-none ${invert ? 'text-[#FCFBFA]' : 'text-[#0F1D24]'}`}>
        <span className="block text-[13px] font-bold tracking-[0.14em]">ALIF AI</span>
        <span className={`mt-1 block text-[10px] tracking-[0.24em] ${invert ? 'text-[#C89F53]' : 'text-[#9C7A3C]'}`}>ACADEMY</span>
      </span>
    </Link>
  );
}

function LanguageToggle({ language, onChange }: { language: Language; onChange: (value: Language) => void }) {
  return (
    <div className="inline-flex rounded-full border border-[#DFD7CB] bg-[#F0EBE1] p-1" dir="ltr" data-testid="control-language-toggle">
      <button type="button" onClick={() => onChange('en')} className={`focus-ring rounded-full px-3 py-1.5 text-[11px] font-semibold transition ${language === 'en' ? 'bg-[#0F1D24] text-[#FCFBFA]' : 'text-[#696C68]'}`} data-testid="button-language-en">EN</button>
      <button type="button" onClick={() => onChange('ar')} className={`focus-ring rounded-full px-3 py-1.5 text-[11px] font-semibold transition ${language === 'ar' ? 'bg-[#0F1D24] text-[#FCFBFA]' : 'text-[#696C68]'}`} data-testid="button-language-ar">عربي</button>
    </div>
  );
}

function HomeRedirect() {
  const { isLoaded, isSignedIn } = useAuth();
  const [, setLocation] = useLocation();
  useEffect(() => {
    if (isLoaded && isSignedIn) setLocation('/user-portal');
  }, [isLoaded, isSignedIn, setLocation]);
  if (!isLoaded || isSignedIn) return <div className="grid min-h-[100dvh] place-items-center bg-[#F6F4EE]"><div className="skeleton h-2 w-20 rounded-full" /></div>;
  return <LandingPage />;
}

function LandingPage() {
  const [language, setLanguage] = useState<Language>('en');
  const isAr = language === 'ar';
  return (
    <div className="min-h-[100dvh] overflow-hidden bg-[#F6F4EE]" dir={isAr ? 'rtl' : 'ltr'}>
      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-5 py-6 sm:px-8 lg:px-12">
        <Logo />
        <nav className="hidden items-center gap-8 text-sm text-[#696C68] md:flex">
          <a href="#method" className="transition hover:text-[#0F1D24]" data-testid="link-nav-method">{isAr ? 'المنهج' : 'The method'}</a>
          <a href="#curriculum" className="transition hover:text-[#0F1D24]" data-testid="link-nav-curriculum">{isAr ? 'المحتوى' : 'Curriculum'}</a>
          <a href="#salon" className="transition hover:text-[#0F1D24]" data-testid="link-nav-salon">{isAr ? 'المجلس' : 'The salon'}</a>
        </nav>
        <div className="flex items-center gap-3">
          <LanguageToggle language={language} onChange={setLanguage} />
          <Link href="/sign-in" className="focus-ring hidden text-sm font-semibold text-[#0F1D24] sm:block" data-testid="link-sign-in">{isAr ? 'دخول' : 'Sign in'}</Link>
          <Link href="/sign-up" className="focus-ring rounded-full bg-[#0F1D24] px-4 py-2.5 text-sm font-semibold text-[#FCFBFA] shadow-[0_8px_24px_rgba(15,29,36,.14)] transition hover:-translate-y-0.5" data-testid="link-start-learning">{isAr ? 'ابدأ التعلّم' : 'Start learning'}</Link>
        </div>
      </header>

      <main>
        <section className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 pb-20 pt-10 sm:px-8 sm:pt-20 lg:grid-cols-[1.02fr_.98fr] lg:px-12 lg:pb-32 lg:pt-24">
          <div className="absolute -left-24 top-8 size-72 rounded-full bg-[#C89F53]/20 blur-3xl" />
          <div className={`relative z-10 animate-rise-in ${isAr ? 'font-arabic' : ''}`}>
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-[#DFD7CB] bg-[#FCFBFA]/80 px-3 py-2 text-[11px] font-semibold tracking-[0.12em] text-[#696C68] shadow-sm">
              <span className="size-1.5 rounded-full bg-[#255946]" />
              {isAr ? 'تعليم عملي، بنبرة هادئة' : 'PRACTICAL AI, QUIETLY TAUGHT'}
            </div>
            <h1 className={`max-w-2xl text-5xl font-semibold leading-[1.04] tracking-[-0.055em] text-[#0F1D24] sm:text-7xl lg:text-[6.25rem] ${isAr ? 'leading-[1.2] tracking-[-0.03em]' : ''}`} data-testid="text-hero-title">
              {isAr ? <>ذكاء اصطناعي<br /><span className="text-[#9C7A3C]">يُستخدم فعلاً.</span></> : <>Learn AI.<br /><span className="text-[#9C7A3C]">Use it well.</span></>}
            </h1>
            <p className={`mt-7 max-w-lg text-lg leading-8 text-[#696C68] ${isAr ? 'font-arabic text-base leading-9' : ''}`} data-testid="text-hero-description">
              {isAr ? 'أكاديمية صغيرة للمهنيين الذين يريدون أن يعمل الذكاء الاصطناعي معهم — لا أن يضيف ضجيجاً إلى يومهم.' : 'A small academy for professionals who want AI to work with them — not add more noise to the day.'}
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <Link href="/sign-up" className="focus-ring inline-flex items-center gap-3 rounded-full bg-[#0F1D24] px-6 py-3.5 text-sm font-semibold text-[#FCFBFA] transition hover:-translate-y-0.5" data-testid="link-hero-join">
                {isAr ? 'انضم إلى المجلس' : 'Join the salon'} <ArrowRight className="size-4" />
              </Link>
              <a href="#method" className="focus-ring inline-flex items-center gap-2 px-2 py-3 text-sm font-semibold text-[#0F1D24]" data-testid="link-hero-explore">
                {isAr ? 'اكتشف المنهج' : 'Explore the method'} <ChevronLeft className="size-4" />
              </a>
            </div>
            <div className="mt-12 flex items-center gap-6 text-xs text-[#696C68]">
              <span className="font-mono text-[#9C7A3C]">01 / 03</span>
              <span className="h-px w-16 bg-[#DFD7CB]" />
              <span>{isAr ? 'جلسات قصيرة. أثر طويل.' : 'Short sessions. Lasting practice.'}</span>
            </div>
          </div>
          <div className="relative min-h-[420px] animate-rise-in [animation-delay:120ms] lg:min-h-[560px]">
            <div className="academy-grid absolute inset-8 rounded-t-[10rem] rounded-b-[2.5rem] border border-[#DFD7CB] bg-[#EBE3D5]" />
            <div className="absolute right-0 top-0 h-[82%] w-[78%] overflow-hidden rounded-t-[10rem] rounded-b-[2.5rem] bg-[#E9DAB8] shadow-2xl shadow-[#0F1D24]/15 border border-[#C89F53]/30">
              <img src={`${basePath}/andalusian-arch.png`} alt="Ornate Andalusian arch with turquoise and floral details" className="absolute inset-0 size-full object-cover object-top" />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#091115]/90" />
              <div className="absolute left-10 top-10 rounded-full bg-[#FCFBFA]/80 px-3 py-2 font-mono text-[10px] tracking-[.32em] text-[#725625] shadow-sm backdrop-blur-sm">FIELD NOTES / 001</div>
              <div className="absolute bottom-10 left-10 right-10">
                <div className="mb-5 h-px bg-[#FCFBFA]/20" />
                <div className="flex items-end justify-between">
                  <div><div className="text-4xl font-semibold tracking-[-.05em] text-[#FCFBFA]">AI, <em className="font-serif font-normal text-[#C89F53]">in practice.</em></div><div className="mt-2 text-xs text-[#A1A6A1]">ALIF AI Academy</div></div>
                  <div className="grid size-14 place-items-center rounded-t-2xl rounded-b-xl border border-[#C89F53]/50 bg-[#C89F53]/10"><Sparkles className="size-5 text-[#C89F53]" /></div>
                </div>
              </div>
            </div>
            <div className="animate-float-soft absolute bottom-4 left-0 w-[58%] rounded-t-[2.5rem] rounded-b-[1.5rem] border border-[#DFD7CB] bg-[#FCFBFA] p-5 shadow-xl shadow-[#0F1D24]/10">
              <div className="flex items-center justify-between text-[10px] font-semibold tracking-[.16em] text-[#696C68]"><span>LESSON 01</span><span className="font-mono text-[#9C7A3C]">08:42</span></div>
              <div className="mt-5 text-lg font-semibold leading-snug text-[#0F1D24]">Give your thinking<br /><span className="font-serif text-xl font-normal text-[#9C7A3C]">a better tool.</span></div>
              <div className="mt-5 flex items-center gap-2"><span className="grid size-7 place-items-center rounded-full bg-[#C89F53]"><Play className="ml-0.5 size-3 fill-[#0F1D24] text-[#0F1D24]" /></span><span className="text-xs text-[#696C68]">Watch the first lesson</span></div>
            </div>
          </div>
        </section>

        <section id="method" className="border-y border-double border-[3px] border-[#DFD7CB] bg-[#EFEADF] px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
          <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[.75fr_1.25fr] lg:gap-24">
            <div><div className="font-mono text-[11px] tracking-[.24em] text-[#9C7A3C]">THE METHOD</div><h2 className="mt-5 max-w-sm text-4xl font-semibold leading-tight tracking-[-.045em] text-[#0F1D24] sm:text-5xl">{isAr ? 'نحن نعلّم العادة، لا الأداة.' : 'We teach the habit, not the hype.'}</h2></div>
            <div className="grid gap-10 sm:grid-cols-3">
              {[['01', isAr ? 'افهم' : 'Understand', isAr ? 'فكرة واضحة قبل زر جديد.' : 'A clear idea before a new button.'], ['02', isAr ? 'جرّب' : 'Practice', isAr ? 'أمثلة من العمل الحقيقي.' : 'Examples from real working days.'], ['03', isAr ? 'احتفظ' : 'Keep', isAr ? 'نظام يعود إليك كل أسبوع.' : 'A system you return to each week.']].map(([num, title, copy]) => <div key={num} className="border-t border-[#D4CAB8] pt-5"><div className="font-mono text-xs text-[#9C7A3C]">{num}</div><h3 className={`mt-7 text-xl font-semibold text-[#0F1D24] ${isAr ? 'font-arabic' : ''}`}>{title}</h3><p className={`mt-3 text-sm leading-6 text-[#696C68] ${isAr ? 'font-arabic text-xs leading-7' : ''}`}>{copy}</p></div>)}
            </div>
          </div>
        </section>

        <section id="curriculum" className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-12 lg:py-32">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><div className="font-mono text-[11px] tracking-[.24em] text-[#9C7A3C]">THE CURRICULUM</div><h2 className="mt-4 text-4xl font-semibold tracking-[-.045em] text-[#0F1D24] sm:text-5xl">{isAr ? 'من الملاحظة إلى الإنجاز.' : 'From noticing to making.'}</h2></div><p className="max-w-xs text-sm leading-6 text-[#696C68]">{isAr ? 'مسار عملي من ستة دروس، مصمم ليُنجز في وقت القهوة.' : 'Six practical lessons, designed to fit inside a thoughtful coffee break.'}</p></div>
          <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {['The new AI literacy', 'Prompting as thinking', 'Your personal research desk', 'Writing with a second mind', 'Small automations, real relief', 'A practice you can keep'].map((title, index) => <div key={title} className={`group rounded-t-[4rem] rounded-b-3xl border p-7 transition hover:-translate-y-1 hover:shadow-lg ${index === 1 ? 'border-[#C89F53] bg-[#F7F0DF]' : 'border-[#DFD7CB] bg-[#FCFBFA]'}`}><div className="flex items-start justify-between"><span className="font-mono text-xs text-[#9C7A3C]">0{index + 1}</span><ArrowUpRight className="size-4 text-[#9C7A3C] opacity-0 transition group-hover:opacity-100" /></div><h3 className="mt-16 max-w-[12rem] text-lg font-semibold leading-snug text-[#0F1D24]">{title}</h3><div className="mt-6 flex items-center gap-2 text-xs text-[#696C68]"><Clock3 className="size-3.5" /> 8–14 minutes</div></div>)}
          </div>
        </section>

        <section id="salon" className="relative overflow-hidden bg-[#0F1D24] px-5 py-24 text-[#FCFBFA] sm:px-8 lg:px-12 lg:py-32">
          <div className="absolute right-[-10%] top-[-45%] size-[620px] rounded-full border border-[#C89F53]/20" /><div className="absolute right-[-2%] top-[-32%] size-[420px] rounded-full border border-[#C89F53]/20" />
          <div className="relative mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1fr_.8fr] lg:items-end"><div><Quote className="size-9 text-[#C89F53]" /><blockquote className="mt-7 max-w-2xl text-3xl font-medium leading-tight tracking-[-.035em] sm:text-5xl font-serif">“The best AI education feels less like a course, and more like finding a sharper colleague.”</blockquote><div className="mt-8 flex items-center gap-3 text-sm text-[#A1A6A1]"><span className="size-8 rounded-full border border-[#C89F53] bg-[#C89F53]/20" /><span>Made for curious professionals, everywhere.</span></div></div><div className="rounded-t-[3rem] rounded-b-2xl border border-[#FCFBFA]/15 bg-[#FCFBFA]/5 p-8 backdrop-blur"><div className="font-mono text-[11px] tracking-[.24em] text-[#C89F53]">A PRIVATE PLACE TO LEARN</div><p className="mt-5 text-sm leading-7 text-[#C0C5C1]">No noisy feeds. No performance theatre. Just good lessons, a calm interface, and a growing record of what you have put into practice.</p><Link href="/sign-up" className="focus-ring mt-7 inline-flex items-center gap-3 rounded-full bg-[#C89F53] px-5 py-3 text-sm font-semibold text-[#0F1D24] transition hover:bg-[#D4B066]" data-testid="link-salon-join">Enter the salon <ArrowRight className="size-4" /></Link></div></div>
        </section>
      </main>
      <footer className="mx-auto flex max-w-7xl flex-col gap-4 border-t border-[#DFD7CB] px-5 py-8 text-xs text-[#696C68] sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-12">
        <Logo />
        <div className="flex flex-col gap-2 sm:items-end">
          <span>© 2026 ALIF AI Academy. All rights reserved.</span>
          <a className="focus-ring transition hover:text-[#0F1D24]" href="mailto:ghitak+alifAIAcademy@gmail.com">ghitak+alifAIAcademy@gmail.com</a>
        </div>
      </footer>
    </div>
  );
}

function AuthPage({ mode }: { mode: 'in' | 'up' }) {
  return <div className="grid min-h-[100dvh] place-items-center bg-[#0F1D24] px-4 py-10"><div className="absolute left-5 top-6 sm:left-10 sm:top-8"><Logo invert /></div><div className="relative mt-8 w-full max-w-[440px]">{mode === 'in' ? <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} /> : <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />}</div></div>;
}

function PortalGate() {
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded) return <div className="grid min-h-[100dvh] place-items-center bg-[#F6F4EE]"><div className="skeleton h-2 w-20 rounded-full" /></div>;
  if (!isSignedIn) return <Redirect to="/" />;
  return <PortalPage />;
}

function formatActivity(entry: ActivityLogEntry, language: Language, lessons: Lesson[]) {
  const lesson = entry.lessonId === null ? undefined : lessons.find((item) => item.id === entry.lessonId);
  const lessonTitle = lesson ? (language === 'ar' ? lesson.titleAr : lesson.titleEn) : entry.lessonTitle;
  if (entry.eventType === 'video_watched') return language === 'ar' ? `شاهدت درس «${lessonTitle || 'بدون عنوان'}»` : `Watched “${lessonTitle || 'Untitled lesson'}”`;
  if (entry.eventType === 'sign_in') return language === 'ar' ? 'سجّلت الدخول إلى الأكاديمية' : 'Signed in to the academy';
  return language === 'ar' ? 'سجّلت الخروج' : 'Signed out';
}

function PortalPage() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const [, setLocation] = useLocation();
  const [language, setLanguage] = useState<Language>('en');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [watchSaved, setWatchSaved] = useState(false);
  const isAr = language === 'ar';
  const lessonQuery = useListLessons({ query: { queryKey: getListLessonsQueryKey() }, request: { credentials: 'include' } });
  const activityQuery = useListRecentActivity({ query: { enabled: true, queryKey: getListRecentActivityQueryKey() }, request: { credentials: 'include' } });
  const recordActivity = useRecordActivity({ request: { credentials: 'include' } });
  const lessons = lessonQuery.data ?? [];
  const selectedLesson = lessons.find((lesson) => lesson.id === selectedId) ?? lessons[0] ?? null;
  const watchedIds = useMemo(() => new Set((activityQuery.data ?? []).filter((entry) => entry.eventType === 'video_watched' && entry.lessonId !== null).map((entry) => entry.lessonId as number)), [activityQuery.data]);
  const initials = (user?.firstName?.[0] || user?.primaryEmailAddress?.emailAddress?.[0] || 'A').toUpperCase();
  const watchedRef = useRef<number | null>(null);
  const signInRecorded = useRef(false);

  useEffect(() => { if (lessons.length && selectedId === null) setSelectedId(lessons[0].id); }, [lessons, selectedId]);
  useEffect(() => { watchedRef.current = null; setWatchSaved(false); }, [selectedLesson?.id]);
  useEffect(() => {
    if (user?.id && !signInRecorded.current) {
      signInRecorded.current = true;
      recordActivity.mutate({ data: { eventType: 'sign_in', loginName: user.primaryEmailAddress?.emailAddress || null } });
    }
  }, [user?.id]);

  const saveWatch = () => {
    if (!selectedLesson || !selectedLesson.videoUrl || watchedRef.current === selectedLesson.id) return;
    watchedRef.current = selectedLesson.id;
    setWatchSaved(true);
    recordActivity.mutate({ data: { eventType: 'video_watched', lessonId: selectedLesson.id, lessonTitle: isAr ? selectedLesson.titleAr : selectedLesson.titleEn } }, { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListRecentActivityQueryKey() }) });
  };
  const handleSignOut = () => {
    recordActivity.mutate({ data: { eventType: 'sign_out', loginName: user?.primaryEmailAddress?.emailAddress || null } }, { onSettled: () => signOut({ redirectUrl: basePath || '/' }) });
  };
  const videoSrc = selectedLesson?.videoUrl ? (selectedLesson.videoUrl.includes('embed') ? selectedLesson.videoUrl : `${selectedLesson.videoUrl}${selectedLesson.videoUrl.includes('?') ? '&' : '?'}embed=1`) : null;
  const displayTitle = (lesson: Lesson) => isAr ? lesson.titleAr : lesson.titleEn;
  const displayDescription = (lesson: Lesson) => isAr ? lesson.descriptionAr : lesson.descriptionEn;

  return (
    <div className="min-h-[100dvh] bg-[#F6F4EE]" dir={isAr ? 'rtl' : 'ltr'}>
      <aside className={`fixed inset-y-0 z-40 w-[270px] bg-[#0F1D24] px-6 py-7 text-[#FCFBFA] transition-transform duration-300 ${isAr ? 'right-0 border-l border-[#C89F53]/15' : 'left-0 border-r border-[#C89F53]/15'} ${mobileOpen ? 'translate-x-0' : isAr ? 'translate-x-full lg:translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="flex items-center justify-between"><Logo invert /><button type="button" onClick={() => setMobileOpen(false)} className="focus-ring rounded-lg p-2 text-[#A1A6A1] lg:hidden" data-testid="button-close-menu"><X className="size-5" /></button></div>
        <div className="mt-16"><div className="font-mono text-[10px] tracking-[.22em] text-[#C89F53]">{isAr ? 'مساحة التعلّم' : 'YOUR LEARNING SPACE'}</div><div className="mt-4 text-2xl font-semibold tracking-[-.04em]">{isAr ? 'أهلاً بك.' : 'Welcome back.'}</div><div className="mt-1 max-w-[180px] truncate text-xs text-[#A1A6A1]">{user?.firstName || user?.primaryEmailAddress?.emailAddress || 'Member'}</div></div>
        <nav className="mt-14 space-y-2"><div className="flex items-center gap-3 rounded-xl bg-[#C89F53] px-3 py-3 text-sm font-semibold text-[#0F1D24]" data-testid="nav-library"><BookOpen className="size-4" /> {isAr ? 'المكتبة' : 'Library'}</div><a href="#activity" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-[#A1A6A1] transition hover:bg-[#1A2F39] hover:text-[#FCFBFA]" data-testid="link-activity"><History className="size-4" /> {isAr ? 'نشاطي الأخير' : 'Recent activity'}</a></nav>
        <div className="absolute bottom-7 left-6 right-6 border-t border-[#FCFBFA]/10 pt-5"><button type="button" onClick={handleSignOut} className="focus-ring flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-[#A1A6A1] transition hover:bg-[#1A2F39] hover:text-[#FCFBFA]" data-testid="button-sign-out"><LogOut className="size-4" /> {isAr ? 'تسجيل الخروج' : 'Sign out'}</button></div>
      </aside>
      {mobileOpen && <button type="button" aria-label="Close navigation" onClick={() => setMobileOpen(false)} className="fixed inset-0 z-30 bg-[#0F1D24]/40 lg:hidden" data-testid="button-mobile-overlay" />}
      <div className={isAr ? 'lg:pr-[270px]' : 'lg:pl-[270px]'}>
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-[#DFD7CB] bg-[#F6F4EE]/95 px-5 py-4 backdrop-blur sm:px-8 lg:px-12"><button type="button" onClick={() => setMobileOpen(true)} className="focus-ring rounded-lg p-2 text-[#0F1D24] lg:hidden" data-testid="button-open-menu"><Menu className="size-5" /></button><div className="hidden items-center gap-3 text-xs text-[#696C68] sm:flex"><span className="size-2 rounded-full bg-[#255946]" /> {isAr ? 'جلسة هادئة، تقدّم واضح' : 'A quiet session, a clear next step'}</div><div className="ml-auto flex items-center gap-4"><LanguageToggle language={language} onChange={setLanguage} /><div className="grid size-9 place-items-center rounded-t-xl rounded-b-md bg-[#C89F53] text-sm font-semibold text-[#0F1D24]" data-testid="text-user-initials">{initials}</div></div></header>
        <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-12 lg:py-12">
          <div className="mb-10 flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><div className="font-mono text-[10px] tracking-[.24em] text-[#9C7A3C]">{isAr ? 'المكتبة / الدروس' : 'LIBRARY / LESSONS'}</div><h1 className={`mt-3 text-4xl font-semibold tracking-[-.05em] text-[#0F1D24] sm:text-5xl ${isAr ? 'font-arabic tracking-[-.03em]' : ''}`} data-testid="text-portal-heading">{isAr ? 'وقتٌ جيد للتعلّم.' : 'A good time to learn.'}</h1></div><p className="max-w-xs text-sm leading-6 text-[#696C68]">{isAr ? 'اختر درساً، خذ نفساً، وابدأ من حيث أنت.' : 'Choose a lesson, take a breath, and begin where you are.'}</p></div>
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(280px,.65fr)]">
            <div className="flex flex-col gap-6">
              <section className="overflow-hidden rounded-t-[3rem] rounded-b-3xl border border-[#DFD7CB] bg-[#0F1D24] shadow-xl shadow-[#0F1D24]/10" data-testid="section-lesson-player">
              <div className="aspect-video min-h-[250px] w-full bg-[#091115]">
                {videoSrc ? <iframe key={videoSrc} src={videoSrc} title={selectedLesson ? displayTitle(selectedLesson) : 'OneDrive lesson'} onLoad={saveWatch} className="size-full border-0" allow="autoplay; fullscreen" data-testid="iframe-lesson-video" /> : <div className="grid size-full place-items-center p-8 text-center"><div><div className="mx-auto grid size-14 place-items-center rounded-t-2xl rounded-b-xl border border-[#C89F53]/40 bg-[#C89F53]/10"><Film className="size-6 text-[#C89F53]" /></div><h2 className="mt-5 text-base font-semibold text-[#FCFBFA]">{isAr ? 'الفيديو غير متاح بعد' : 'Video link not configured'}</h2><p className="mx-auto mt-2 max-w-xs text-xs leading-5 text-[#A1A6A1]">{isAr ? 'سيظهر فيديو OneDrive هنا حين يتم إعداد الرابط لهذا الدرس.' : 'A OneDrive URL will appear here when this lesson is configured.'}</p></div></div>}
              </div>
              <div className="p-6 sm:p-8"><div className="flex flex-wrap items-center justify-between gap-3"><div className="font-mono text-[10px] tracking-[.2em] text-[#C89F53]">{selectedLesson ? `LESSON ${String(lessons.findIndex((lesson) => lesson.id === selectedLesson.id) + 1).padStart(2, '0')}` : 'LESSON'}</div>{selectedLesson && <span className="inline-flex items-center gap-2 text-xs text-[#A1A6A1]"><Clock3 className="size-3.5" /> {selectedLesson.duration}</span>}</div><h2 className={`mt-4 text-2xl font-semibold tracking-[-.035em] text-[#FCFBFA] sm:text-3xl ${isAr ? 'font-arabic text-xl leading-9' : ''}`} data-testid="text-selected-lesson-title">{selectedLesson ? displayTitle(selectedLesson) : 'Select a lesson'}</h2><p className={`mt-3 max-w-2xl text-sm leading-6 text-[#A1A6A1] ${isAr ? 'font-arabic text-xs leading-7' : ''}`} data-testid="text-selected-lesson-description">{selectedLesson ? displayDescription(selectedLesson) : 'Your selected lesson will appear here.'}</p><div className="mt-7 flex flex-wrap items-center gap-3"><button type="button" onClick={saveWatch} disabled={!selectedLesson?.videoUrl || recordActivity.isPending} className="focus-ring inline-flex items-center gap-2 rounded-full bg-[#C89F53] px-4 py-2.5 text-xs font-semibold text-[#0F1D24] transition hover:bg-[#D4B066] disabled:cursor-not-allowed disabled:opacity-45" data-testid="button-mark-watched">{watchSaved ? <Check className="size-3.5" /> : <Check className="size-3.5" />} {watchSaved || watchedIds.has(selectedLesson?.id ?? -1) ? (isAr ? 'تم تسجيل المشاهدة' : 'Watched') : (isAr ? 'تسجيل كمُشاهَد' : 'Mark as watched')}</button></div></div>
            </section>
              <LessonComments lessonId={selectedId} language={language} />
            </div>
            <section className="rounded-t-[3rem] rounded-b-3xl border border-[#DFD7CB] bg-[#FCFBFA] p-5 sm:p-6 shadow-sm shadow-[#0F1D24]/5" data-testid="section-lesson-list"><div className="flex items-center justify-between"><div><div className="font-mono text-[10px] tracking-[.2em] text-[#9C7A3C]">{isAr ? 'المسار' : 'THE PATH'}</div><h2 className="mt-2 text-lg font-semibold text-[#0F1D24]">{isAr ? 'دروس الأكاديمية' : 'Academy lessons'}</h2></div><span className="rounded-full bg-[#EFEADF] px-2.5 py-1 font-mono text-[10px] text-[#696C68]" data-testid="text-lesson-count">{lessons.length} / 06</span></div><div className="mt-6 space-y-3">{lessonQuery.isLoading ? [1, 2, 3, 4].map((item) => <div key={item} className="skeleton h-[76px] rounded-2xl" />) : lessonQuery.isError ? <div className="rounded-2xl border border-[#E8BDB9] bg-[#F7E6E4] p-4 text-sm text-[#9E3A31]" data-testid="status-lessons-error"><CircleAlert className="mb-2 size-4" /><p>{isAr ? 'تعذر تحميل الدروس.' : 'Lessons could not be loaded.'}</p><button type="button" onClick={() => lessonQuery.refetch()} className="mt-3 font-semibold underline" data-testid="button-retry-lessons">{isAr ? 'حاول مجدداً' : 'Try again'}</button></div> : lessons.length === 0 ? <div className="rounded-2xl border border-dashed border-[#DFD7CB] p-7 text-center text-sm text-[#696C68]" data-testid="status-lessons-empty">{isAr ? 'لا توجد دروس مهيأة بعد.' : 'No lessons have been configured yet.'}</div> : lessons.map((lesson, index) => <button type="button" key={lesson.id} onClick={() => setSelectedId(lesson.id)} className={`group flex w-full items-center gap-3 rounded-t-[1.5rem] rounded-b-xl border p-3 text-left transition ${selectedLesson?.id === lesson.id ? 'border-[#C89F53] bg-[#F7F0DF]' : 'border-transparent hover:border-[#DFD7CB] hover:bg-[#EFEADF]'}`} data-testid={`button-select-lesson-${lesson.id}`}><span className={`grid size-9 shrink-0 place-items-center rounded-t-xl rounded-b-md font-mono text-[10px] ${selectedLesson?.id === lesson.id ? 'bg-[#0F1D24] text-[#C89F53]' : 'bg-[#EFEADF] text-[#9C7A3C]'}`}>{String(index + 1).padStart(2, '0')}</span><span className="min-w-0 flex-1"><span className={`block truncate text-sm font-semibold text-[#0F1D24] ${isAr ? 'font-arabic text-xs' : ''}`}>{displayTitle(lesson)}</span><span className="mt-1 block text-[11px] text-[#696C68]">{lesson.duration}</span></span>{watchedIds.has(lesson.id) && <Check className="size-4 shrink-0 text-[#255946]" />}</button>)}</div></section>
          </div>
          <section id="activity" className="mt-6 rounded-t-[2.5rem] rounded-b-3xl border border-[#DFD7CB] bg-[#EFEADF] p-5 sm:p-7" data-testid="section-recent-activity"><div className="flex items-center gap-3"><div className="grid size-9 place-items-center rounded-t-xl rounded-b-md bg-[#C89F53] text-[#0F1D24]"><History className="size-4" /></div><div><div className="font-mono text-[10px] tracking-[.2em] text-[#9C7A3C]">{isAr ? 'الأثر' : 'YOUR TRACE'}</div><h2 className="mt-1 text-lg font-semibold text-[#0F1D24]">{isAr ? 'النشاط الأخير' : 'Recent activity'}</h2></div></div><div className="mt-6 grid gap-3 sm:grid-cols-3">{activityQuery.isLoading ? [1, 2, 3].map((item) => <div key={item} className="skeleton h-16 rounded-2xl" />) : (activityQuery.data ?? []).slice(0, 3).map((entry, index) => <div key={`${entry.timestamp}-${index}`} className="rounded-t-2xl rounded-b-xl border border-[#DFD7CB] bg-[#FCFBFA]/70 p-4" data-testid={`activity-entry-${index}`}><div className="flex items-center justify-between gap-3"><span className="text-sm font-medium text-[#0F1D24]">{formatActivity(entry, language, lessons)}</span><span className="shrink-0 font-mono text-[10px] text-[#9C7A3C]">{new Date(entry.timestamp).toLocaleDateString(isAr ? 'ar' : 'en', { month: 'short', day: 'numeric' })}</span></div></div>)}{!activityQuery.isLoading && (activityQuery.data ?? []).length === 0 && <div className="col-span-full rounded-2xl border border-dashed border-[#D4CAB8] p-5 text-sm text-[#696C68]" data-testid="status-activity-empty">{isAr ? 'سيظهر أثرك هنا مع أول درس.' : 'Your trace will appear here after your first lesson.'}</div>}</div></section>
        </main>
      </div>
    </div>
  );
}

function LessonComments({ lessonId, language }: { lessonId: number | null; language: Language }) {
  const isAr = language === 'ar';
  const queryClient = useQueryClient();
  const [content, setContent] = useState('');

  useEffect(() => {
    setContent('');
  }, [lessonId]);

  const commentsQuery = useListLessonComments(lessonId ?? 0, {
    query: { enabled: lessonId !== null, queryKey: getListLessonCommentsQueryKey(lessonId ?? 0) },
    request: { credentials: 'include' }
  });

  const createComment = useCreateLessonComment({ request: { credentials: 'include' } });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (lessonId === null || !content.trim() || content.length > 2000) return;
    createComment.mutate(
      { lessonId, data: { content: content.trim() } },
      {
        onSuccess: () => {
          setContent('');
          queryClient.invalidateQueries({ queryKey: getListLessonCommentsQueryKey(lessonId) });
        },
      }
    );
  };

  if (lessonId === null) return null;

  const comments = commentsQuery.data ?? [];

  return (
    <section className="rounded-t-[3rem] rounded-b-3xl border border-[#DFD7CB] bg-[#FCFBFA] p-5 sm:p-6 shadow-sm shadow-[#0F1D24]/5" data-testid="section-lesson-comments">
      <div className="font-mono text-[10px] tracking-[.2em] text-[#9C7A3C]">
        {isAr ? 'المجلس' : 'THE SALON'}
      </div>
      <h2 className={`mt-2 text-lg font-semibold text-[#0F1D24] ${isAr ? 'font-arabic' : ''}`}>
        {isAr ? 'نقاش الدرس' : 'Lesson discussion'}
      </h2>

      <form onSubmit={handleSubmit} className="mt-6 relative">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={isAr ? 'شارك أفكارك حول هذا الدرس...' : 'Share your thoughts on this lesson...'}
          className={`w-full resize-none rounded-t-[1.5rem] rounded-b-xl border border-[#DFD7CB] bg-[#F0EBE1] p-4 text-sm text-[#0F1D24] placeholder:text-[#696C68] transition focus:border-[#C89F53] focus:outline-none focus:ring-1 focus:ring-[#C89F53] ${isAr ? 'font-arabic' : ''}`}
          rows={3}
          maxLength={2000}
          disabled={createComment.isPending}
          data-testid="input-comment-content"
          dir={isAr ? 'rtl' : 'ltr'}
        />
        <div className="mt-2 flex items-center justify-between">
          <div
            className={`text-xs ${content.length > 2000 ? 'text-[#9E3A31]' : 'text-[#696C68]'}`}
            data-testid="text-comment-character-count"
          >
            {content.length} / 2000
          </div>
          <button
            type="submit"
            disabled={!content.trim() || content.length > 2000 || createComment.isPending}
            className={`focus-ring inline-flex items-center gap-2 rounded-full bg-[#0F1D24] px-5 py-2 text-xs font-semibold text-[#FCFBFA] transition hover:bg-[#1A2F39] disabled:cursor-not-allowed disabled:opacity-50 ${isAr ? 'font-arabic' : ''}`}
            data-testid="button-submit-comment"
          >
            {createComment.isPending
              ? isAr
                ? 'جاري النشر...'
                : 'Posting...'
              : isAr
              ? 'انشر التعليق'
              : 'Post comment'}
          </button>
        </div>
        {createComment.isError && (
          <div className="mt-2 text-xs text-[#9E3A31]" data-testid="text-submit-error">
            {isAr ? 'حدث خطأ أثناء نشر التعليق. حاول مجدداً.' : 'An error occurred while posting. Please try again.'}
          </div>
        )}
      </form>

      <div className="mt-8 space-y-6">
        {commentsQuery.isLoading ? (
          [1, 2].map((i) => <div key={i} className="skeleton h-24 rounded-2xl" />)
        ) : commentsQuery.isError ? (
          <div className="rounded-2xl border border-[#E8BDB9] bg-[#F7E6E4] p-4 text-sm text-[#9E3A31]" data-testid="status-comments-error">
            <CircleAlert className="mb-2 size-4" />
            <p>{isAr ? 'تعذر تحميل التعليقات.' : 'Comments could not be loaded.'}</p>
            <button
              type="button"
              onClick={() => commentsQuery.refetch()}
              className="mt-3 font-semibold underline"
              data-testid="button-retry-comments"
            >
              {isAr ? 'حاول مجدداً' : 'Try again'}
            </button>
          </div>
        ) : comments.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#DFD7CB] p-7 text-center text-sm text-[#696C68]" data-testid="status-comments-empty">
            {isAr ? 'لا توجد تعليقات بعد. كن أول من يشارك.' : 'No comments yet. Be the first to share.'}
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="border-t border-[#DFD7CB] pt-6 first:border-0 first:pt-0" data-testid={`item-comment-${comment.id}`}>
              <div className="flex items-center gap-3">
                <div className="grid size-8 place-items-center rounded-t-xl rounded-b-md bg-[#C89F53] text-xs font-semibold text-[#0F1D24]">
                  {comment.authorName ? comment.authorName.charAt(0).toUpperCase() : 'A'}
                </div>
                <div>
                  <div className={`text-sm font-semibold text-[#0F1D24] ${isAr ? 'font-arabic' : ''}`} data-testid={`text-comment-author-${comment.id}`}>
                    {comment.authorName || (isAr ? 'مشارك مجهول' : 'Anonymous member')}
                  </div>
                  <div className="text-[11px] text-[#696C68]" data-testid={`text-comment-date-${comment.id}`}>
                    {new Date(comment.createdAt).toLocaleDateString(isAr ? 'ar-SA' : 'en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </div>
                </div>
              </div>
              <p className={`mt-3 whitespace-pre-wrap text-sm leading-relaxed text-[#0F1D24] ${isAr ? 'font-arabic' : ''}`} data-testid={`text-comment-content-${comment.id}`}>
                {comment.content}
              </p>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const qc = useQueryClient();
  const previous = useRef<string | null | undefined>(undefined);
  useEffect(() => addListener(({ user }) => { const id = user?.id ?? null; if (previous.current !== undefined && previous.current !== id) qc.clear(); previous.current = id; }), [addListener, qc]);
  return null;
}

function Router() {
  return <ErrorBoundary resetKey={window.location.pathname}><Switch><Route path="/" component={HomeRedirect} /><Route path="/sign-in/*?" component={() => <AuthPage mode="in" />} /><Route path="/sign-up/*?" component={() => <AuthPage mode="up" />} /><Route path="/user-portal" component={PortalGate} /><Route component={NotFound} /></Switch></ErrorBoundary>;
}

function ClerkApp() {
  const [, setLocation] = useLocation();
  return <ClerkProvider publishableKey={clerkPubKey} proxyUrl={clerkProxyUrl} appearance={clerkAppearance} signInUrl={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} localization={{ signIn: { start: { title: 'Welcome back', subtitle: 'Continue your practice at ALIF AI Academy' } }, signUp: { start: { title: 'Join the academy', subtitle: 'Make room for better ways of working' } } }} routerPush={(to) => setLocation(stripBase(to))} routerReplace={(to) => setLocation(stripBase(to), { replace: true })}><QueryClientProvider client={queryClient}><ClerkQueryClientCacheInvalidator /><Router /></QueryClientProvider></ClerkProvider>;
}

function App() {
  if (!clerkPubKey) throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY in .env file');
  return <TooltipProvider><WouterRouter base={basePath}><ClerkApp /></WouterRouter><Toaster /></TooltipProvider>;
}

export default App;