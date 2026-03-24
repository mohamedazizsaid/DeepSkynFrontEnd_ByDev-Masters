import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, Brain, Calendar, TrendingUp, Shield, Star, Check, ArrowRight } from 'lucide-react';
import { Button } from './button';
import { Card } from './card';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface LandingPageProps {
  onGetStarted: () => void;
  onLogin: () => void;
}

export function LandingPage({ onGetStarted, onLogin }: LandingPageProps) {
  const features = [
    {
      icon: <Brain className="w-8 h-8" />,
      title: 'AI-Powered Analysis',
      description: 'Advanced AI technology analyzes your skin with medical-grade precision'
    },
    {
      icon: <Calendar className="w-8 h-8" />,
      title: 'Personalized Routines',
      description: 'Custom skincare routines tailored to your unique skin profile'
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: 'Track Your Progress',
      description: 'Monitor your skin evolution with detailed analytics and insights'
    },
    {
      icon: <Sparkles className="w-8 h-8" />,
      title: 'Smart Recommendations',
      description: 'Get product recommendations based on your skin concerns'
    }
  ];

  const benefits = [
    'Fitzpatrick skin type analysis',
    'Real age vs skin age comparison',
    'Personalized AI dermatology coach',
    'Daily routine reminders',
    'Progress tracking & reporting',
    'Expert skincare insights'
  ];

  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'Premium User',
      text: 'DeepSkyn transformed my skincare routine! The AI analysis was incredibly accurate.',
      rating: 5
    },
    {
      name: 'Michael Chen',
      role: 'Free User',
      text: 'Finally, I understand my skin type and what products actually work for me.',
      rating: 5
    },
    {
      name: 'Emma Williams',
      role: 'Premium User',
      text: 'The progress tracking keeps me motivated. I can see real improvements over time!',
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
              Sign In
            </Button>
            <Button onClick={onGetStarted}>
              Get Started
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
                <span className="text-sm text-[#0EA5E9] font-medium">AI-Powered Dermatology</span>
              </div>
              
              <h1 className="text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                Your Personal
                <span className="block bg-gradient-to-r from-[#0EA5E9] to-[#06B6D4] bg-clip-text text-transparent">
                  Skin Health
                </span>
                Companion
              </h1>
              
              <p className="text-xl text-[#6B7280] mb-8 leading-relaxed">
                Discover your skin's true potential with AI-powered analysis, personalized routines, 
                and expert guidance tailored just for you.
              </p>
              
              <div className="flex flex-wrap gap-4">
                <Button size="lg" onClick={onGetStarted}>
                  Start Your Journey
                  <ArrowRight className="w-5 h-5" />
                </Button>
                <Button variant="outline" size="lg">
                  Watch Demo
                </Button>
              </div>

              <div className="mt-12 flex items-center gap-8">
                <div>
                  <div className="text-3xl font-bold text-[#0EA5E9]">50K+</div>
                  <div className="text-sm text-[#6B7280]">Active Users</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-[#0EA5E9]">4.9★</div>
                  <div className="text-sm text-[#6B7280]">User Rating</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-[#0EA5E9]">95%</div>
                  <div className="text-sm text-[#6B7280]">Satisfaction</div>
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
                  src="https://images.unsplash.com/photo-1644222643716-38f3b2828de6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21hbiUyMHNraW5jYXJlJTIwbmF0dXJhbCUyMGJlYXV0eXxlbnwxfHx8fDE3NzA1NzU3OTZ8MA&ixlib=rb-4.1.0&q=80&w=1080"
                  alt="Skincare beauty"
                  className="w-full h-[600px] object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0EA5E9]/20 to-transparent"></div>
              </div>
              
              {/* Floating Stats Card */}
              <motion.div
                className="absolute bottom-8 left-8 right-8 bg-white/90 backdrop-blur-lg rounded-2xl p-6 shadow-xl"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-[#6B7280] mb-1">Skin Health Score</div>
                    <div className="text-3xl font-bold text-[#0EA5E9]">87/100</div>
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
            <h2 className="text-4xl font-bold mb-4">Powerful Features</h2>
            <p className="text-xl text-[#6B7280]">Everything you need for perfect skin health</p>
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
                <Card hoverable className="h-full">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#0EA5E9]/10 to-[#06B6D4]/10 flex items-center justify-center text-[#0EA5E9] mb-4">
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
                Why Choose
                <span className="block text-[#0EA5E9]">DeepSkyn?</span>
              </h2>
              <p className="text-xl text-[#6B7280] mb-8">
                Our comprehensive platform combines cutting-edge AI technology with dermatological expertise 
                to give you the best skincare experience.
              </p>
              
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
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
                  src="https://images.unsplash.com/photo-1663229049147-30f47be043ea?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkZXJtYXRvbG9neSUyMHNraW4lMjBhbmFseXNpcyUyMHRlY2hub2xvZ3l8ZW58MXx8fHwxNzcwNTc1Nzk2fDA&ixlib=rb-4.1.0&q=80&w=1080"
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
            <h2 className="text-4xl font-bold mb-4">Loved by Thousands</h2>
            <p className="text-xl text-[#6B7280]">See what our users are saying</p>
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
                <Card className="h-full">
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-[#FBBF24] text-[#FBBF24]" />
                    ))}
                  </div>
                  <p className="text-[#374151] mb-6 italic">"{testimonial.text}"</p>
                  <div>
                    <div className="font-bold text-[#111827]">{testimonial.name}</div>
                    <div className="text-sm text-[#6B7280]">{testimonial.role}</div>
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
            <h2 className="text-4xl font-bold mb-4">Simple, Transparent Pricing</h2>
            <p className="text-xl text-[#6B7280]">Choose the plan that's right for you</p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <Card className="h-full">
                <div className="mb-6">
                  <h3 className="text-2xl font-bold mb-2">Free</h3>
                  <div className="text-4xl font-bold text-[#0EA5E9]">
                    $0<span className="text-lg text-[#6B7280]">/month</span>
                  </div>
                </div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-[#0EA5E9]" />
                    <span>Basic skin analysis</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-[#0EA5E9]" />
                    <span>Personalized routine</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-[#0EA5E9]" />
                    <span>Monthly reports</span>
                  </li>
                </ul>
                <Button variant="outline" className="w-full" onClick={onGetStarted}>
                  Get Started
                </Button>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              <Card className="h-full border-2 border-[#0EA5E9] relative">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-[#0EA5E9] to-[#06B6D4] text-white text-sm font-medium rounded-full">
                  Most Popular
                </div>
                <div className="mb-6">
                  <h3 className="text-2xl font-bold mb-2">Premium</h3>
                  <div className="text-4xl font-bold bg-gradient-to-r from-[#0EA5E9] to-[#06B6D4] bg-clip-text text-transparent">
                    $19<span className="text-lg text-[#6B7280]">/month</span>
                  </div>
                </div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-[#0EA5E9]" />
                    <span>Advanced AI analysis</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-[#0EA5E9]" />
                    <span>AI dermatology coach</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-[#0EA5E9]" />
                    <span>Unlimited tracking</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-[#0EA5E9]" />
                    <span>Priority support</span>
                  </li>
                </ul>
                <Button className="w-full" onClick={onGetStarted}>
                  Start Premium Trial
                </Button>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gradient-to-r from-[#0EA5E9] to-[#06B6D4]">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
              Ready to Transform Your Skin?
            </h2>
            <p className="text-xl text-white/90 mb-8">
              Join thousands of users achieving their best skin ever
            </p>
            <Button 
              size="lg" 
              variant="outline" 
              className="bg-white text-[#0EA5E9] hover:bg-gray-50 border-0"
              onClick={onGetStarted}
            >
              Start Your Free Analysis
              <ArrowRight className="w-5 h-5" />
            </Button>
          </motion.div>
        </div>
      </section>

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
                AI-powered skincare companion for your best skin ever.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-gray-800 text-center text-sm text-gray-400">
            © 2026 DeepSkyn. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
