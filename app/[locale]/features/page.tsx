'use client';

import { motion } from 'framer-motion';
import {
  BarChart,
  CheckCircle2,
  CheckSquare,
  ChevronLeft,
  Globe,
  Hash,
  HelpCircle,
  Layout,
  MessageSquare,
  Play,
  Smartphone,
  Users,
  Zap,
} from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Link } from '@/i18n/routing';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function FeaturesPage() {
  const t = useTranslations('FeaturesPage');

  return (
    <div className="min-h-screen p-4 sm:p-8 max-w-6xl mx-auto">
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="mb-12">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-purple-300 hover:text-white transition-colors font-bold uppercase tracking-widest text-xs group"
        >
          <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          {t('backToHome')}
        </Link>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-20">
        <h1 className="text-5xl sm:text-7xl font-black text-white mb-6 uppercase italic tracking-tighter">
          {t('hero.title')}
        </h1>
        <p className="text-xl sm:text-2xl text-purple-200/60 max-w-3xl mx-auto leading-relaxed">
          {t('hero.description')}
        </p>
      </motion.div>

      <div className="space-y-32">
        {/* Quiz Master Section */}
        <section>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex items-center gap-4 mb-12"
          >
            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-yellow-500/50" />
            <h2 className="text-3xl font-black text-white uppercase tracking-tight px-4 italic">
              {t('sections.quizMaster.title')}
            </h2>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-yellow-500/50" />
          </motion.div>

          <motion.div
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            <motion.div
              variants={item}
              className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-[2rem]"
            >
              <div className="w-14 h-14 bg-yellow-500/20 rounded-2xl flex items-center justify-center mb-6">
                <Layout className="text-yellow-400" size={28} />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">{t('sections.quizMaster.create.title')}</h3>
              <p className="text-purple-100/60 leading-relaxed">{t('sections.quizMaster.create.description')}</p>
            </motion.div>

            <motion.div
              variants={item}
              className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-[2rem]"
            >
              <div className="w-14 h-14 bg-orange-500/20 rounded-2xl flex items-center justify-center mb-6">
                <Play className="text-orange-400" size={28} />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">{t('sections.quizMaster.host.title')}</h3>
              <p className="text-purple-100/60 leading-relaxed">{t('sections.quizMaster.host.description')}</p>
            </motion.div>

            <motion.div
              variants={item}
              className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-[2rem]"
            >
              <div className="w-14 h-14 bg-purple-500/20 rounded-2xl flex items-center justify-center mb-6">
                <BarChart className="text-purple-400" size={28} />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">{t('sections.quizMaster.stats.title')}</h3>
              <p className="text-purple-100/60 leading-relaxed">{t('sections.quizMaster.stats.description')}</p>
            </motion.div>
          </motion.div>
        </section>

        {/* Players Section */}
        <section>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex items-center gap-4 mb-12"
          >
            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-green-500/50" />
            <h2 className="text-3xl font-black text-white uppercase tracking-tight px-4 italic">
              {t('sections.players.title')}
            </h2>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-green-500/50" />
          </motion.div>

          <motion.div
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            <motion.div
              variants={item}
              className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-[2rem]"
            >
              <div className="w-14 h-14 bg-green-500/20 rounded-2xl flex items-center justify-center mb-6">
                <Users className="text-green-400" size={28} />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">{t('sections.players.join.title')}</h3>
              <p className="text-purple-100/60 leading-relaxed">{t('sections.players.join.description')}</p>
            </motion.div>

            <motion.div
              variants={item}
              className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-[2rem]"
            >
              <div className="w-14 h-14 bg-blue-500/20 rounded-2xl flex items-center justify-center mb-6">
                <Smartphone className="text-blue-400" size={28} />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">{t('sections.players.experience.title')}</h3>
              <p className="text-purple-100/60 leading-relaxed">{t('sections.players.experience.description')}</p>
            </motion.div>

            <motion.div
              variants={item}
              className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-[2rem]"
            >
              <div className="w-14 h-14 bg-emerald-500/20 rounded-2xl flex items-center justify-center mb-6">
                <Zap className="text-emerald-400" size={28} />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">{t('sections.players.feedback.title')}</h3>
              <p className="text-purple-100/60 leading-relaxed">{t('sections.players.feedback.description')}</p>
            </motion.div>
          </motion.div>
        </section>

        {/* Question Types */}
        <section className="bg-gradient-to-br from-purple-900/40 to-pink-900/40 rounded-[3rem] p-8 sm:p-16 border border-white/10">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-black text-white mb-4 uppercase italic tracking-tighter">
              {t('sections.questions.title')}
            </h2>
            <p className="text-purple-200/60 font-medium">{t('sections.questions.description')}</p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: CheckSquare, label: t('sections.questions.mcq'), color: 'text-blue-400' },
              { icon: HelpCircle, label: t('sections.questions.trueFalse'), color: 'text-emerald-400' },
              { icon: Hash, label: t('sections.questions.number'), color: 'text-orange-400' },
              { icon: MessageSquare, label: t('sections.questions.freeText'), color: 'text-pink-400' },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex flex-col items-center gap-4 p-6 bg-white/5 rounded-2xl border border-white/5"
              >
                <item.icon className={item.color} size={32} />
                <span className="text-white font-bold text-center text-sm uppercase tracking-wide">{item.label}</span>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Technical Features */}
        <section className="pb-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div whileHover={{ y: -5 }} className="flex items-center gap-4 text-purple-200">
              <CheckCircle2 className="text-green-400 shrink-0" size={24} />
              <span className="font-medium">{t('sections.technical.realtime')}</span>
            </motion.div>
            <motion.div whileHover={{ y: -5 }} className="flex items-center gap-4 text-purple-200">
              <Smartphone className="text-blue-400 shrink-0" size={24} />
              <span className="font-medium">{t('sections.technical.responsive')}</span>
            </motion.div>
            <motion.div whileHover={{ y: -5 }} className="flex items-center gap-4 text-purple-200">
              <Globe className="text-purple-400 shrink-0" size={24} />
              <span className="font-medium">{t('sections.technical.i18n')}</span>
            </motion.div>
          </div>
        </section>
      </div>
    </div>
  );
}
