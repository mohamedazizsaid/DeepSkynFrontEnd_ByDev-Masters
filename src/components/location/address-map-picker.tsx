import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, Search, Loader, X } from 'lucide-react';
import toast from 'react-hot-toast';

// Extend Window for Leaflet
declare global {
  interface Window {
    L: any;
  }
}

interface AddressData {
  address: string;
  city: string;
  zipCode: string;
  country: string;
  latitude: number;
  longitude: number;
}

interface AddressMapPickerProps {
  initialAddress?: AddressData;
  onAddressSelect: (address: AddressData) => void;
  isLoading?: boolean;
}

export function AddressMapPicker({
  initialAddress,
  onAddressSelect,
  isLoading = false,
}: AddressMapPickerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<AddressData | null>(
    initialAddress || null
  );
  const [pendingAddress, setPendingAddress] = useState<AddressData | null>(null);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize map with OpenStreetMap/Leaflet
  useEffect(() => {
    if (selectedAddress && mapContainerRef.current) {
      // Load Leaflet CSS dynamically
      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link');
        link.id = 'leaflet-css';
        link.rel = 'stylesheet';
        link.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css';
        document.head.appendChild(link);
      }

      // Load Leaflet script dynamically
      if (!window.L) {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js';
        script.onload = () => {
          initializeMap();
        };
        document.body.appendChild(script);
      } else {
        initializeMap();
      }
    }
  }, [selectedAddress]);

  const initializeMap = () => {
    if (!mapContainerRef.current || !selectedAddress) return;

    // Destroy existing map
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
    }

    // Create new map
    const map = (window.L as any).map(mapContainerRef.current).setView(
      [selectedAddress.latitude, selectedAddress.longitude],
      13
    );

    (window.L as any).tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    // Add marker
    (window.L as any)
      .marker([selectedAddress.latitude, selectedAddress.longitude])
      .addTo(map)
      .bindPopup(`<strong>${selectedAddress.address}</strong>`);

    mapInstanceRef.current = map;
  };

  // Search for addresses using Nominatim (free, no API key needed)
  const handleSearch = async (query: string) => {
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`
      );
      const data = await response.json();

      const formattedSuggestions = data.map((item: any) => ({
        address: item.address || item.name,
        display_name: item.display_name,
        latitude: parseFloat(item.lat),
        longitude: parseFloat(item.lon),
      }));

      setSuggestions(formattedSuggestions);
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Erreur lors de la recherche');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchInput = (value: string) => {
    setSearchQuery(value);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      handleSearch(value);
    }, 500);
  };

  // Parse address from OSM data
  const parseAddress = async (item: any) => {
    try {
      // Use reverse geocoding to get detailed address
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${item.latitude}&lon=${item.longitude}`
      );
      const details = await response.json();
      const address = details.address || {};

      const fullAddress: AddressData = {
        address: item.display_name,
        city: address.city || address.town || address.village || '',
        zipCode: address.postcode || '',
        country: address.country || '',
        latitude: item.latitude,
        longitude: item.longitude,
      };

      setSelectedAddress(fullAddress);
      setSuggestions([]);
      setSearchQuery('');
      onAddressSelect(fullAddress);
      toast.success('Adresse sélectionnée');
    } catch (error) {
      console.error('Parse error:', error);
      toast.error('Erreur lors du traitement de l\'adresse');
    }
  };

  // Get user's current location
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Géolocalisation non disponible sur votre navigateur');
      return;
    }

    setIsSearching(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        setGpsAccuracy(accuracy);
        
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await response.json();
          const address = data.address || {};

          const pendingAddr: AddressData = {
            address: data.display_name,
            city: address.city || address.town || address.village || '',
            zipCode: address.postcode || '',
            country: address.country || '',
            latitude,
            longitude,
          };

          // Show pending confirmation instead of auto-confirming
          setPendingAddress(pendingAddr);
          toast.success('📍 Vérifiez l\'adresse détectée');
        } catch (error) {
          console.error('Geolocation error:', error);
          toast.error('Erreur lors de la récupération de la localisation');
          setIsSearching(false);
        }
      },
      (error: GeolocationPositionError) => {
        setIsSearching(false);
        
        if (error.code === 1) {
          // PERMISSION_DENIED
          toast.error('Permission refusée. Veuillez autoriser la géolocalisation ou rechercher manuellement.');
        } else if (error.code === 2) {
          // POSITION_UNAVAILABLE
          toast.error('Position non disponible. Activez votre GPS ou utilisez la recherche manuelle.');
        } else if (error.code === 3) {
          // TIMEOUT
          toast.error('Délai d\'attente dépassé. Réessayez ou recherchez manuellement.');
        } else {
          toast.error('Erreur de géolocalisation. Veuillez rechercher votre adresse manuellement.');
        }
        console.error('Geolocation error:', error);
      }
    );
  };

  const confirmPendingAddress = () => {
    if (pendingAddress) {
      setSelectedAddress(pendingAddress);
      onAddressSelect(pendingAddress);
      setPendingAddress(null);
      setGpsAccuracy(null);
      setIsSearching(false);
      toast.success('✅ Localisation confirmée et enregistrée');
    }
  };

  const rejectPendingAddress = () => {
    setPendingAddress(null);
    setGpsAccuracy(null);
    setIsSearching(false);
    toast('Recherchez votre adresse manuellement', { icon: '🔍' });
  };

  const clearAddress = () => {
    setSelectedAddress(null);
    setSearchQuery('');
    setSuggestions([]);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-6 space-y-6"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0EA5E9] to-[#06B6D4] flex items-center justify-center shadow-lg shadow-[#0EA5E9]/20">
          <MapPin className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-[#111827]">Votre localisation</h3>
          <p className="text-xs text-[#6B7280]">Modifiez votre adresse</p>
        </div>
      </div>

      {/* Search Box */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9CA3AF]" />
          <input
            type="text"
            placeholder="Rechercher une adresse..."
            value={searchQuery}
            onChange={(e) => handleSearchInput(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] text-[#111827] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] focus:border-transparent transition-all"
          />
          {isSearching && (
            <Loader className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#0EA5E9] animate-spin" />
          )}
        </div>

        {/* Suggestions */}
        <AnimatePresence>
          {suggestions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full left-0 right-0 mt-2 bg-white border border-[#E5E7EB] rounded-xl shadow-lg z-50 max-h-64 overflow-y-auto"
            >
              {suggestions.map((suggestion, idx) => (
                <motion.button
                  key={idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => parseAddress(suggestion)}
                  className="w-full text-left px-4 py-3 hover:bg-[#F3F4F6] transition-colors border-b border-[#F3F4F6] last:border-b-0"
                >
                  <p className="text-sm font-medium text-[#111827]">{suggestion.address}</p>
                  <p className="text-xs text-[#6B7280] line-clamp-1">{suggestion.display_name}</p>
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Current Location Button */}
      <button
        onClick={handleGetCurrentLocation}
        disabled={isSearching || pendingAddress !== null}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#F3F4F6] hover:bg-[#E5E7EB] text-[#111827] font-medium transition-all disabled:opacity-50"
      >
        {isSearching ? (
          <>
            <Loader className="w-4 h-4 animate-spin" />
            <span>Localisation en cours...</span>
          </>
        ) : (
          <>
            <MapPin className="w-4 h-4" />
            <span>Utiliser ma localisation actuelle</span>
          </>
        )}
      </button>

      {/* Pending Address Confirmation Dialog */}
      <AnimatePresence>
        {pendingAddress && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="space-y-4 p-4 rounded-xl bg-[#FEF3C7] border-2 border-[#F59E0B]"
          >
            <div className="flex items-start gap-3">
              <div className="text-2xl">🔍</div>
              <div className="flex-1">
                <h4 className="font-bold text-[#92400E]">Vérifier votre localisation</h4>
                <p className="text-sm text-[#B45309] mt-1">
                  Confirmez que l'adresse détectée est correcte avant de l'enregistrer.
                </p>
              </div>
            </div>

            <div className="space-y-3 bg-white rounded-lg p-3">
              <div>
                <p className="text-xs font-semibold text-[#6B7280] uppercase">Adresse Détectée</p>
                <p className="text-sm font-medium text-[#111827] mt-1">{pendingAddress.address}</p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-xs text-[#6B7280]">Ville</p>
                  <p className="text-sm font-medium text-[#111827]">{pendingAddress.city || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-[#6B7280]">Code postal</p>
                  <p className="text-sm font-medium text-[#111827]">{pendingAddress.zipCode || '—'}</p>
                </div>
              </div>

              <div>
                <p className="text-xs text-[#6B7280]">Coordonnées GPS</p>
                <p className="text-xs font-mono text-[#111827] mt-1">
                  {pendingAddress.latitude.toFixed(6)}, {pendingAddress.longitude.toFixed(6)}
                </p>
              </div>

              {gpsAccuracy && (
                <div className="p-2 rounded-lg bg-[#F0F9FF] border border-[#0EA5E9]/20">
                  <p className="text-xs text-[#0369A1]">
                    📡 Précision GPS: <strong>±{Math.round(gpsAccuracy)}m</strong>
                  </p>
                  {gpsAccuracy > 100 && (
                    <p className="text-xs text-[#EA580C] mt-1">
                      ⚠️ Faible précision. Corrigez manuellement si inexact.
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={rejectPendingAddress}
                className="flex-1 py-2 px-3 rounded-lg bg-white border border-[#F59E0B] text-[#92400E] font-medium hover:bg-[#FEF3C7] transition-colors text-sm"
              >
                ✏️ Corriger
              </button>
              <button
                onClick={confirmPendingAddress}
                className="flex-1 py-2 px-3 rounded-lg bg-[#F59E0B] text-white font-medium hover:bg-[#D97706] transition-colors text-sm"
              >
                ✓ Confirmer
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Selected Address Display */}
      <AnimatePresence>
        {selectedAddress && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="space-y-4"
          >
            {/* Map Preview - OpenStreetMap */}
            <div className="relative h-64 rounded-xl overflow-hidden border border-[#E5E7EB] shadow-md bg-[#E5E7EB]">
              <div
                ref={mapContainerRef}
                className="w-full h-full"
                style={{
                  background: 'linear-gradient(135deg, #F3F4F6 0%, #E5E7EB 100%)',
                }}
              >
                {selectedAddress ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader className="w-8 h-8 text-[#0EA5E9] animate-spin" />
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <MapPin className="w-12 h-12 text-[#9CA3AF] mx-auto mb-2 opacity-50" />
                      <p className="text-[#6B7280] text-sm">Sélectionnez une adresse</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Address Details */}
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 p-4 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB]">
                <p className="text-xs text-[#6B7280] uppercase tracking-wider font-semibold">Adresse</p>
                <p className="text-sm font-medium text-[#111827] mt-1 line-clamp-2">
                  {selectedAddress.address}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB]">
                <p className="text-xs text-[#6B7280] uppercase tracking-wider font-semibold">Ville</p>
                <p className="text-sm font-medium text-[#111827] mt-1">{selectedAddress.city}</p>
              </div>

              <div className="p-4 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB]">
                <p className="text-xs text-[#6B7280] uppercase tracking-wider font-semibold">Code postal</p>
                <p className="text-sm font-medium text-[#111827] mt-1">{selectedAddress.zipCode}</p>
              </div>

              <div className="col-span-2 p-4 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB]">
                <p className="text-xs text-[#6B7280] uppercase tracking-wider font-semibold">Pays</p>
                <p className="text-sm font-medium text-[#111827] mt-1">{selectedAddress.country}</p>
              </div>

              <div className="col-span-2 p-3 rounded-xl bg-[#F0F9FF] border border-[#0EA5E9]/20 text-center">
                <p className="text-xs text-[#0369A1] font-medium">
                  📍 {selectedAddress.latitude.toFixed(4)}, {selectedAddress.longitude.toFixed(4)}
                </p>
              </div>
            </div>

            {/* Clear Button */}
            <button
              onClick={clearAddress}
              className="w-full py-2 text-sm text-[#6B7280] hover:text-[#111827] transition-colors flex items-center justify-center gap-2"
            >
              <X className="w-4 h-4" />
              <span>Effacer la sélection</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Info Box */}
      {!selectedAddress && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-4 rounded-xl bg-[#F0F9FF] border border-[#0EA5E9]/20"
        >
          <p className="text-sm text-[#0369A1]">
            💡 Recherchez votre adresse ou utilisez votre localisation actuelle
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}
