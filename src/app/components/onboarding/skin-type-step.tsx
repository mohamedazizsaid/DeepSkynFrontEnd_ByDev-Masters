import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Sun, Check } from 'lucide-react';
import { Button } from '../button';

interface SkinTypeStepProps {
  onNext: (data: any) => void;
  onBack: () => void;
}

const skinTypes = [
  {
    type: 'I',
    title: 'Type I',
    description: 'Always burns, never tans',
    color: '#FFF5F5',
    borderColor: '#FED7D7'
  },
  {
    type: 'II',
    title: 'Type II',
    description: 'Usually burns, tans minimally',
    color: '#FFF5EB',
    borderColor: '#FEEBC8'
  },
  {
    type: 'III',
    title: 'Type III',
    description: 'Sometimes burns, tans gradually',
    color: '#FFFAF0',
    borderColor: '#FEEBC8'
  },
  {
    type: 'IV',
    title: 'Type IV',
    description: 'Rarely burns, tans easily',
    color: '#FEF5E7',
    borderColor: '#F7DCB4'
  },
  {
    type: 'V',
    title: 'Type V',
    description: 'Very rarely burns, tans very easily',
    color: '#F5E6D3',
    borderColor: '#E8D4B8'
  },
  {
    type: 'VI',
    title: 'Type VI',
    description: 'Never burns, deeply pigmented',
    color: '#E8D5C4',
    borderColor: '#D4BDA8'
  }
];

const sunQuestions = [
  {
    question: 'How does your skin react to sun exposure without protection?',
    options: [
      { value: 'always-burn', label: 'Always burns, never tans', points: 1 },
      { value: 'usually-burn', label: 'Usually burns, sometimes tans', points: 2 },
      { value: 'sometimes-burn', label: 'Sometimes burns, usually tans', points: 3 },
      { value: 'rarely-burn', label: 'Rarely burns, always tans', points: 4 },
      { value: 'never-burn', label: 'Never burns', points: 5 }
    ]
  },
  {
    question: 'What is your natural hair color?',
    options: [
      { value: 'red-blonde', label: 'Red or blonde', points: 1 },
      { value: 'light-brown', label: 'Light brown', points: 2 },
      { value: 'brown', label: 'Brown', points: 3 },
      { value: 'dark-brown', label: 'Dark brown', points: 4 },
      { value: 'black', label: 'Black', points: 5 }
    ]
  },
  {
    question: 'What is your natural eye color?',
    options: [
      { value: 'blue-gray-green', label: 'Blue, gray, or green', points: 1 },
      { value: 'hazel', label: 'Hazel', points: 2 },
      { value: 'light-brown', label: 'Light brown', points: 3 },
      { value: 'brown', label: 'Brown', points: 4 },
      { value: 'dark-brown-black', label: 'Dark brown or black', points: 5 }
    ]
  }
];

export function SkinTypeStep({ onNext, onBack }: SkinTypeStepProps) {
  const [selectedType, setSelectedType] = useState<string>('');
  const [answers, setAnswers] = useState<{ [key: number]: string }>({});

  const handleAnswerChange = (questionIndex: number, value: string) => {
    setAnswers({ ...answers, [questionIndex]: value });
  };

  const calculateSkinType = () => {
    const totalPoints = Object.keys(answers).reduce((sum, key) => {
      const questionIndex = parseInt(key);
      const answer = answers[questionIndex];
      const question = sunQuestions[questionIndex];
      const option = question.options.find(opt => opt.value === answer);
      return sum + (option?.points || 0);
    }, 0);

    const avgPoints = totalPoints / sunQuestions.length;
    
    if (avgPoints <= 1.5) return 'I';
    if (avgPoints <= 2.5) return 'II';
    if (avgPoints <= 3.5) return 'III';
    if (avgPoints <= 4.2) return 'IV';
    if (avgPoints <= 4.7) return 'V';
    return 'VI';
  };

  const suggestedType = Object.keys(answers).length === sunQuestions.length ? calculateSkinType() : '';

  const handleSubmit = () => {
    onNext({ 
      skinType: selectedType || suggestedType,
      sunSensitivity: answers
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="max-w-4xl mx-auto"
    >
      <div className="text-center mb-12">
        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-[#FBBF24] to-[#F59E0B] flex items-center justify-center">
          <Sun className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-3xl font-bold mb-4">Fitzpatrick Skin Type</h2>
        <p className="text-lg text-[#6B7280]">
          Understanding your skin type helps us provide better recommendations
        </p>
      </div>

      {/* Questionnaire */}
      <div className="bg-white rounded-2xl p-8 shadow-md border border-[#E5E7EB] mb-8">
        <h3 className="text-xl font-bold mb-6">Quick Assessment</h3>
        <div className="space-y-8">
          {sunQuestions.map((q, index) => (
            <div key={index}>
              <label className="block font-medium mb-4">{q.question}</label>
              <div className="space-y-2">
                {q.options.map((option) => (
                  <label
                    key={option.value}
                    className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                      answers[index] === option.value
                        ? 'border-[#0EA5E9] bg-[#0EA5E9]/5'
                        : 'border-[#E5E7EB] hover:border-[#0EA5E9]/50'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`question-${index}`}
                      value={option.value}
                      checked={answers[index] === option.value}
                      onChange={(e) => handleAnswerChange(index, e.target.value)}
                      className="w-5 h-5 text-[#0EA5E9] focus:ring-[#0EA5E9]"
                    />
                    <span className="ml-3">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        {suggestedType && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 p-4 bg-[#0EA5E9]/10 rounded-xl"
          >
            <p className="text-sm text-[#0EA5E9]">
              ✨ Based on your answers, you appear to be <strong>Fitzpatrick Type {suggestedType}</strong>
            </p>
          </motion.div>
        )}
      </div>

      {/* Skin Type Selection */}
      <div className="bg-white rounded-2xl p-8 shadow-md border border-[#E5E7EB] mb-8">
        <h3 className="text-xl font-bold mb-6">Select Your Skin Type</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {skinTypes.map((skin) => (
            <motion.button
              key={skin.type}
              type="button"
              onClick={() => setSelectedType(skin.type)}
              className={`relative p-4 rounded-xl border-2 transition-all duration-200 ${
                selectedType === skin.type || (suggestedType === skin.type && !selectedType)
                  ? 'border-[#0EA5E9] shadow-lg'
                  : 'border-[#E5E7EB] hover:border-[#0EA5E9]/50'
              }`}
              style={{ backgroundColor: skin.color }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {selectedType === skin.type && (
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-[#0EA5E9] rounded-full flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" />
                </div>
              )}
              <div className="text-2xl font-bold mb-2">{skin.type}</div>
              <div className="text-xs text-[#6B7280]">{skin.description}</div>
            </motion.button>
          ))}
        </div>
      </div>

      <div className="flex gap-4">
        <Button type="button" variant="outline" onClick={onBack} className="flex-1">
          Back
        </Button>
        <Button 
          onClick={handleSubmit} 
          className="flex-1"
          disabled={!selectedType && !suggestedType}
        >
          Continue
        </Button>
      </div>
    </motion.div>
  );
}
