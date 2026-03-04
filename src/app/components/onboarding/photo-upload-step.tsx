import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Upload, Camera, X, AlertCircle, Check } from 'lucide-react';
import { Button } from '../button';

interface PhotoUploadStepProps {
  onNext: (data: any) => void;
  onBack: () => void;
}

export function PhotoUploadStep({ onNext, onBack }: PhotoUploadStepProps) {
  const [photos, setPhotos] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      handleFiles(files);
    }
  };

  const handleFiles = (files: File[]) => {
    if (photos.length + files.length > 5) {
      alert('Maximum 5 photos allowed');
      return;
    }

    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            setPhotos(prev => [...prev, e.target!.result as string]);
          }
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    onNext({ photos });
  };

  const guidelines = [
    'Face the camera directly with good lighting',
    'Remove makeup for best results',
    'Take photos in natural daylight',
    'Include close-ups of problem areas',
    'Minimum 1 photo, maximum 5 photos'
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="max-w-4xl mx-auto"
    >
      <div className="text-center mb-12">
        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-[#F9A8D4] to-[#FED7AA] flex items-center justify-center">
          <Camera className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-3xl font-bold mb-4">Upload Your Photos</h2>
        <p className="text-lg text-[#6B7280]">
          Help our AI analyze your skin by uploading clear photos
        </p>
      </div>

      {/* Guidelines */}
      <div className="bg-[#0EA5E9]/10 rounded-2xl p-6 mb-8">
        <h3 className="font-bold mb-4 flex items-center gap-2 text-[#0EA5E9]">
          <AlertCircle className="w-5 h-5" />
          Photo Guidelines
        </h3>
        <ul className="space-y-2">
          {guidelines.map((guideline, index) => (
            <li key={index} className="flex items-start gap-2 text-sm text-[#374151]">
              <Check className="w-5 h-5 text-[#0EA5E9] flex-shrink-0 mt-0.5" />
              <span>{guideline}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Upload Area */}
      <div className="bg-white rounded-2xl p-8 shadow-md border border-[#E5E7EB] mb-8">
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-200 ${
            isDragging
              ? 'border-[#0EA5E9] bg-[#0EA5E9]/5 scale-105'
              : 'border-[#E5E7EB] hover:border-[#0EA5E9]/50'
          }`}
        >
          <input
            type="file"
            id="photo-upload"
            className="hidden"
            accept="image/*"
            multiple
            onChange={handleFileInput}
          />
          
          <motion.div
            animate={isDragging ? { scale: 1.1 } : { scale: 1 }}
            className="mb-4"
          >
            <Upload className="w-16 h-16 mx-auto text-[#0EA5E9]" />
          </motion.div>
          
          <h3 className="text-xl font-bold mb-2">
            {isDragging ? 'Drop your photos here' : 'Drag & drop your photos'}
          </h3>
          <p className="text-[#6B7280] mb-4">or</p>
          
          <label htmlFor="photo-upload">
            <Button type="button" onClick={() => document.getElementById('photo-upload')?.click()}>
              Browse Files
            </Button>
          </label>
          
          <p className="text-sm text-[#9CA3AF] mt-4">
            {photos.length}/5 photos uploaded
          </p>
        </div>

        {/* Photo Previews */}
        {photos.length > 0 && (
          <div className="mt-6">
            <h3 className="font-bold mb-4">Uploaded Photos</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <AnimatePresence>
                {photos.map((photo, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="relative group"
                  >
                    <div className="aspect-square rounded-xl overflow-hidden border-2 border-[#E5E7EB]">
                      <img
                        src={photo}
                        alt={`Upload ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <button
                      onClick={() => removePhoto(index)}
                      className="absolute -top-2 -right-2 w-8 h-8 bg-[#EF4444] rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:scale-110"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-4">
        <Button type="button" variant="outline" onClick={onBack} className="flex-1">
          Back
        </Button>
        <Button 
          onClick={handleSubmit} 
          className="flex-1"
          disabled={photos.length === 0}
        >
          Continue to Analysis
        </Button>
      </div>
    </motion.div>
  );
}
