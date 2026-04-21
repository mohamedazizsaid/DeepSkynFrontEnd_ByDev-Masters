import React, { useState, useRef, DragEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Image as ImageIcon, Smile, MapPin, Send, X, Loader2, Navigation, Video, FileVideo, AtSign } from 'lucide-react';
import { Button } from '../../components/button';
import { useAccessibilityStore } from '../../../stores/accessibility.store';
import { usersService } from '../../../lib/services/users.service';
import type { CommunityProfile } from '../../../lib/types';
import toast from 'react-hot-toast';

interface PostComposerProps {
  userAvatar?: string;
  userName?: string;
  onSubmit?: (content: string, media?: string) => void;
  isLoading?: boolean;
  placeholder?: string;
}

const FEELINGS = [
  { emoji: '🌟', label: 'Heureux(se)' },
  { emoji: '🌿', label: 'Détendu(e)' },
  { emoji: '💪', label: 'Motivé(e)' },
  { emoji: '✨', label: 'Inspiré(e)' },
  { emoji: '🤔', label: 'Curieux(se)' },
];

const LOCATIONS = [
  'Paris, France',
  'Cabinet Dermatologique',
  'Chez moi 🏡',
  'Institut de beauté',
];

export function PostComposer({
  userAvatar,
  userName = 'Utilisateur',
  onSubmit,
  isLoading = false,
  placeholder,
}: PostComposerProps) {
  const { theme, contrastMode, t } = useAccessibilityStore();
  const [isExpanded, setIsExpanded] = useState(false);
  const [content, setContent] = useState('');
  
  // Media states
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Tag states
  const [feeling, setFeeling] = useState<{ emoji: string; label: string } | null>(null);
  const [location, setLocation] = useState<string | null>(null);
  const [showFeelings, setShowFeelings] = useState(false);
  const [showLocations, setShowLocations] = useState(false);
  const [gettingLoc, setGettingLoc] = useState(false);

  // Mentions
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionResults, setMentionResults] = useState<CommunityProfile[]>([]);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionLoading, setMentionLoading] = useState(false);
  const [cursorPos, setCursorPos] = useState(0);
  const [mentionCoords, setMentionCoords] = useState({ top: 0, left: 0 });
  const [mentionsMap, setMentionsMap] = useState<Record<string, string>>({});
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mirrorRef = useRef<HTMLDivElement>(null);

  // --- Geolocation ---
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("La géolocalisation n'est pas supportée par votre navigateur");
      return;
    }

    setGettingLoc(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          // Reverse geocoding using OpenStreetMap (Nominatim) - Free and no key required for low volume
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10`, {
            headers: { 'User-Agent': 'DeepSkyn-App/1.0' }
          });
          const data = await response.json();
          
          const cityName = data.address?.city || data.address?.town || data.address?.village || data.address?.suburb || "Ma position";
          setLocation(cityName);
          setShowLocations(false);
          toast.success(`Position trouvée : ${cityName}`);
        } catch (err) {
          toast.error("Impossible de déterminer l'adresse précise");
          setLocation("Ma position actuelle");
          setShowLocations(false);
        } finally {
          setGettingLoc(false);
        }
      },
      () => {
        toast.error("Accès à la position refusé ou indisponible");
        setGettingLoc(false);
      },
      { timeout: 10000 }
    );
  };

  // Colors
  const isHcHigh = contrastMode === 'high';
  const isDark = theme === 'dark';

  const cardBg = isHcHigh ? 'bg-black border-2 border-yellow-400' : isDark ? 'bg-[#1e293b] border-[#334155]' : 'bg-white border-[#E5E7EB]';
  const textColor = isHcHigh ? 'text-cyan-400' : isDark ? 'text-gray-200' : 'text-[#111827]';
  const subText = isHcHigh ? 'text-yellow-400' : isDark ? 'text-gray-400' : 'text-[#6B7280]';
  const inputBg = isHcHigh ? 'bg-black border border-yellow-400' : isDark ? 'bg-[#0f172a] border border-[#334155]' : 'bg-[#F9FAFB] border border-[#E5E7EB]';

  // --- Drag & Drop Handlers ---
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const processFile = (file: File) => {
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    
    if (!isImage && !isVideo) {
      toast.error('📸 Veuillez sélectionner une image ou 🎬 une vidéo.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('❌ Le fichier est trop volumineux (max 10MB).');
      return;
    }
    
    // Convert to base64 rather than an ephemeral blob URL
    const reader = new FileReader();
    reader.onload = (e) => {
      setMediaFile(file);
      setMediaPreview(e.target?.result as string);
      
      // Toast de confirmation
      if (isVideo) {
        toast.success('✅ Vidéo ajoutée ! Cliquez sur envoyer pour publier.');
      } else {
        toast.success('✅ Image ajoutée ! Cliquez sur envoyer pour publier.');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) processFile(droppedFile);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) processFile(selectedFile);
  };

  const handleRemoveMedia = () => {
    setMediaFile(null);
    setMediaPreview('');
  };

  // --- Submit Handler ---
  const handleSubmit = async () => {
    if (!content.trim() && !mediaFile) {
      toast.error('Veuillez écrire quelque chose ou ajouter un média');
      return;
    }

    try {
      if (onSubmit) {
        // Construct final text with feeling/location
        let finalContent = content;
        
        // Transform plain @Name to @[Name](ID) using the mentionsMap
        Object.entries(mentionsMap).forEach(([name, id]) => {
          // Replace @Name with @[Name](ID), being careful with spaces/boundaries
          // This regex finds @Name but only if it's not already transformed
          const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const regex = new RegExp(`@${escapedName}\\b`, 'g');
          finalContent = finalContent.replace(regex, `@[${name}](${id})`);
        });
        
        if (feeling || location) {
          finalContent += '\n\n— ';
          if (feeling) finalContent += `Se sent ${feeling.emoji} ${feeling.label} `;
          if (feeling && location) finalContent += 'à ';
          if (location) finalContent += `📍 ${location}`;
        }
        
        // Simulating upload of the media URL
        const simulatedUrl = mediaPreview || undefined;
        await onSubmit(finalContent.trim(), simulatedUrl);
      }
      
      // Reset
      setContent('');
      handleRemoveMedia();
      setFeeling(null);
      setLocation(null);
      setIsExpanded(false);
      setShowFeelings(false);
      setShowLocations(false);
      setShowMentions(false);
    } catch (error) {
      toast.error('Erreur lors de la publication');
      console.error(error);
    }
  };

  // --- Mentions Logic ---
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    const pos = e.target.selectionStart;
    setContent(val);
    setCursorPos(pos);

    // Look back from cursor to find @
    const textBeforeCursor = val.substring(0, pos);
    const words = textBeforeCursor.split(/\s/);
    const lastWord = words[words.length - 1];

    if (lastWord.startsWith('@')) {
      const query = lastWord.slice(1);
      setMentionQuery(query);
      setShowMentions(true);
      handleSearchMentions(query);
      
      // Calculate coordinates
      if (textareaRef.current && mirrorRef.current) {
        const textBeforeCaret = val.substring(0, pos);
        const lastAtIndex = textBeforeCaret.lastIndexOf('@');
        const textToAt = textBeforeCaret.substring(0, lastAtIndex);
        
        // Update mirror and measure
        setMirrorContent(textToAt);
        setTimeout(() => {
          if (mirrorRef.current) {
            const span = mirrorRef.current.querySelector('span');
            if (span) {
              setMentionCoords({
                top: span.offsetTop,
                left: Math.min(span.offsetLeft, (textareaRef.current?.clientWidth || 300) - 280)
              });
            }
          }
        }, 0);
      }
    } else {
      setShowMentions(false);
    }
  };

  const [mirrorContent, setMirrorContent] = useState('');

  const handleSearchMentions = async (q: string) => {
    setMentionLoading(true);
    try {
      const result = await usersService.searchCommunityProfiles(q, 1, 5);
      setMentionResults(result.data || []);
    } catch (error) {
      console.error('Mention search error:', error);
    } finally {
      setMentionLoading(false);
    }
  };

  const insertMention = (user: CommunityProfile) => {
    const textBeforeCursor = content.substring(0, cursorPos);
    const textAfterCursor = content.substring(cursorPos);
    
    const words = textBeforeCursor.split(/\s/);
    words.pop(); // remove the @query
    
    // Insert just the visible name in the textarea
    const visibleName = user.name || 'Utilisateur';
    const mentionTag = `@${visibleName} `;
    
    // Store the ID mapping for later processing on submit
    setMentionsMap(prev => ({ ...prev, [visibleName]: user.id }));
    
    const prefix = words.join(' ');
    const newContent = prefix + (prefix.length > 0 ? ' ' : '') + mentionTag + textAfterCursor;
    
    setContent(newContent);
    setShowMentions(false);
    
    // Focus back and set cursor
    if (textareaRef.current) {
      textareaRef.current.focus();
      const newPos = prefix.length + (prefix.length > 0 ? 1 : 0) + mentionTag.length;
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = newPos;
          textareaRef.current.selectionEnd = newPos;
        }
      }, 0);
    }
  };

  // Compose dynamic placeholder
  const firstName = userName.split(' ')[0] || 'Utilisateur';
  let dynamicStatus = '';
  if (feeling) dynamicStatus += `se sent ${feeling.emoji} ${feeling.label}`;
  if (location) dynamicStatus += (feeling ? ' à ' : 'est à ') + `📍 ${location}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl shadow-sm overflow-hidden mb-6 transition-all duration-300 ${cardBg} ${isDragging ? 'ring-2 ring-[#0EA5E9]' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="p-5 sm:p-6">
        {/* User Info & Header input */}
        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0 shadow-sm ${isHcHigh ? 'border-2 border-yellow-400 bg-black text-cyan-400' : 'bg-gradient-to-br from-[#0EA5E9] to-[#06B6D4] text-white'}`}>
            {userAvatar ? (
              <img src={userAvatar} alt={userName} className="w-full h-full rounded-full object-cover" />
            ) : (
              userName.charAt(0).toUpperCase()
            )}
          </div>

          <div className="flex-1">
            {!isExpanded && (
               <div 
                 onClick={() => setIsExpanded(true)}
                 className={`w-full px-5 py-3.5 rounded-full text-sm cursor-pointer transition-all hover:shadow-md truncate ${inputBg} ${subText}`}
               >
                 {dynamicStatus ? (
                   <span className={isHcHigh ? 'text-yellow-400' : 'text-[#0EA5E9] font-medium'}>
                     {firstName} {dynamicStatus}...
                   </span>
                 ) : (
                   `Quoi de neuf, ${firstName} ?`
                 )}
               </div>
            )}

            {isExpanded && (
              <div className="mb-2">
                <span className={`font-semibold ${textColor}`}>{userName}</span>
                {dynamicStatus && (
                  <span className={`text-sm ml-1 ${subText}`}>
                    {dynamicStatus}
                    <button onClick={() => { setFeeling(null); setLocation(null); }} className="ml-2 hover:text-red-500 transition-colors">
                      <X className="w-3 h-3 inline pb-0.5" />
                    </button>
                  </span>
                )}
              </div>
            )}

            {/* Expanded Content Area */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <div className="relative">
                    {/* Mirror for caret calculation */}
                    <div 
                      ref={mirrorRef}
                      className="absolute inset-0 p-4 invisible whitespace-pre-wrap break-words pointer-events-none text-sm leading-relaxed"
                      style={{ 
                        fontFamily: 'inherit',
                        fontSize: 'inherit',
                        lineHeight: 'inherit',
                      }}
                    >
                      {mirrorContent}
                      <span>@</span>
                    </div>

                    <textarea
                      ref={textareaRef}
                      autoFocus
                      value={content}
                      onChange={handleContentChange}
                      onSelect={(e: any) => setCursorPos(e.target.selectionStart)}
                      placeholder={placeholder || t?.('community.postPlaceholder') || `Exprimez-vous, demandez conseil...`}
                      className={`w-full p-4 rounded-xl resize-none min-h-[140px] focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]/20 transition-all ${inputBg} ${textColor} placeholder:${subText}`}
                    />

                    {/* Mentions Dropdown - Fixed to cursor position */}
                    <AnimatePresence>
                      {showMentions && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          style={{ 
                            top: mentionCoords.top + 25, 
                            left: mentionCoords.left 
                          }}
                          className={`absolute w-72 rounded-2xl border shadow-2xl z-[60] overflow-hidden backdrop-blur-xl ${isHcHigh ? 'bg-black border-yellow-400' : isDark ? 'bg-[#1e293b]/95 border-white/10' : 'bg-white/95 border-gray-100'}`}
                        >
                          <div className={`p-3 border-b flex items-center gap-2 ${isHcHigh ? 'border-yellow-400/30' : isDark ? 'border-white/5 bg-white/5' : 'border-gray-50 bg-gray-50/50'}`}>
                            <AtSign className="w-4 h-4 text-[#0EA5E9]" />
                            <span className={`text-[10px] font-black uppercase tracking-widest ${subText}`}>Mentionner quelqu'un</span>
                          </div>
                          
                          <div className="p-1.5 max-h-64 overflow-y-auto">
                            {mentionLoading && mentionResults.length === 0 ? (
                               <div className="p-4 flex items-center justify-center">
                                 <Loader2 className="w-5 h-5 animate-spin text-[#0EA5E9]" />
                               </div>
                            ) : mentionResults.length > 0 ? (
                              mentionResults.map((user) => (
                                <button
                                  key={user.id}
                                  onClick={() => insertMention(user)}
                                  className={`w-full p-2.5 rounded-xl flex items-center gap-3 transition-all hover:scale-[1.02] active:scale-[0.98] ${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-50'}`}
                                >
                                  <div className={`w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-xs ${isHcHigh ? 'bg-black border border-yellow-400 text-cyan-400' : 'bg-gradient-to-br from-[#0EA5E9] to-[#06B6D4] text-white'}`}>
                                    {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover rounded-full" /> : (user.name || 'U').charAt(0).toUpperCase()}
                                  </div>
                                  <div className="flex-1 text-left min-w-0">
                                    <p className={`text-sm font-bold truncate ${textColor}`}>{user.name}</p>
                                    <p className={`text-[10px] font-medium truncate ${subText}`}>@{user.name?.replace(/\s+/g, '').toLowerCase()}</p>
                                  </div>
                                </button>
                              ))
                            ) : (
                               <p className={`p-4 text-center text-xs italic ${subText}`}>Aucun utilisateur trouvé</p>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Media Preview or Drag/Drop prompt */}
                  {mediaPreview ? (
                    <div className="relative mt-4 rounded-xl overflow-hidden group border border-gray-200 dark:border-[#334155]">
                      {mediaFile?.type.startsWith('video/') ? (
                         <div className="relative">
                           <video 
                             src={mediaPreview} 
                             controls 
                             className="w-full max-h-[400px] object-cover bg-black"
                             poster={mediaPreview}
                           />
                           {/* Badge Vidéo */}
                           <div className="absolute top-3 left-3 flex items-center gap-1.5 px-3 py-1.5 bg-black/70 backdrop-blur-sm border border-white/20 rounded-lg">
                             <Video className="w-4 h-4 text-[#0EA5E9]" />
                             <span className={`text-xs font-bold ${isHcHigh ? 'text-yellow-300' : 'text-white'}`}>VIDÉO</span>
                           </div>
                         </div>
                      ) : (
                         <div className="relative">
                           <img src={mediaPreview} alt="Preview" className="w-full max-h-[400px] object-cover bg-gray-100 dark:bg-[#0f172a]" />
                           {/* Badge Image */}
                           <div className="absolute top-3 left-3 flex items-center gap-1.5 px-3 py-1.5 bg-white/90 dark:bg-black/70 backdrop-blur-sm border border-gray-200 dark:border-white/20 rounded-lg">
                             <ImageIcon className="w-4 h-4 text-[#0EA5E9]" />
                             <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-black'}`}>IMAGE</span>
                           </div>
                         </div>
                      )}
                      
                      <button
                        onClick={handleRemoveMedia}
                        className="absolute top-3 right-3 p-2 bg-red-500/80 hover:bg-red-600 text-white rounded-full opacity-100 hover:opacity-100 transition-all hover:scale-110 shadow-lg"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ) : (
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className={`mt-4 p-6 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors ${
                        isDragging 
                          ? 'border-[#0EA5E9] bg-[#0EA5E9]/10' 
                          : isDark ? 'border-[#334155] hover:border-[#475569] bg-[#0f172a]' : 'border-gray-200 hover:border-[#0EA5E9]/50 bg-gray-50'
                      }`}
                    >
                       <div className={`p-3 rounded-full ${isDark ? 'bg-[#1e293b]' : 'bg-white'} shadow-sm flex items-center gap-2`}>
                          <ImageIcon className={`w-6 h-6 ${isHcHigh ? 'text-yellow-400' : 'text-[#0EA5E9]'}`} />
                          <FileVideo className={`w-5 h-5 ${isHcHigh ? 'text-yellow-300' : 'text-[#06B6D4]'}`} />
                       </div>
                       <p className={`text-sm font-medium ${textColor}`}>Glissez ou sélectionnez une photo / vidéo</p>
                       <p className={`text-xs ${subText}`}>📸 Images • 🎬 Vidéos (Max 10 MB)</p>
                    </div>
                  )}

                  <input ref={fileInputRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleFileSelect} />

                  {/* Dynamic Menus (Feelings & Locations) */}
                  <AnimatePresence>
                    {showFeelings && (
                      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className={`mt-3 p-2 flex flex-wrap gap-2 border-t pt-3 ${isHcHigh ? 'border-yellow-400/30' : isDark ? 'border-[#334155]' : 'border-[#E5E7EB]'}`}>
                        {FEELINGS.map(f => (
                           <button 
                             key={f.label} 
                             onClick={() => { setFeeling(f); setShowFeelings(false); }}
                             className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${feeling?.label === f.label ? 'bg-[#0EA5E9] text-white' : isDark ? 'bg-[#334155] text-gray-200 hover:bg-[#475569]' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                           >
                             {f.emoji} {f.label}
                           </button>
                        ))}
                      </motion.div>
                    )}
                    {showLocations && (
                      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className={`mt-3 p-2 flex flex-wrap gap-2 border-t pt-3 ${isHcHigh ? 'border-yellow-400/30' : isDark ? 'border-[#334155]' : 'border-[#E5E7EB]'}`}>
                        <button 
                          disabled={gettingLoc}
                          onClick={handleGetCurrentLocation}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${gettingLoc ? 'opacity-50 cursor-wait' : 'bg-[#0EA5E9] text-white hover:bg-[#0284C7]'}`}
                        >
                          {gettingLoc ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Navigation className="w-3.5 h-3.5" />}
                          Ma position actuelle
                        </button>
                        {LOCATIONS.map(l => (
                           <button 
                             key={l} 
                             onClick={() => { setLocation(l); setShowLocations(false); }}
                             className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${location === l ? 'bg-[#0EA5E9] text-white' : isDark ? 'bg-[#334155] text-gray-200 hover:bg-[#475569]' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                           >
                             📍 {l}
                           </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Action Buttons */}
                  <div className={`flex flex-col sm:flex-row sm:items-center justify-between mt-4 pt-4 border-t gap-4 ${isHcHigh ? 'border-yellow-400/50' : isDark ? 'border-[#334155]' : 'border-[#E5E7EB]'}`}>
                    <div className="flex gap-1">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => fileInputRef.current?.click()}
                        className={`p-2 rounded-xl transition-colors flex items-center justify-center ${isDark ? 'text-gray-400 hover:text-[#0EA5E9] hover:bg-[#0EA5E9]/10' : 'text-[#6B7280] hover:text-[#0EA5E9] hover:bg-[#F0F9FF]'}`}
                        title="Ajouter une photo"
                      >
                        <ImageIcon className="w-5 h-5" />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => { setShowFeelings(!showFeelings); setShowLocations(false); }}
                        className={`p-2 rounded-xl transition-colors flex items-center justify-center gap-2 ${feeling ? 'text-[#0EA5E9] bg-[#0EA5E9]/10' : isDark ? 'text-gray-400 hover:text-[#0EA5E9] hover:bg-[#0EA5E9]/10' : 'text-[#6B7280] hover:text-[#0EA5E9] hover:bg-[#F0F9FF]'}`}
                        title="Humeur"
                      >
                        <Smile className="w-5 h-5" />
                        <span className="text-xs font-semibold hidden md:block">Humeur</span>
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => { setShowLocations(!showLocations); setShowFeelings(false); }}
                        className={`p-2 rounded-xl transition-colors flex items-center justify-center gap-2 ${location ? 'text-[#0EA5E9] bg-[#0EA5E9]/10' : isDark ? 'text-gray-400 hover:text-[#0EA5E9] hover:bg-[#0EA5E9]/10' : 'text-[#6B7280] hover:text-[#0EA5E9] hover:bg-[#F0F9FF]'}`}
                        title="Localisation"
                      >
                        <MapPin className="w-5 h-5" />
                        <span className="text-xs font-semibold hidden md:block">Lieu</span>
                      </motion.button>
                    </div>

                    <div className="flex gap-2 w-full sm:w-auto">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsExpanded(false);
                          setContent('');
                          handleRemoveMedia();
                          setFeeling(null);
                          setLocation(null);
                          setShowFeelings(false);
                          setShowLocations(false);
                        }}
                        className="flex-1 sm:flex-none"
                      >
                        Annuler
                      </Button>
                      <Button
                        onClick={handleSubmit}
                        disabled={(!content.trim() && !mediaFile) || isLoading}
                        loading={isLoading}
                        className={`flex-1 sm:flex-none flex items-center gap-2 ${isHcHigh ? 'bg-yellow-400 text-black hover:bg-yellow-500' : 'bg-[#0EA5E9] hover:bg-[#0284C7]'}`}
                      >
                        <Send className="w-4 h-4" />
                        Publier
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
