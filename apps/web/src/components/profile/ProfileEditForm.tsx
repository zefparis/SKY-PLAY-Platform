'use client'

import { useState } from 'react'
import { Edit2, Save, X, Check } from 'lucide-react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { useAuthStore } from '@/lib/auth-store'
import { motion } from 'framer-motion'
import { useI18n } from '@/components/i18n/I18nProvider'
import CountrySelect from './CountrySelect'

interface ProfileEditFormProps {
  initialData: {
    username: string
    firstName?: string
    lastName?: string
    bio?: string
    discordTag?: string
    twitchUsername?: string
    country?: string
    city?: string
    phone?: string
    nationality?: string
  }
  onSave?: (data: any) => Promise<void>
}

export default function ProfileEditForm({ initialData, onSave }: ProfileEditFormProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState(initialData)
  const user = useAuthStore((s) => s.user)
  const loginWithDiscord = useAuthStore((s) => s.loginWithDiscord)
  
  const isDiscordConnected = !!user?.discordId
  const { t } = useI18n()

  const handleSave = async () => {
    setIsSaving(true)
    try {
      if (onSave) {
        await onSave(formData)
      }
      setIsEditing(false)
    } catch (error: any) {
      console.error('Erreur sauvegarde profil:', error)
      alert(error?.response?.data?.message || error?.message || 'Erreur lors de la sauvegarde')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setFormData(initialData)
    setIsEditing(false)
  }

  return (
    <Card variant="glass">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-black bg-gradient-to-r from-[#0097FC] to-[#003399] bg-clip-text text-transparent uppercase">{t('profile.personalInfo')}</h2>
        {!isEditing && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsEditing(true)}
            className="hover:scale-105 transition-transform"
          >
            <Edit2 className="w-4 h-4 mr-2" />
            {t('profile.edit')}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Username */}
        <div className="group">
          <label className="block text-xs font-bold uppercase tracking-wider dark:text-white/40 text-[#00165F]/40 mb-2">{t('profile.username')}</label>
          {isEditing ? (
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="w-full px-4 py-3 dark:bg-white/5 bg-[#00165F]/5 border dark:border-white/10 border-[#00165F]/10 rounded-xl dark:text-white text-[#00165F] focus:border-[#0097FC] focus:ring-2 focus:ring-[#0097FC]/20 focus:outline-none transition-all placeholder:dark:text-white/30 placeholder:text-[#00165F]/30"
            />
          ) : (
            <div className="px-4 py-3 dark:bg-white/5 bg-[#00165F]/5 rounded-xl border dark:border-white/10 border-[#00165F]/10">
              <p className="dark:text-white text-[#00165F] font-semibold">{formData.username}</p>
            </div>
          )}
        </div>

        {/* Prénom */}
        <div className="group">
          <label className="block text-xs font-bold uppercase tracking-wider dark:text-white/40 text-[#00165F]/40 mb-2">{t('profile.firstName')}</label>
          {isEditing ? (
            <input
              type="text"
              value={formData.firstName || ''}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              placeholder={t('profile.placeholder.firstName')}
              className="w-full px-4 py-3 dark:bg-white/5 bg-[#00165F]/5 border dark:border-white/10 border-[#00165F]/10 rounded-xl dark:text-white text-[#00165F] focus:border-[#0097FC] focus:ring-2 focus:ring-[#0097FC]/20 focus:outline-none transition-all placeholder:dark:text-white/30 placeholder:text-[#00165F]/30"
            />
          ) : (
            <div className="px-4 py-3 dark:bg-white/5 bg-[#00165F]/5 rounded-xl border dark:border-white/10 border-[#00165F]/10">
              <p className="dark:text-white text-[#00165F] font-semibold">{formData.firstName || <span className="dark:text-white/40 text-[#00165F]/40">{t('profile.notFilled')}</span>}</p>
            </div>
          )}
        </div>

        {/* Nom */}
        <div className="group">
          <label className="block text-xs font-bold uppercase tracking-wider dark:text-white/40 text-[#00165F]/40 mb-2">{t('profile.lastName')}</label>
          {isEditing ? (
            <input
              type="text"
              value={formData.lastName || ''}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              placeholder={t('profile.placeholder.lastName')}
              className="w-full px-4 py-3 dark:bg-white/5 bg-[#00165F]/5 border dark:border-white/10 border-[#00165F]/10 rounded-xl dark:text-white text-[#00165F] focus:border-[#0097FC] focus:ring-2 focus:ring-[#0097FC]/20 focus:outline-none transition-all placeholder:dark:text-white/30 placeholder:text-[#00165F]/30"
            />
          ) : (
            <div className="px-4 py-3 dark:bg-white/5 bg-[#00165F]/5 rounded-xl border dark:border-white/10 border-[#00165F]/10">
              <p className="dark:text-white text-[#00165F] font-semibold">{formData.lastName || <span className="dark:text-white/40 text-[#00165F]/40">{t('profile.notFilled')}</span>}</p>
            </div>
          )}
        </div>

        {/* Bio */}
        <div className="md:col-span-2 group">
          <label className="block text-xs font-bold uppercase tracking-wider dark:text-white/40 text-[#00165F]/40 mb-2">{t('profile.bio')}</label>
          {isEditing ? (
            <textarea
              value={formData.bio || ''}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              placeholder={t('profile.placeholder.bio')}
              rows={3}
              className="w-full px-4 py-3 dark:bg-white/5 bg-[#00165F]/5 border dark:border-white/10 border-[#00165F]/10 rounded-xl dark:text-white text-[#00165F] focus:border-[#0097FC] focus:ring-2 focus:ring-[#0097FC]/20 focus:outline-none resize-none transition-all placeholder:dark:text-white/30 placeholder:text-[#00165F]/30"
            />
          ) : (
            <div className="px-4 py-3 dark:bg-white/5 bg-[#00165F]/5 rounded-xl border dark:border-white/10 border-[#00165F]/10 min-h-[80px]">
              <p className="dark:text-white/80 text-[#00165F]/80">{formData.bio || <span className="dark:text-white/40 text-[#00165F]/40">{t('profile.noBio')}</span>}</p>
            </div>
          )}
        </div>

        {/* Discord */}
        <div className="group">
          <label className="block text-xs font-bold uppercase tracking-wider dark:text-white/40 text-[#00165F]/40 mb-2">{t('profile.discord')}</label>
          {isDiscordConnected ? (
            <div className="px-4 py-3 bg-gradient-to-r from-[#5865F2]/10 to-[#5865F2]/5 rounded-xl border border-[#5865F2]/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <svg width="20" height="20" viewBox="0 0 71 55" fill="none">
                    <path d="M60.1045 4.8978C55.5792 2.8214 50.7265 1.2916 45.6527 0.41542C45.5603 0.39851 45.468 0.440769 45.4204 0.525289C44.7963 1.6353 44.105 3.0834 43.6209 4.2216C38.1637 3.4046 32.7345 3.4046 27.3892 4.2216C26.905 3.0581 26.1886 1.6353 25.5617 0.525289C25.5141 0.443589 25.4218 0.40133 25.3294 0.41542C20.2584 1.2888 15.4057 2.8186 10.8776 4.8978C10.8384 4.9147 10.8048 4.9429 10.7825 4.9795C1.57795 18.7309 -0.943561 32.1443 0.293408 45.3914C0.299005 45.4562 0.335386 45.5182 0.385761 45.5576C6.45866 50.0174 12.3413 52.7249 18.1147 54.5195C18.2071 54.5477 18.305 54.5139 18.3638 54.4378C19.7295 52.5728 20.9469 50.6063 21.9907 48.5383C22.0523 48.4172 21.9935 48.2735 21.8676 48.2256C19.9366 47.4931 18.0979 46.6 16.3292 45.5858C16.1893 45.5041 16.1781 45.304 16.3068 45.2082C16.679 44.9293 17.0513 44.6391 17.4067 44.3461C17.471 44.2926 17.5606 44.2813 17.6362 44.3151C29.2558 49.6202 41.8354 49.6202 53.3179 44.3151C53.3935 44.2785 53.4831 44.2898 53.5502 44.3433C53.9057 44.6363 54.2779 44.9293 54.6529 45.2082C54.7816 45.304 54.7732 45.5041 54.6333 45.5858C52.8646 46.6197 51.0259 47.4931 49.0921 48.2228C48.9662 48.2707 48.9102 48.4172 48.9718 48.5383C50.038 50.6034 51.2554 52.5699 52.5959 54.435C52.6519 54.5139 52.7526 54.5477 52.845 54.5195C58.6464 52.7249 64.529 50.0174 70.6019 45.5576C70.6551 45.5182 70.6887 45.459 70.6943 45.3942C72.1747 30.0791 68.2147 16.7757 60.1968 4.9823C60.1772 4.9429 60.1437 4.9147 60.1045 4.8978ZM23.7259 37.3253C20.2276 37.3253 17.3451 34.1136 17.3451 30.1693C17.3451 26.225 20.1717 23.0133 23.7259 23.0133C27.308 23.0133 30.1626 26.2532 30.1066 30.1693C30.1066 34.1136 27.28 37.3253 23.7259 37.3253ZM47.3178 37.3253C43.8196 37.3253 40.9371 34.1136 40.9371 30.1693C40.9371 26.225 43.7636 23.0133 47.3178 23.0133C50.9 23.0133 53.7545 26.2532 53.6986 30.1693C53.6986 34.1136 50.9 37.3253 47.3178 37.3253Z" fill="#5865F2"/>
                  </svg>
                  <span className="text-[#5865F2] font-bold">{formData.discordTag}</span>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                  <Check className="w-3 h-3 text-emerald-500" />
                  <span className="text-xs font-bold text-emerald-500">{t('profile.discord.connected')}</span>
                </div>
              </div>
            </div>
          ) : (
            <button
              onClick={() => loginWithDiscord()}
              className="w-full px-4 py-3 bg-[#5865F2] hover:bg-[#4752C4] rounded-xl flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-[#5865F2]/30"
            >
              <svg width="20" height="20" viewBox="0 0 71 55" fill="none">
                <path d="M60.1045 4.8978C55.5792 2.8214 50.7265 1.2916 45.6527 0.41542C45.5603 0.39851 45.468 0.440769 45.4204 0.525289C44.7963 1.6353 44.105 3.0834 43.6209 4.2216C38.1637 3.4046 32.7345 3.4046 27.3892 4.2216C26.905 3.0581 26.1886 1.6353 25.5617 0.525289C25.5141 0.443589 25.4218 0.40133 25.3294 0.41542C20.2584 1.2888 15.4057 2.8186 10.8776 4.8978C10.8384 4.9147 10.8048 4.9429 10.7825 4.9795C1.57795 18.7309 -0.943561 32.1443 0.293408 45.3914C0.299005 45.4562 0.335386 45.5182 0.385761 45.5576C6.45866 50.0174 12.3413 52.7249 18.1147 54.5195C18.2071 54.5477 18.305 54.5139 18.3638 54.4378C19.7295 52.5728 20.9469 50.6063 21.9907 48.5383C22.0523 48.4172 21.9935 48.2735 21.8676 48.2256C19.9366 47.4931 18.0979 46.6 16.3292 45.5858C16.1893 45.5041 16.1781 45.304 16.3068 45.2082C16.679 44.9293 17.0513 44.6391 17.4067 44.3461C17.471 44.2926 17.5606 44.2813 17.6362 44.3151C29.2558 49.6202 41.8354 49.6202 53.3179 44.3151C53.3935 44.2785 53.4831 44.2898 53.5502 44.3433C53.9057 44.6363 54.2779 44.9293 54.6529 45.2082C54.7816 45.304 54.7732 45.5041 54.6333 45.5858C52.8646 46.6197 51.0259 47.4931 49.0921 48.2228C48.9662 48.2707 48.9102 48.4172 48.9718 48.5383C50.038 50.6034 51.2554 52.5699 52.5959 54.435C52.6519 54.5139 52.7526 54.5477 52.845 54.5195C58.6464 52.7249 64.529 50.0174 70.6019 45.5576C70.6551 45.5182 70.6887 45.459 70.6943 45.3942C72.1747 30.0791 68.2147 16.7757 60.1968 4.9823C60.1772 4.9429 60.1437 4.9147 60.1045 4.8978ZM23.7259 37.3253C20.2276 37.3253 17.3451 34.1136 17.3451 30.1693C17.3451 26.225 20.1717 23.0133 23.7259 23.0133C27.308 23.0133 30.1626 26.2532 30.1066 30.1693C30.1066 34.1136 27.28 37.3253 23.7259 37.3253ZM47.3178 37.3253C43.8196 37.3253 40.9371 34.1136 40.9371 30.1693C40.9371 26.225 43.7636 23.0133 47.3178 23.0133C50.9 23.0133 53.7545 26.2532 53.6986 30.1693C53.6986 34.1136 50.9 37.3253 47.3178 37.3253Z" fill="white"/>
              </svg>
              <span className="font-bold text-white">{t('profile.discord.connect')}</span>
            </button>
          )}
        </div>

        {/* Pays */}
        <div className="group">
          <label className="block text-xs font-bold uppercase tracking-wider dark:text-white/40 text-[#00165F]/40 mb-2">Pays</label>
          {isEditing ? (
            <CountrySelect
              value={formData.country || ''}
              onChange={(v) => setFormData({ ...formData, country: v })}
            />
          ) : (
            <div className="px-4 py-3 dark:bg-white/5 bg-[#00165F]/5 rounded-xl border dark:border-white/10 border-[#00165F]/10">
              <p className="dark:text-white text-[#00165F] font-semibold">{(formData as any).country || <span className="dark:text-white/40 text-[#00165F]/40">Non renseigné</span>}</p>
            </div>
          )}
        </div>

        {/* Nationalité */}
        <div className="group">
          <label className="block text-xs font-bold uppercase tracking-wider dark:text-white/40 text-[#00165F]/40 mb-2">Nationalité</label>
          {isEditing ? (
            <input
              type="text"
              value={(formData as any).nationality || ''}
              onChange={(e) => setFormData({ ...formData, nationality: e.target.value } as any)}
              placeholder="Ex: Camerounais(e)"
              className="w-full px-4 py-3 dark:bg-white/5 bg-[#00165F]/5 border dark:border-white/10 border-[#00165F]/10 rounded-xl dark:text-white text-[#00165F] focus:border-[#0097FC] focus:ring-2 focus:ring-[#0097FC]/20 focus:outline-none transition-all placeholder:dark:text-white/30 placeholder:text-[#00165F]/30"
            />
          ) : (
            <div className="px-4 py-3 dark:bg-white/5 bg-[#00165F]/5 rounded-xl border dark:border-white/10 border-[#00165F]/10">
              <p className="dark:text-white text-[#00165F] font-semibold">{(formData as any).nationality || <span className="dark:text-white/40 text-[#00165F]/40">Non renseigné</span>}</p>
            </div>
          )}
        </div>

        {/* Ville */}
        <div className="group">
          <label className="block text-xs font-bold uppercase tracking-wider dark:text-white/40 text-[#00165F]/40 mb-2">Ville</label>
          {isEditing ? (
            <input
              type="text"
              value={(formData as any).city || ''}
              onChange={(e) => setFormData({ ...formData, city: e.target.value } as any)}
              placeholder="Ex: Yaoundé, Douala…"
              className="w-full px-4 py-3 dark:bg-white/5 bg-[#00165F]/5 border dark:border-white/10 border-[#00165F]/10 rounded-xl dark:text-white text-[#00165F] focus:border-[#0097FC] focus:ring-2 focus:ring-[#0097FC]/20 focus:outline-none transition-all placeholder:dark:text-white/30 placeholder:text-[#00165F]/30"
            />
          ) : (
            <div className="px-4 py-3 dark:bg-white/5 bg-[#00165F]/5 rounded-xl border dark:border-white/10 border-[#00165F]/10">
              <p className="dark:text-white text-[#00165F] font-semibold">{(formData as any).city || <span className="dark:text-white/40 text-[#00165F]/40">Non renseigné</span>}</p>
            </div>
          )}
        </div>

        {/* Téléphone */}
        <div className="group">
          <label className="block text-xs font-bold uppercase tracking-wider dark:text-white/40 text-[#00165F]/40 mb-2">Téléphone</label>
          {isEditing ? (
            <input
              type="tel"
              value={(formData as any).phone || ''}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value } as any)}
              placeholder="+237 6XX XXX XXX"
              className="w-full px-4 py-3 dark:bg-white/5 bg-[#00165F]/5 border dark:border-white/10 border-[#00165F]/10 rounded-xl dark:text-white text-[#00165F] focus:border-[#0097FC] focus:ring-2 focus:ring-[#0097FC]/20 focus:outline-none transition-all placeholder:dark:text-white/30 placeholder:text-[#00165F]/30"
            />
          ) : (
            <div className="px-4 py-3 dark:bg-white/5 bg-[#00165F]/5 rounded-xl border dark:border-white/10 border-[#00165F]/10">
              <p className="dark:text-white text-[#00165F] font-semibold">{(formData as any).phone || <span className="dark:text-white/40 text-[#00165F]/40">Non renseigné</span>}</p>
            </div>
          )}
        </div>

        {/* Twitch */}
        <div className="group">
          <label className="block text-xs font-bold uppercase tracking-wider dark:text-white/40 text-[#00165F]/40 mb-2">{t('profile.twitch')}</label>
          {isEditing ? (
            <input
              type="text"
              value={formData.twitchUsername || ''}
              onChange={(e) => setFormData({ ...formData, twitchUsername: e.target.value })}
              placeholder={t('profile.placeholder.twitch')}
              className="w-full px-4 py-3 dark:bg-white/5 bg-[#00165F]/5 border dark:border-white/10 border-[#00165F]/10 rounded-xl dark:text-white text-[#00165F] focus:border-[#0097FC] focus:ring-2 focus:ring-[#0097FC]/20 focus:outline-none transition-all placeholder:dark:text-white/30 placeholder:text-[#00165F]/30"
            />
          ) : (
            <div className="px-4 py-3 dark:bg-white/5 bg-[#00165F]/5 rounded-xl border dark:border-white/10 border-[#00165F]/10">
              <p className="dark:text-white text-[#00165F] font-semibold">{formData.twitchUsername || <span className="dark:text-white/40 text-[#00165F]/40">{t('profile.notFilled')}</span>}</p>
            </div>
          )}
        </div>

        {/* Boutons de sauvegarde */}
        {isEditing && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:col-span-2 flex gap-3 pt-4 border-t dark:border-white/10 border-[#00165F]/10"
          >
            <Button
              variant="primary"
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 bg-gradient-to-r from-[#0097FC] to-[#003399] hover:shadow-lg hover:shadow-[#0097FC]/30 transition-all"
            >
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? t('profile.saving') : t('profile.save')}
            </Button>
            <Button
              variant="ghost"
              onClick={handleCancel}
              disabled={isSaving}
              className="hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/20 transition-all"
            >
              <X className="w-4 h-4 mr-2" />
              {t('profile.cancel')}
            </Button>
          </motion.div>
        )}
      </div>
    </Card>
  )
}
