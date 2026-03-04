import React, { useState, useEffect } from 'react';
import { motion, Reorder } from 'motion/react';
import { ArrowLeft, Sun, Moon, Plus, AlertTriangle, Info, GripVertical, Check, Loader2, Sparkles } from 'lucide-react';
import { Button } from '../button';
import { Card } from '../card';
import { routineService } from '../../../lib/services/routine.service';
import type { Routine, RoutineStep } from '../../../lib/types';

interface RoutinePageProps {
  onBack: () => void;
}

interface Product {
  id: string;
  name: string;
  type: string;
  ingredients: string[];
  order: number;
  conflictsWith?: string[];
  completed?: boolean;
}

export function RoutinePage({ onBack }: RoutinePageProps) {
  const [activeTab, setActiveTab] = useState<'am' | 'pm'>('am');
  const [showConflicts, setShowConflicts] = useState(false);
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const mapStepsToProducts = (steps: RoutineStep[]): Product[] =>
    steps.map((s, i) => ({
      id: s.id || `step-${i}`,
      name: s.productName || s.name || `Step ${i + 1}`,
      type: s.category || 'Product',
      ingredients: s.ingredients || [],
      order: s.order ?? i + 1,
      completed: s.completed,
      conflictsWith: s.conflicts || [],
    }));

  useEffect(() => {
    const load = async () => {
      try {
        const data = await routineService.getAll();
        const list = Array.isArray(data) ? data : (data as any).data ?? [];
        setRoutines(list);
        if (list.length > 0) {
          const am = list.find((r: Routine) => r.type === 'MORNING' || r.type === 'morning');
          const pm = list.find((r: Routine) => r.type === 'EVENING' || r.type === 'evening');
          if (am?.steps) setAmRoutine(mapStepsToProducts(am.steps));
          if (pm?.steps) setPmRoutine(mapStepsToProducts(pm.steps));
        }
      } catch { /* use defaults */ } finally { setLoading(false); }
    };
    load();
  }, []);

  const handleGenerateAI = async () => {
    setGenerating(true);
    try {
      const routine = await routineService.generateAI({ type: activeTab === 'am' ? 'MORNING' : 'EVENING' });
      if (routine?.steps) {
        const products = mapStepsToProducts(routine.steps);
        if (activeTab === 'am') setAmRoutine(products);
        else setPmRoutine(products);
      }
    } catch { /* handle */ } finally { setGenerating(false); }
  };

  const handleCompleteStep = async (routineId: string, stepOrder: number) => {
    try {
      await routineService.completeStep(routineId, stepOrder);
      const setter = activeTab === 'am' ? setAmRoutine : setPmRoutine;
      setter(prev => prev.map(p => p.order === stepOrder ? { ...p, completed: true } : p));
    } catch { /* handle */ }
  };

  const [amRoutine, setAmRoutine] = useState<Product[]>([
    {
      id: 'am-1',
      name: 'Gentle Cleanser',
      type: 'Cleanser',
      ingredients: ['Glycerin', 'Ceramides'],
      order: 1
    },
    {
      id: 'am-2',
      name: 'Vitamin C Serum',
      type: 'Serum',
      ingredients: ['Vitamin C', 'Hyaluronic Acid'],
      order: 2
    },
    {
      id: 'am-3',
      name: 'Moisturizer',
      type: 'Moisturizer',
      ingredients: ['Niacinamide', 'Peptides'],
      order: 3
    },
    {
      id: 'am-4',
      name: 'SPF 50 Sunscreen',
      type: 'Sunscreen',
      ingredients: ['Zinc Oxide', 'Titanium Dioxide'],
      order: 4
    }
  ]);

  const [pmRoutine, setPmRoutine] = useState<Product[]>([
    {
      id: 'pm-1',
      name: 'Oil Cleanser',
      type: 'Cleanser',
      ingredients: ['Jojoba Oil', 'Vitamin E'],
      order: 1
    },
    {
      id: 'pm-2',
      name: 'Gentle Cleanser',
      type: 'Cleanser',
      ingredients: ['Glycerin', 'Ceramides'],
      order: 2
    },
    {
      id: 'pm-3',
      name: 'Retinol Serum',
      type: 'Serum',
      ingredients: ['Retinol', 'Squalane'],
      order: 3,
      conflictsWith: ['Vitamin C', 'AHA', 'BHA']
    },
    {
      id: 'pm-4',
      name: 'Night Cream',
      type: 'Moisturizer',
      ingredients: ['Hyaluronic Acid', 'Peptides'],
      order: 4
    }
  ]);

  const currentRoutine = activeTab === 'am' ? amRoutine : pmRoutine;
  const setCurrentRoutine = activeTab === 'am' ? setAmRoutine : setPmRoutine;

  const productTypes = [
    { name: 'Cleanser', color: '#06B6D4' },
    { name: 'Toner', color: '#F9A8D4' },
    { name: 'Serum', color: '#0EA5E9' },
    { name: 'Moisturizer', color: '#FBBF24' },
    { name: 'Sunscreen', color: '#F59E0B' },
    { name: 'Treatment', color: '#8B5CF6' }
  ];

  const getTypeColor = (type: string) => {
    const found = productTypes.find(t => t.name === type);
    return found?.color || '#6B7280';
  };

  const hasConflicts = (product: Product) => {
    if (!product.conflictsWith) return false;
    
    return currentRoutine.some(p => 
      p.id !== product.id && 
      p.ingredients.some(ing => 
        product.conflictsWith?.some(conflict => 
          ing.toLowerCase().includes(conflict.toLowerCase())
        )
      )
    );
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-[#6B7280] hover:text-[#0EA5E9] mb-4 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Dashboard</span>
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Skincare Routine</h1>
            <p className="text-[#6B7280]">Personalized for your skin type and concerns</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleGenerateAI} disabled={generating}>
              {generating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
              {generating ? 'Generating...' : 'AI Generate'}
            </Button>
            <Button>Save Changes</Button>
          </div>
        </div>
      </div>

      {/* AM/PM Tabs */}
      <div className="flex gap-4 mb-8">
        <motion.button
          onClick={() => setActiveTab('am')}
          className={`flex-1 px-8 py-4 rounded-2xl font-semibold transition-all duration-200 ${
            activeTab === 'am'
              ? 'bg-gradient-to-r from-[#FBBF24] to-[#F59E0B] text-white shadow-lg'
              : 'bg-white border-2 border-[#E5E7EB] text-[#6B7280] hover:border-[#FBBF24]'
          }`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="flex items-center justify-center gap-3">
            <Sun className="w-6 h-6" />
            <span>Morning Routine</span>
          </div>
        </motion.button>

        <motion.button
          onClick={() => setActiveTab('pm')}
          className={`flex-1 px-8 py-4 rounded-2xl font-semibold transition-all duration-200 ${
            activeTab === 'pm'
              ? 'bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white shadow-lg'
              : 'bg-white border-2 border-[#E5E7EB] text-[#6B7280] hover:border-[#6366F1]'
          }`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="flex items-center justify-center gap-3">
            <Moon className="w-6 h-6" />
            <span>Evening Routine</span>
          </div>
        </motion.button>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Routine Builder */}
        <div className="lg:col-span-2">
          <Card>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold">
                {activeTab === 'am' ? 'Morning' : 'Evening'} Steps
              </h3>
              <button className="flex items-center gap-2 px-4 py-2 text-sm text-[#0EA5E9] hover:bg-[#0EA5E9]/10 rounded-lg transition-colors">
                <Plus className="w-4 h-4" />
                Add Product
              </button>
            </div>

            <div className="bg-[#F9FAFB] rounded-xl p-4 mb-6">
              <div className="flex items-start gap-2 text-sm text-[#6B7280]">
                <Info className="w-5 h-5 text-[#0EA5E9] flex-shrink-0 mt-0.5" />
                <p>
                  Drag and drop to reorder your routine. Products should be applied from thinnest 
                  to thickest consistency.
                </p>
              </div>
            </div>

            <Reorder.Group
              axis="y"
              values={currentRoutine}
              onReorder={setCurrentRoutine}
              className="space-y-3"
            >
              {currentRoutine.map((product, index) => {
                const productHasConflicts = hasConflicts(product);
                
                return (
                  <Reorder.Item
                    key={product.id}
                    value={product}
                    className="relative"
                  >
                    <motion.div
                      className={`bg-white rounded-xl p-4 border-2 cursor-move ${
                        productHasConflicts
                          ? 'border-[#EF4444] bg-[#EF4444]/5'
                          : 'border-[#E5E7EB] hover:border-[#0EA5E9]'
                      } transition-all duration-200`}
                      whileHover={{ scale: 1.02 }}
                      whileDrag={{ scale: 1.05, boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}
                    >
                      <div className="flex items-center gap-4">
                        <GripVertical className="w-5 h-5 text-[#9CA3AF]" />
                        
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#0EA5E9]/10 text-[#0EA5E9] font-bold flex-shrink-0">
                          {index + 1}
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-bold">{product.name}</h4>
                            <span 
                              className="px-2 py-0.5 rounded-full text-xs text-white"
                              style={{ backgroundColor: getTypeColor(product.type) }}
                            >
                              {product.type}
                            </span>
                          </div>
                          <p className="text-sm text-[#6B7280]">
                            {product.ingredients.join(', ')}
                          </p>
                        </div>

                        {productHasConflicts && (
                          <div className="flex items-center gap-2 text-[#EF4444]">
                            <AlertTriangle className="w-5 h-5" />
                            <span className="text-sm font-medium">Conflict</span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  </Reorder.Item>
                );
              })}
            </Reorder.Group>
          </Card>
        </div>

        {/* Info Panel */}
        <div className="space-y-6">
          {/* Product Order Guide */}
          <Card>
            <h3 className="text-lg font-bold mb-4">Application Order</h3>
            <div className="space-y-3">
              {productTypes.map((type, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#0EA5E9]/10 flex items-center justify-center text-sm font-bold text-[#0EA5E9]">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{type.name}</span>
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: type.color }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Tips */}
          <Card>
            <h3 className="text-lg font-bold mb-4">Pro Tips</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <Check className="w-5 h-5 text-[#10B981] flex-shrink-0 mt-0.5" />
                <p className="text-sm text-[#6B7280]">
                  Wait 30-60 seconds between each step
                </p>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-5 h-5 text-[#10B981] flex-shrink-0 mt-0.5" />
                <p className="text-sm text-[#6B7280]">
                  Apply products to damp skin for better absorption
                </p>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-5 h-5 text-[#10B981] flex-shrink-0 mt-0.5" />
                <p className="text-sm text-[#6B7280]">
                  Use sunscreen as the last step in the morning
                </p>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-5 h-5 text-[#10B981] flex-shrink-0 mt-0.5" />
                <p className="text-sm text-[#6B7280]">
                  Don't mix Vitamin C with Retinol
                </p>
              </div>
            </div>
          </Card>

          {/* Streak Tracker */}
          <Card>
            <h3 className="text-lg font-bold mb-4">Consistency Tracker</h3>
            <div className="text-center mb-4">
              <div className="text-5xl font-bold text-[#0EA5E9] mb-2">14</div>
              <p className="text-sm text-[#6B7280]">Day Streak 🔥</p>
            </div>
            <div className="grid grid-cols-7 gap-2">
              {[...Array(14)].map((_, i) => (
                <div
                  key={i}
                  className="aspect-square rounded-lg bg-gradient-to-br from-[#0EA5E9] to-[#06B6D4]"
                />
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
