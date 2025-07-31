import { motion } from 'motion/react';

export function AnimatedBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Основной градиентный фон */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900"
        animate={{
          background: [
            'linear-gradient(45deg, #0f172a, #581c87, #0f172a)',
            'linear-gradient(90deg, #1e1b4b, #7c2d12, #1e1b4b)',
            'linear-gradient(135deg, #0f172a, #166534, #0f172a)',
            'linear-gradient(180deg, #312e81, #581c87, #312e81)',
            'linear-gradient(45deg, #0f172a, #581c87, #0f172a)',
          ],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      
      {/* Плавающие неоновые пятна */}
      <motion.div
        className="absolute w-96 h-96 rounded-full opacity-30 blur-3xl"
        style={{
          background: 'radial-gradient(circle, rgba(147, 51, 234, 0.6) 0%, transparent 70%)',
        }}
        animate={{
          x: [100, 300, 100],
          y: [100, 200, 100],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      
      <motion.div
        className="absolute w-80 h-80 rounded-full opacity-20 blur-3xl"
        style={{
          background: 'radial-gradient(circle, rgba(59, 130, 246, 0.5) 0%, transparent 70%)',
          right: '10%',
          top: '20%',
        }}
        animate={{
          x: [-50, 50, -50],
          y: [50, -50, 50],
          scale: [1.1, 0.9, 1.1],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      
      <motion.div
        className="absolute w-72 h-72 rounded-full opacity-25 blur-3xl"
        style={{
          background: 'radial-gradient(circle, rgba(16, 185, 129, 0.4) 0%, transparent 70%)',
          left: '20%',
          bottom: '20%',
        }}
        animate={{
          x: [0, -100, 0],
          y: [0, 100, 0],
          scale: [0.8, 1.3, 0.8],
        }}
        transition={{
          duration: 14,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </div>
  );
}