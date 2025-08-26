'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { CheckCircle, ArrowRight, Sparkles } from 'lucide-react';

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: "Welcome to WingMan AI! 🎉",
      subtitle: "Your AI-powered social confidence coach",
      content: (
        <div className="text-center space-y-6">
          <div className="w-24 h-24 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <Sparkles className="w-12 h-12 text-white" />
          </div>
          <p className="text-lg text-slate-300 max-w-md mx-auto">
            You're about to transform your social skills through AI-powered practice sessions and instant feedback.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            {[
              "Practice Real Conversations",
              "Get Instant Feedback", 
              "Build Confidence"
            ].map((feature, index) => (
              <div key={index} className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                <CheckCircle className="w-6 h-6 text-green-400 mx-auto mb-2" />
                <p className="text-sm text-slate-300">{feature}</p>
              </div>
            ))}
          </div>
        </div>
      )
    },
    {
      title: "Choose Your Plan",
      subtitle: "Start your social confidence journey",
      content: (
        <div className="w-full max-w-4xl mx-auto">
          <PricingPlans />
        </div>
      )
    }
  ];

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePlanSelection = (planType: string) => {
    // Store the selected plan in localStorage for profile setup
    localStorage.setItem('selectedPlan', planType);
    // Redirect to profile setup
    router.push('/profile-setup');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <motion.div
        key={currentStep}
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -50 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-4xl bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-8 shadow-2xl"
      >
        {/* Progress Indicator */}
        <div className="flex justify-center mb-8">
          <div className="flex space-x-2">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`w-3 h-3 rounded-full ${
                  index <= currentStep ? 'bg-purple-500' : 'bg-slate-600'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
            {steps[currentStep].title}
          </h1>
          <p className="text-xl text-slate-400 mb-8">
            {steps[currentStep].subtitle}
          </p>
          
          {steps[currentStep].content}
        </div>

        {/* Navigation */}
        {currentStep === 0 && (
          <div className="flex justify-center">
            <Button
              onClick={nextStep}
              size="lg"
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 px-8 py-3 text-lg"
            >
              Get Started
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        )}
      </motion.div>
    </div>
  );
}

// Pricing Plans Component
function PricingPlans() {
  const router = useRouter();

  const plans = [
    {
      name: "Free Trial",
      price: "Free",
      originalPrice: null,
      period: "3 days",
      description: "Perfect for getting started",
      features: [
        "5 practice conversations",
        "Basic feedback",
        "Text chat only",
        "2 scenarios"
      ],
      buttonText: "Start Free Trial",
      popular: false,
      planType: "trial"
    },
    {
      name: "Weekly Plan",
      price: "$10",
      originalPrice: "$15",
      period: "week",
      description: "Great for intensive practice",
      features: [
        "Unlimited conversations",
        "Advanced feedback & tips",
        "Voice practice included",
        "All scenarios (15+)",
        "Progress tracking",
        "Confidence scoring"
      ],
      buttonText: "Choose Weekly",
      popular: true,
      planType: "weekly"
    },
    {
      name: "Monthly Plan",
      price: "$25",
      originalPrice: "$35",
      period: "month",
      description: "Best value for long-term growth",
      features: [
        "Everything in Weekly",
        "Premium scenarios",
        "Advanced analytics",
        "Export progress reports",
        "Priority support",
        "Custom practice goals"
      ],
      buttonText: "Choose Monthly",
      popular: false,
      planType: "monthly"
    }
  ];

  const handlePlanSelect = (planType: string) => {
    router.push('/dashboard');
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {plans.map((plan, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
          className={`relative bg-slate-900/50 rounded-xl border p-6 ${
            plan.popular 
              ? 'border-purple-500 ring-2 ring-purple-500/20' 
              : 'border-slate-700'
          }`}
        >
          {plan.popular && (
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <span className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-semibold px-4 py-1 rounded-full">
                Most Popular
              </span>
            </div>
          )}

          <div className="text-center mb-6">
            <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
            <div className="mb-2">
              {plan.originalPrice && (
                <span className="text-slate-500 line-through text-lg mr-2">
                  {plan.originalPrice}
                </span>
              )}
              <span className="text-3xl font-bold text-white">{plan.price}</span>
              {plan.price !== "Free" && (
                <span className="text-slate-400">/{plan.period}</span>
              )}
            </div>
            <p className="text-slate-400 text-sm">{plan.description}</p>
          </div>

          <ul className="space-y-3 mb-8">
            {plan.features.map((feature, featureIndex) => (
              <li key={featureIndex} className="flex items-center text-sm text-slate-300">
                <CheckCircle className="w-4 h-4 text-green-400 mr-3 flex-shrink-0" />
                {feature}
              </li>
            ))}
          </ul>

          <Button
            onClick={() => handlePlanSelect(plan.planType)}
            className={`w-full ${
              plan.popular
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'
                : 'bg-slate-700 hover:bg-slate-600 text-white'
            }`}
          >
            {plan.buttonText}
          </Button>
        </motion.div>
      ))}
    </div>
  );
}
