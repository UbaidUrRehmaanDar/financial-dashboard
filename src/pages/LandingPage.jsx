import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, BarChart3, Shield, Zap, Activity } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const LandingPage = () => {
  const tickers = [
    'AAPL +2.4%', 'GOOGL -1.2%', 'MSFT +3.1%', 'AMZN +0.8%', 'TSLA -2.9%', 
    'META +1.5%', 'NVDA +4.2%', 'AMD -0.6%', 'NFLX +2.1%', 'DIS -1.8%'
  ];
  
  const topMovers = [
    { symbol: 'NVDA', name: 'NVIDIA Corp', price: '$485.23', change: '+4.2%', isUp: true },
    { symbol: 'TSLA', name: 'Tesla Inc', price: '$245.67', change: '-2.9%', isUp: false },
    { symbol: 'AAPL', name: 'Apple Inc', price: '$178.92', change: '+2.4%', isUp: true },
    { symbol: 'AMD', name: 'AMD', price: '$125.43', change: '-0.6%', isUp: false },
    { symbol: 'MSFT', name: 'Microsoft', price: '$378.91', change: '+3.1%', isUp: true },
    { symbol: 'GOOGL', name: 'Alphabet Inc', price: '$142.78', change: '-1.2%', isUp: false }
  ];
  
  const features = [
    {
      icon: BarChart3,
      title: 'Real-Time Analytics',
      description: 'Track market movements and portfolio performance with live data feeds and advanced charting tools.'
    },
    {
      icon: Shield,
      title: 'Secure & Reliable',
      description: 'Bank-grade encryption and multi-layer security ensure your financial data stays protected 24/7.'
    },
    {
      icon: Zap,
      title: 'AI-Powered Insights',
      description: 'Get intelligent recommendations and predictive analytics powered by machine learning algorithms.'
    }
  ];

  return (
    <div className="min-h-screen animated-gradient text-foreground relative overflow-hidden">
      {/* Background Blobs */}
      <motion.div
        className="absolute top-0 left-0 w-96 h-96 bg-indigo-500/30 rounded-full blur-[120px]"
        animate={{
          scale: [1, 1.15, 1],
          rotate: [0, 45, 0],
          opacity: [0.3, 0.5, 0.3]
        }}
        transition={{
          duration: 14,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        style={{ pointerEvents: 'none' }}
      />
      <motion.div
        className="absolute bottom-0 right-0 w-80 h-80 bg-emerald-500/20 rounded-full blur-[100px]"
        animate={{
          scale: [1, 1.2, 1],
          rotate: [0, -45, 0],
          opacity: [0.2, 0.4, 0.2]
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        style={{ pointerEvents: 'none' }}
      />

      {/* Fixed Ticker Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b">
        <div className="ticker-scroll overflow-hidden">
          <div className="flex gap-8 py-3 font-mono text-sm text-muted tabular-nowrap">
            {[...tickers, ...tickers].map((ticker, index) => (
              <span key={index} className="whitespace-nowrap">{ticker}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="pt-32 pb-24 px-6 max-w-5xl mx-auto text-center relative z-10">
        <motion.h1 
          className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 text-gradient"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          Market Intelligence. Simplified.
        </motion.h1>
        
        <motion.p 
          className="text-xl text-muted max-w-2xl mx-auto mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
        >
          Track portfolios, analyze trends, and get AI-powered insights in real-time.
        </motion.p>
        
        <motion.div 
          className="flex flex-col sm:flex-row gap-4 justify-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
        >
          <Button showArrow>
            Launch Dashboard
          </Button>
          <Button variant="outline" showArrow>
            Explore Demo
          </Button>
        </motion.div>
      </section>

      {/* Top Movers Grid */}
      <section className="px-6 py-16 max-w-6xl mx-auto relative z-10">
        <motion.h2 
          className="text-3xl font-bold tracking-tight mb-8 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          Top Movers Today
        </motion.h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {topMovers.map((mover, index) => (
            <motion.div
              key={mover.symbol}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ 
                duration: 0.5, 
                delay: index * 0.05, 
                ease: "easeOut" 
              }}
              whileHover={{ y: -2 }}
            >
              <Card className="card-premium p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-lg">{mover.symbol}</h3>
                    <p className="text-sm text-muted">{mover.name}</p>
                  </div>
                  <div className={`flex items-center gap-1 ${mover.isUp ? 'text-green-500' : 'text-red-500'}`}>
                    {mover.isUp ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    <span className="font-mono text-sm">{mover.change}</span>
                  </div>
                </div>
                <div className="font-mono text-2xl tabular-nums">{mover.price}</div>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Platform Highlights */}
      <section className="px-6 py-20 bg-gradient-to-b from-card to-background relative z-10">
        <div className="max-w-6xl mx-auto">
          <motion.h2 
            className="text-3xl font-bold tracking-tight mb-12 text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            Platform Highlights
          </motion.h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ 
                  duration: 0.6, 
                  delay: index * 0.1, 
                  ease: "easeOut" 
                }}
              >
                <Card className="card-premium p-6 h-full">
                  <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                  <p className="text-muted leading-relaxed">{feature.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
