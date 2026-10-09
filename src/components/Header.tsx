import { Link } from 'react-router-dom';

export default function Header({ to }: { to: string }) {
  return (
    <div className="max-w-7xl mx-auto flex items-center justify-between mb-8">
      <Link
        to={to}
        className="flex items-center gap-3 hover:opacity-80 transition-opacity"
      >
        <img src="/cubeiconn.svg" alt="Logo" className="w-20 h-20 md:w-32 md:h-32 object-contain" />
        <h1 className="text-2xl md:text-3xl font-bold text-blue-400">
          CosmoCube Fest Medellín 2026: One Face
        </h1>
      </Link>
    </div>
  );
}
