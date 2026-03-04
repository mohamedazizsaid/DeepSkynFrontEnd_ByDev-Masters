import React, { useState } from 'react';
import { motion } from 'motion/react';
import { User, MapPin, Calendar } from 'lucide-react';
import { Button } from '../button';
import { Input } from '../input';

interface PersonalInfoStepProps {
  onNext: (data: any) => void;
  onBack: () => void;
}

export function PersonalInfoStep({ onNext, onBack }: PersonalInfoStepProps) {
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: '',
    location: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext(formData);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="max-w-2xl mx-auto"
    >
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold mb-4">Tell Us About Yourself</h2>
        <p className="text-lg text-[#6B7280]">
          This helps us personalize your skincare experience
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-2xl p-8 shadow-md border border-[#E5E7EB] space-y-6">
          <Input
            type="text"
            label="Full Name"
            placeholder="Enter your name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            icon={<User className="w-5 h-5" />}
            required
          />

          <div className="grid md:grid-cols-2 gap-6">
            <Input
              type="number"
              label="Age"
              placeholder="25"
              value={formData.age}
              onChange={(e) => setFormData({ ...formData, age: e.target.value })}
              icon={<Calendar className="w-5 h-5" />}
              min="13"
              max="120"
              required
            />

            <div>
              <label className="block mb-2 text-sm text-[#374151]">Gender</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full px-4 py-3 bg-[#F9FAFB] border-2 border-[#E5E7EB] rounded-xl 
                  text-[#111827] focus:outline-none focus:border-[#0EA5E9] focus:ring-2 focus:ring-[#0EA5E9]/20
                  transition-all duration-200"
                required
              >
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="non-binary">Non-binary</option>
                <option value="prefer-not-to-say">Prefer not to say</option>
              </select>
            </div>
          </div>

          <Input
            type="text"
            label="Location (Optional)"
            placeholder="City, Country"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            icon={<MapPin className="w-5 h-5" />}
          />

          <div className="bg-[#0EA5E9]/10 rounded-xl p-4">
            <p className="text-sm text-[#0EA5E9]">
              💡 <strong>Why we ask:</strong> Age and location help us provide climate-specific 
              skincare recommendations and age-appropriate treatments.
            </p>
          </div>
        </div>

        <div className="flex gap-4">
          <Button type="button" variant="outline" onClick={onBack} className="flex-1">
            Back
          </Button>
          <Button type="submit" className="flex-1">
            Continue
          </Button>
        </div>
      </form>
    </motion.div>
  );
}
