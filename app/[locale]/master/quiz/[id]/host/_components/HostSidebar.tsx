'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Users } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface Player {
  id: number;
  name: string;
  score: number;
}

interface HostSidebarProps {
  players: Player[];
}

export default function HostSidebar({ players }: HostSidebarProps) {
  const t = useTranslations('HostGame');
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  return (
    <motion.div
      layout
      className="bg-white/10 backdrop-blur-lg rounded-[2.5rem] p-6 sm:p-8 border border-white/20 sticky top-6 shadow-2xl"
    >
      <h2 className="text-xl font-black text-white/50 uppercase tracking-[0.2em] mb-8 flex items-center justify-between">
        <span className="flex items-center gap-3">
          <Users size={24} />
          {t('players')}
        </span>
        <span className="bg-white/10 px-3 py-1 rounded-full text-white text-sm font-mono">{players.length}</span>
      </h2>
      <div className="space-y-3 max-h-[calc(100vh-350px)] overflow-y-auto pr-2 custom-scrollbar">
        <AnimatePresence>
          {sortedPlayers.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-purple-200/50 text-center py-12 flex flex-col items-center gap-4"
            >
              <Users size={48} className="opacity-20 animate-pulse" />
              <p className="font-bold uppercase tracking-widest text-sm">{t('waitingForPlayers')}</p>
            </motion.div>
          ) : (
            sortedPlayers.map((player, idx) => (
              <motion.div
                key={player.id}
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`bg-white/10 rounded-2xl p-4 flex items-center justify-between border-l-4 ${
                  idx === 0
                    ? 'border-yellow-400'
                    : idx === 1
                      ? 'border-gray-300'
                      : idx === 2
                        ? 'border-orange-500'
                        : 'border-transparent'
                } hover:bg-white/20 transition-colors group shadow-lg`}
              >
                <div className="flex items-center gap-4">
                  <div className="text-2xl font-black w-8 text-center">
                    {idx === 0 && '🥇'}
                    {idx === 1 && '🥈'}
                    {idx === 2 && '🥉'}
                    {idx > 2 && <span className="text-white/30 text-sm">#{idx + 1}</span>}
                  </div>
                  <div>
                    <div className="text-white font-black uppercase tracking-tight group-hover:text-yellow-400 transition-colors">
                      {player.name}
                    </div>
                    <div className="text-purple-200/60 text-xs font-bold uppercase tracking-widest">
                      {t('score')}: <span className="text-white">{player.score}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
