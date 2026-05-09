import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const steps = [
  {
    num: '1',
    icon: '🏪',
    title: 'Pick a restaurant',
    desc: 'Browse nearby restaurants, check ratings, menus and wait times before deciding.',
  },
  {
    num: '2',
    icon: '🛒',
    title: 'Build your order',
    desc: 'Add items to cart, enter your table number — or choose takeaway for a token.',
  },
  {
    num: '3',
    icon: '🎫',
    title: 'Pay & get token',
    desc: 'Pay securely online. A unique token number is instantly generated for your order.',
  },
  {
    num: '4',
    icon: '🔔',
    title: 'We call your token',
    desc: 'Kitchen prepares your food. You get notified by token or table when it\'s ready.',
  },
];

const stats = [
  { num: '50+',    label: 'Restaurants' },
  { num: '12,000+', label: 'Orders placed' },
  { num: '4.7',    label: 'Avg rating' },
  { num: '0 min',  label: 'Queue time' },
];

const featuredRestaurants = [
  { icon: '🍛', name: 'Spice Garden',    meta: '★ 4.6 · 25–35 min · North Indian' },
  { icon: '🍔', name: 'Burger Republic', meta: '★ 4.3 · 15–20 min · American' },
  { icon: '🍜', name: 'Dragon Wok',      meta: '★ 4.4 · 20–30 min · Chinese' },
];

export default function Landing() {
  const { isLoggedIn } = useAuth();

  return (
    <div className="min-h-screen">

      {/* ── HERO ── */}
      <section className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-6 py-20 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

          {/* Left */}
          <div>
            <span className="inline-block bg-red-900/40 text-red-300 border border-red-800/50 rounded-full text-xs px-4 py-1.5 mb-6">
              Now open in Dhanbad, Jharkhand
            </span>
            <h1 className="text-5xl font-extrabold leading-tight tracking-tight mb-5">
              Order food,<br />
              skip the <span className="text-red-500">wait.</span>
            </h1>
            <p className="text-gray-400 text-lg leading-relaxed mb-8 max-w-md">
              Browse restaurants, add to cart, pay online — and get a unique token.
              We'll call your token when food is ready. No queuing. No confusion.
            </p>
            <div className="flex gap-4">
              {isLoggedIn ? (
                <Link
                  to="/restaurants"
                  className="bg-red-600 hover:bg-red-700 text-white font-semibold px-8 py-4 rounded-xl text-base transition-colors"
                >
                  Order now →
                </Link>
              ) : (
                <>
                  <Link
                    to="/register"
                    className="bg-red-600 hover:bg-red-700 text-white font-semibold px-8 py-4 rounded-xl text-base transition-colors"
                  >
                    Get started free
                  </Link>
                  <a
                    href="#how-it-works"
                    className="bg-white/10 hover:bg-white/20 text-white font-medium px-8 py-4 rounded-xl text-base border border-white/20 transition-colors"
                  >
                    How it works
                  </a>
                </>
              )}
            </div>
          </div>

          {/* Right - featured card */}
          <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-4">Popular right now</p>
            <div className="flex flex-col gap-3">
              {featuredRestaurants.map((r, i) => (
                <Link
                  key={i}
                  to="/restaurants"
                  className="flex items-center gap-4 bg-gray-900 hover:bg-gray-950 rounded-xl px-4 py-3 transition-colors group"
                >
                  <div className="w-11 h-11 rounded-xl bg-gray-700 flex items-center justify-center text-2xl flex-shrink-0">
                    {r.icon}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white group-hover:text-red-400 transition-colors">
                      {r.name}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">{r.meta}</div>
                  </div>
                  <span className="ml-auto text-gray-600 group-hover:text-red-400 transition-colors">→</span>
                </Link>
              ))}
            </div>
            <Link
              to="/restaurants"
              className="block text-center text-xs text-gray-500 hover:text-red-400 mt-4 transition-colors"
            >
              View all restaurants →
            </Link>
          </div>
        </div>
      </section>

      {/* ── STATS BAR ── */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-6 grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((s, i) => (
            <div key={i} className="text-center">
              <div className="text-2xl font-extrabold text-red-600">{s.num}</div>
              <div className="text-xs text-gray-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="bg-gray-50 py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold mb-3">How TableToken works</h2>
            <p className="text-gray-500 text-base">From browsing to eating in four simple steps</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
            {/* Connector line (desktop only) */}
            <div className="hidden md:block absolute top-8 left-[12.5%] right-[12.5%] h-0.5 bg-dashed border-t-2 border-dashed border-red-200 z-0" />

            {steps.map((step, i) => (
              <div key={i} className="relative z-10 text-center flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-red-600 text-white font-bold text-xl flex items-center justify-center mb-4 shadow-lg">
                  {step.num}
                </div>
                <div className="text-3xl mb-3">{step.icon}</div>
                <h3 className="font-semibold text-base mb-2">{step.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section className="bg-gray-900 text-white py-20 px-6 text-center">
        <h2 className="text-3xl font-bold mb-3">Ready to skip the queue?</h2>
        <p className="text-gray-400 mb-8 text-base">
          Join 12,000+ customers already ordering smarter
        </p>
        <Link
          to="/register"
          className="inline-block bg-red-600 hover:bg-red-700 text-white font-semibold px-10 py-4 rounded-xl text-base transition-colors"
        >
          Create free account →
        </Link>
        <p className="text-gray-600 text-xs mt-10">
          © 2025 TableToken · All rights reserved
        </p>
      </section>
    </div>
  );
}