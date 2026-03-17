import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, X } from 'lucide-react';

interface AddStepFormProps {
  onAdd: (step: {
    name: string;
    category: string;
    description: string;
    duration: number;
  }) => void;
}

const categories = [
  { value: 'cleanser', label: 'Nettoyant' },
  { value: 'toner', label: 'Tonique' },
  { value: 'serum', label: 'Sérum' },
  { value: 'moisturizer', label: 'Hydratant' },
  { value: 'sunscreen', label: 'Protection solaire' },
  { value: 'eye_cream', label: 'Contour des yeux' },
  { value: 'night_cream', label: 'Crème de nuit' },
  { value: 'exfoliant', label: 'Exfoliant' },
  { value: 'makeup_remover', label: 'Démaquillant' },
  { value: 'mask', label: 'Masque' },
  { value: 'treatment', label: 'Traitement' },
];

export function AddStepForm({ onAdd }: AddStepFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('serum');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState(30);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onAdd({ name: name.trim(), category, description: description.trim(), duration });
    setName('');
    setDescription('');
    setDuration(30);
    setIsOpen(false);
  };

  return (
    <div>
      <AnimatePresence>
        {!isOpen ? (
          <motion.button
            key="trigger"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(true)}
            className="w-full py-4 rounded-2xl border-2 border-dashed border-gray-200 hover:border-[#D4AF37]/40 text-gray-400 hover:text-[#D4AF37] flex items-center justify-center gap-2 transition-all duration-300 hover:bg-[#D4AF37]/5"
          >
            <Plus className="w-5 h-5" />
            <span className="font-medium text-sm">Ajouter une étape</span>
          </motion.button>
        ) : (
          <motion.form
            key="form"
            initial={{ opacity: 0, y: 20, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            onSubmit={handleSubmit}
            className="relative overflow-hidden rounded-2xl border border-gray-100 p-5 bg-white shadow-md"
            style={{
              background: 'linear-gradient(135deg, rgba(212,175,55,0.02), rgba(255,255,255,1))',
              backdropFilter: 'blur(20px)',
            }}
          >
            {/* Close button */}
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="absolute top-3 right-3 p-1.5 rounded-lg text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <h4 className="text-sm font-semibold text-gray-900 mb-4">Nouvelle étape</h4>

            <div className="space-y-3">
              {/* Name */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">Nom du produit *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Sérum Vitamine C"
                  className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:border-[#D4AF37]/50 focus:ring-1 focus:ring-[#D4AF37]/30 transition-all"
                  autoFocus
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">Catégorie</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-sm focus:outline-none focus:border-[#D4AF37]/50 focus:ring-1 focus:ring-[#D4AF37]/30 transition-all appearance-none"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='rgba(0,0,0,0.5)' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 12px center',
                  }}
                >
                  {categories.map((c) => (
                    <option key={c.value} value={c.value} className="bg-white text-gray-900">
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">Description (optionnel)</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ex: Appliquer sur peau propre"
                  className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:border-[#D4AF37]/50 focus:ring-1 focus:ring-[#D4AF37]/30 transition-all"
                />
              </div>

              {/* Duration */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">Durée (secondes)</label>
                <input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value) || 30)}
                  min={5}
                  max={3600}
                  className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-sm focus:outline-none focus:border-[#D4AF37]/50 focus:ring-1 focus:ring-[#D4AF37]/30 transition-all"
                />
              </div>
            </div>

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={!name.trim()}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full mt-4 py-3 rounded-xl font-semibold text-sm transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed bg-gradient-to-r from-[#D4AF37] to-[#B8972E] text-black shadow-lg shadow-[#D4AF37]/20 hover:shadow-xl hover:shadow-[#D4AF37]/30"
            >
              <span className="flex items-center justify-center gap-2">
                <Plus className="w-4 h-4" />
                Ajouter à la routine
              </span>
            </motion.button>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
