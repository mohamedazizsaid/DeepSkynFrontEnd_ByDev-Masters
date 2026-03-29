import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import CountUp from 'react-countup';
import { Sparkles, Brain, Calendar, TrendingUp, Shield, Star, Check, ArrowRight } from 'lucide-react';
import { Button } from './button';
import { Card } from './card';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { useAccessibilityStore } from '../../stores/accessibility.store';

interface LandingPageProps {
  onGetStarted: () => void;
  onLogin: () => void;
}

export function LandingPage({ onGetStarted, onLogin }: LandingPageProps) {
  const { t } = useAccessibilityStore();
  const [inView, setInView] = useState(false);
  const [pricingPeriod, setPricingPeriod] = useState<'monthly' | 'annual'>('monthly');
  
  const features = [
    {
      icon: <Brain className="w-8 h-8" />,
      title: t('landing.feature1Title'),
      description: t('landing.feature1Desc')
    },
    {
      icon: <Calendar className="w-8 h-8" />,
      title: t('landing.feature2Title'),
      description: t('landing.feature2Desc')
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: t('landing.feature3Title'),
      description: t('landing.feature3Desc')
    },
    {
      icon: <Sparkles className="w-8 h-8" />,
      title: t('landing.feature4Title'),
      description: t('landing.feature4Desc')
    }
  ];

  const benefits = t('landing.benefits') as unknown as string[];

  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'Utilisatrice Premium',
      text: '« DeepSkyn a transformé ma routine beauté! L\'analyse IA était d\'une précision fantastique. »',
      rating: 5
    },
    {
      name: 'Michael Chen',
      role: 'Utilisateur Gratuit',
      text: '« Je comprends enfin mon type de peau et les produits qui me conviennent vraiment. »',
      rating: 5
    },
    {
      name: 'Emma Williams',
      role: 'Utilisatrice Premium',
      text: '« Le suivi des progrès me motive chaque jour. Je vois de vraies améliorations ! »',
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen relative" style={{ zIndex: 1 }}>
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-[#E5E7EB]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <motion.div 
            className="flex items-center gap-2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0EA5E9] to-[#06B6D4] flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-[#0EA5E9] to-[#06B6D4] bg-clip-text text-transparent">
              DeepSkyn
            </span>
          </motion.div>
          
          <motion.div 
            className="flex items-center gap-4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Button variant="ghost" onClick={onLogin}>
              {t('landing.navSignIn')}
            </Button>
            <Button onClick={onGetStarted}>
              {t('landing.navGetStarted')}
            </Button>
          </motion.div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#0EA5E9]/10 rounded-full mb-6">
                <Sparkles className="w-4 h-4 text-[#0EA5E9]" />
                <span className="text-sm text-[#0EA5E9] font-medium">{t('landing.heroTag')}</span>
              </div>
              
              <h1 className="text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                {t('landing.heroTitle1')}
                <span className="block bg-gradient-to-r from-[#0EA5E9] to-[#06B6D4] bg-clip-text text-transparent">
                  {t('landing.heroTitleGradient')}
                </span>
                {t('landing.heroTitle2')}
              </h1>
              
              <p
                className="text-xl text-[#6B7280] mb-8 leading-relaxed"
                style={{
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}
              >
                {t('landing.heroDesc')}
              </p>
              
              <div className="flex flex-wrap gap-4">
                <Button size="lg" onClick={onGetStarted}>
                  {t('landing.heroStart')}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                <Button variant="outline" size="lg">
                  {t('landing.heroWatchDemo')}
                </Button>
              </div>

              <div className="mt-12 flex flex-wrap items-center gap-8">
                <div>
                  <div className="text-3xl font-bold text-[#0EA5E9]">50K+</div>
                  <div className="text-sm text-[#6B7280]">{t('landing.activeUsers')}</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-[#0EA5E9]">4.9★</div>
                  <div className="text-sm text-[#6B7280]">{t('landing.userRating')}</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-[#0EA5E9]">95%</div>
                  <div className="text-sm text-[#6B7280]">{t('landing.satisfaction')}</div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                
                <ImageWithFallback
                  src="https://i.pinimg.com/736x/98/4f/15/984f1530158bf5689108fb026cc30dce.jpg"
                  alt="Natural skin close-up"
                  className="w-full h-[600px] object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 via-transparent to-transparent"></div>
              </div>
              
              <motion.div
                className="absolute bottom-8 left-8 right-8 bg-white/55 backdrop-blur-2xl border border-white/70 rounded-2xl p-6 shadow-xl ltr:text-left rtl:text-right"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                onViewportEnter={() => setInView(true)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-[#6B7280] mb-1">{t('landing.skinHealthScore')}</div>
                    <div className="text-3xl font-bold text-[#0EA5E9]">
                      {inView && <CountUp end={87} duration={2.5} />}
                      /100
                    </div>
                  </div>
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#0EA5E9] to-[#06B6D4] flex items-center justify-center">
                    <TrendingUp className="w-8 h-8 text-white" />
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 bg-white/70 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold mb-4">{t('landing.featuresTitle')}</h2>
            <p className="text-xl text-[#6B7280]">{t('landing.featuresDesc')}</p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full p-6 bg-gradient-to-b from-white to-[#F0F9FF] border border-[rgba(59,189,244,0.15)] shadow-[0_4px_24px_rgba(59,189,244,0.08)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_32px_rgba(59,189,244,0.12)] group relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#38BDF8] to-[#0EA5E9] transform -translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#38BDF8] to-[#0EA5E9] flex items-center justify-center text-white mb-4 p-3.5 shadow-lg shadow-[#0EA5E9]/20">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                  <p className="text-[#6B7280]">{feature.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl font-bold mb-6">
                {t('landing.whyChoose')}
                <span className="block text-[#0EA5E9]">DeepSkyn?</span>
              </h2>
              <p className="text-xl text-[#6B7280] mb-8">
                {t('landing.whyDesc')}
              </p>
              
              <div className="space-y-4">
                {benefits?.map((benefit, index) => (
                  <motion.div
                    key={index}
                    className="flex items-center gap-3"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="w-6 h-6 rounded-full bg-[#0EA5E9] flex items-center justify-center flex-shrink-0">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-[#374151]">{benefit}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                <ImageWithFallback
                  src="https://i.pinimg.com/736x/2c/33/b8/2c33b810ecbb190b29c75ae0ceae95c2.jpg"
                  alt="Skin analysis technology"
                  className="w-full h-[500px] object-cover"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold mb-4">{t('landing.lovedBy')}</h2>
            <p className="text-xl text-[#6B7280]">{t('landing.lovedDesc')}</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full border border-[#D9ECFF] bg-gradient-to-b from-white to-[#F5FBFF] shadow-md hover:shadow-xl transition-all duration-300 relative pl-4">
                  <div className="absolute top-0 left-0 h-full w-1 bg-[#3BBDF4] rounded-l-lg"></div>
                  <div className="w-full h-1.5 rounded-full bg-gradient-to-r from-[#38BDF8] to-[#0284C7] mb-5" />
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex gap-1">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="w-5 h-5 fill-[#FBBF24] text-[#FBBF24]" />
                      ))}
                    </div>
                    <div className="w-10 h-10 rounded-full bg-[#E0F2FE] text-[#0369A1] font-bold flex items-center justify-center text-sm overflow-hidden">
                      <img src={`https://i.pravatar.cc/40?u=${testimonial.name}`} alt={testimonial.name} />
                    </div>
                  </div>
                  <p className="text-[#374151] mb-6 italic leading-relaxed">{testimonial.text}</p>
                  <div className="pt-4 border-t border-[#E5EEF7]">
                    <div className="font-bold text-[#111827]">{testimonial.name}</div>
                    <div className="text-sm text-[#0369A1] bg-[#E0F2FE] inline-flex px-2.5 py-1 rounded-full mt-1">{testimonial.role}</div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold mb-4">{t('landing.pricingTitle')}</h2>
            <p className="text-xl text-[#6B7280]">{t('landing.pricingDesc')}</p>
          </motion.div>

          <div className="flex justify-center items-center gap-4 mb-12">
            <span className={`font-medium ${pricingPeriod === 'monthly' ? 'text-[#0EA5E9]' : 'text-gray-500'}`}>
              Mensuel
            </span>
            <div 
              className="w-14 h-8 flex items-center bg-gray-200 rounded-full p-1 cursor-pointer"
              onClick={() => setPricingPeriod(pricingPeriod === 'monthly' ? 'annual' : 'monthly')}
            >
              <div 
                className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-transform ${pricingPeriod === 'annual' ? 'translate-x-6' : ''}`}
              ></div>
            </div>
            <span className={`font-medium ${pricingPeriod === 'annual' ? 'text-[#0EA5E9]' : 'text-gray-500'}`}>
              Annuel
            </span>
            <div className="bg-yellow-100 text-yellow-800 text-xs font-semibold ml-2 px-2.5 py-0.5 rounded-full">Économisez 20%</div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <Card className="h-full border border-[#D7EBFF] bg-gradient-to-b from-white to-[#F7FCFF] shadow-md hover:shadow-xl transition-all duration-300">
                <div className="mb-6">
                  <h3 className="text-2xl font-bold mb-2">{t('landing.free')}</h3>
                  <div className="text-4xl font-bold text-[#0EA5E9]">
                    $0<span className="text-lg text-[#6B7280]">/mo</span>
                  </div>
                </div>
                <ul className="space-y-3 mb-8">
                  {(t('landing.freeFeatures') as unknown as string[]).map((ft, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <Check className="w-5 h-5 text-[#0EA5E9]" />
                      <span>{ft}</span>
                    </li>
                  ))}
                </ul>
                <Button variant="outline" className="w-full border-[#93C5FD] text-[#0369A1] hover:bg-[#EFF6FF]" onClick={onGetStarted}>
                  {t('landing.navGetStarted')}
                </Button>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              <Card className="h-full border-2 border-[#0EA5E9] relative bg-gradient-to-b from-white to-[#F0F9FF] shadow-xl shadow-[#38BDF8]/20 md:-translate-y-1">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-[#0EA5E9] to-[#06B6D4] text-white text-sm font-medium rounded-full">
                  {t('landing.mostPopular')}
                </div>
                <div className="mb-6">
                  <h3 className="text-2xl font-bold mb-2">{t('landing.premium')}</h3>
                  <div className="text-5xl font-bold text-[#3BBDF4]">
                    {pricingPeriod === 'monthly' ? '$19' : '$15'}
                    <span className="text-lg font-normal text-[#64748B]">/mo</span>
                  </div>
                </div>
                <ul className="space-y-3 mb-8">
                  {(t('landing.premiumFeatures') as unknown as string[]).map((pt, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <Check className="w-5 h-5 text-[#0EA5E9]" />
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
                <Button className="w-full bg-gradient-to-r from-[#0EA5E9] to-[#0284C7] hover:from-[#0284C7] hover:to-[#0369A1]" onClick={onGetStarted}>
                  {t('landing.startTrial')}
                </Button>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <Card className="h-full border border-[#CFE8FF] bg-gradient-to-br from-white via-[#F3FAFF] to-[#ECF7FF] shadow-md hover:shadow-xl transition-all duration-300">
                <div className="mb-6">
                  <h3 className="text-2xl font-bold mb-2 flex items-center gap-2">
                    {t('landing.enterprise')}
                    <Shield className="w-5 h-5 text-[#0EA5E9]" />
                  </h3>
                  <div className="text-4xl font-bold text-[#0284C7]">
                    {t('landing.enterprisePrice')}
                  </div>
                </div>
                <ul className="space-y-3 mb-8">
                  {(t('landing.enterpriseFeatures') as unknown as string[]).map((et, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <Check className="w-5 h-5 text-[#0EA5E9]" />
                      <span>{et}</span>
                    </li>
                  ))}
                </ul>
                <Button variant="outline" className="w-full border-[#7DD3FC] text-[#0369A1] hover:bg-[#EFF6FF]" onClick={onGetStarted}>
                  {t('landing.contactSales')}
                </Button>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gradient-to-r from-[#0EA5E9] to-[#06B6D4] relative overflow-hidden">
        {/* Animated particles would go here */}
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
              {t('landing.readyToTransform')}
            </h2>
            <p className="text-xl text-white/90 mb-8">
              {t('landing.joinThousands')}
            </p>
            <Button 
              size="lg" 
              variant="outline" 
              className="bg-white text-[#0EA5E9] hover:bg-gray-50 border-0"
              onClick={onGetStarted}
            >
              {t('landing.freeAnalysis')}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <div className="mt-10 flex flex-wrap justify-center items-center gap-4 text-sm">
              <div className="flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/20 rounded-full backdrop-blur-sm">
                <span role="img" aria-label="lock">🔒</span>
                <span className="text-white/90">Sécurisé</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/20 rounded-full backdrop-blur-sm">
                <span role="img" aria-label="checkmark">✓</span>
                <span className="text-white/90">Sans engagement</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/20 rounded-full backdrop-blur-sm">
                <span role="img" aria-label="zap">⚡</span>
                <span className="text-white/90">Résultats en 60 sec</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
      <div className="h-1 bg-gradient-to-r from-[#0EA5E9] to-[#06B6D4]"></div>

      {/* Footer */}
      <footer className="py-12 px-6 bg-[#111827] text-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#0EA5E9] to-[#06B6D4] flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold">DeepSkyn</span>
              </div>
              <p className="text-gray-400 text-sm">
                {t('landing.footerDesc')}
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4">{t('landing.product')}</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">{t('landing.footerFeatures')}</a></li>
                <li><a href="#" className="hover:text-white transition-colors">{t('landing.footerPricing')}</a></li>
                <li><a href="#" className="hover:text-white transition-colors">{t('landing.footerFaq')}</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">{t('landing.company')}</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">{t('landing.footerAbout')}</a></li>
                <li><a href="#" className="hover:text-white transition-colors">{t('landing.footerBlog')}</a></li>
                <li><a href="#" className="hover:text-white transition-colors">{t('landing.footerCareers')}</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">{t('landing.legal')}</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">{t('landing.footerPrivacy')}</a></li>
                <li><a href="#" className="hover:text-white transition-colors">{t('landing.footerTerms')}</a></li>
                <li><a href="#" className="hover:text-white transition-colors">{t('landing.footerSecurity')}</a></li>
              </ul>
            </div>
          </div>
          <div className="flex justify-center gap-6 my-8">
            {/* Replace with actual icons */}
            <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center text-white">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M12.315 2c-4.418 0-8 3.582-8 8s3.582 8 8 8 8-3.582 8-8-3.582-8-8-8zM12 18c-3.313 0-6-2.687-6-6s2.687-6 6-6 6 2.687 6 6-2.687 6-6 6zm-2-6h4v-2h-4v2z" clipRule="evenodd" /></svg>
            </div>
            <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center text-white">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M22.46 6c-.77.35-1.6.58-2.46.67.88-.53 1.56-1.37 1.88-2.38-.83.49-1.74.85-2.7 1.04C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.27 0 .34.04.67.11.98-3.56-.18-6.72-1.88-8.83-4.48-.37.63-.58 1.37-.58 2.15 0 1.48.75 2.79 1.9 3.55-.7-.02-1.36-.21-1.94-.54v.05c0 2.07 1.47 3.8 3.42 4.19-.36.1-.73.15-1.12.15-.27 0-.54-.03-.8-.08.54 1.7 2.1 2.94 3.96 2.97-1.46 1.14-3.3 1.82-5.3 1.82-.34 0-.68-.02-1.02-.06C3.43 18.5 5.62 19.5 8.01 19.5c7.2 0 11.13-5.97 11.13-11.13 0-.17 0-.34-.01-.51.77-.56 1.44-1.25 1.97-2.02z" /></svg>
            </div>
            <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center text-white">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14zm-11 6H5v7h3V9zm-1 8H6v-1h1v1zm4 0H9v-1h1v1zm4 0h-1v-1h1v1zm4-8h-3v7h3V9z" clipRule="evenodd" /></svg>
            </div>
          </div>
          <div className="pt-8 border-t border-gray-800 text-center text-sm text-gray-400">
            © 2026 DeepSkyn. {t('landing.allRightsReserved')}
          </div>
        </div>
      </footer>
    </div>
  );
}
