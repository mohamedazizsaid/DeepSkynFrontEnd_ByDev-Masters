import React from 'react';
import { motion } from 'motion/react';
import { MapPin, Link2, Calendar, Users } from 'lucide-react';

interface Friend {
  id: string;
  name: string;
  avatar?: string;
}

interface SidebarData {
  bio?: string;
  location?: string;
  website?: string;
  joinDate: string;
  recentPhotos?: string[];
  recentFriends?: Friend[];
}

interface ProfileSidebarProps {
  data: SidebarData;
}

export function ProfileSidebar({ data }: ProfileSidebarProps) {
  const formatJoinDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
    });
  };

  return (
    <div className="space-y-6 h-fit sticky top-20">
      {/* About Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden p-6"
      >
        <h3 className="text-lg font-bold text-[#111827] mb-4">À propos</h3>

        <div className="space-y-4">
          {data.bio && (
            <div>
              <p className="text-sm text-[#6B7280]">{data.bio}</p>
            </div>
          )}

          {data.location && (
            <div className="flex items-center gap-3 text-sm text-[#6B7280]">
              <MapPin className="w-5 h-5 text-[#0EA5E9] flex-shrink-0" />
              <span>{data.location}</span>
            </div>
          )}

          {data.website && (
            <div className="flex items-center gap-3 text-sm text-[#0EA5E9] hover:underline cursor-pointer">
              <Link2 className="w-5 h-5 flex-shrink-0" />
              <a href={data.website} target="_blank" rel="noopener noreferrer">
                {data.website}
              </a>
            </div>
          )}

          <div className="flex items-center gap-3 text-sm text-[#6B7280]">
            <Calendar className="w-5 h-5 text-[#0EA5E9] flex-shrink-0" />
            <span>Inscrit en {formatJoinDate(data.joinDate)}</span>
          </div>
        </div>
      </motion.div>

      {/* Photos Card */}
      {data.recentPhotos && data.recentPhotos.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden p-6"
        >
          <h3 className="text-lg font-bold text-[#111827] mb-4">Photos</h3>

          <div className="grid grid-cols-3 gap-2">
            {data.recentPhotos.slice(0, 9).map((photo, idx) => (
              <motion.div
                key={idx}
                whileHover={{ scale: 1.05 }}
                className="aspect-square rounded-lg overflow-hidden bg-[#F3F4F6] cursor-pointer group"
              >
                <img
                  src={photo}
                  alt={`Photo ${idx + 1}`}
                  className="w-full h-full object-cover group-hover:brightness-75 transition-all"
                />
              </motion.div>
            ))}
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            className="w-full mt-4 py-2 text-sm font-semibold text-[#0EA5E9] hover:bg-[#F0F9FF] rounded-lg transition-colors"
          >
            Voir toutes les photos
          </motion.button>
        </motion.div>
      )}

      {/* Friends Card */}
      {data.recentFriends && data.recentFriends.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-[#0EA5E9]" />
            <h3 className="text-lg font-bold text-[#111827]">
              Amis ({data.recentFriends.length})
            </h3>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {data.recentFriends.slice(0, 9).map((friend) => (
              <motion.div
                key={friend.id}
                whileHover={{ scale: 1.05 }}
                className="flex flex-col items-center cursor-pointer group"
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#0EA5E9] to-[#06B6D4] flex items-center justify-center text-white font-bold text-sm mb-2 overflow-hidden group-hover:shadow-lg transition-shadow">
                  {friend.avatar ? (
                    <img
                      src={friend.avatar}
                      alt={friend.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    friend.name.charAt(0).toUpperCase()
                  )}
                </div>
                <span className="text-xs font-medium text-[#111827] text-center line-clamp-2 group-hover:text-[#0EA5E9] transition-colors">
                  {friend.name}
                </span>
              </motion.div>
            ))}
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            className="w-full mt-4 py-2 text-sm font-semibold text-[#0EA5E9] hover:bg-[#F0F9FF] rounded-lg transition-colors"
          >
            Voir tous les amis
          </motion.button>
        </motion.div>
      )}
    </div>
  );
}
