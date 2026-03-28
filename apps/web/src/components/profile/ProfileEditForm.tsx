'use client'

import { useState } from 'react'
import { Edit2, Save, X } from 'lucide-react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'

interface ProfileEditFormProps {
  initialData: {
    username: string
    firstName?: string
    lastName?: string
    bio?: string
    discordTag?: string
    twitchUsername?: string
  }
  onSave?: (data: any) => Promise<void>
}

export default function ProfileEditForm({ initialData, onSave }: ProfileEditFormProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState(initialData)

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
        <h2 className="title-tech text-primary dark:text-white text-xl font-extrabold">Informations personnelles</h2>
        {!isEditing && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsEditing(true)}
          >
            <Edit2 className="w-4 h-4 mr-2" />
            Modifier
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {/* Username */}
        <div>
          <label className="block text-primary/70 dark:text-white/60 text-sm mb-2">Username</label>
          {isEditing ? (
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="w-full px-4 py-2 bg-white/40 dark:bg-black/30 border border-primary/20 dark:border-white/10 rounded-lg text-primary dark:text-white focus:border-secondary dark:focus:border-secondary/50 focus:outline-none placeholder:text-primary/50 dark:placeholder:text-white/50"
            />
          ) : (
            <p className="text-primary dark:text-white font-semibold">{formData.username}</p>
          )}
        </div>

        {/* Prénom */}
        <div>
          <label className="block text-primary/70 dark:text-white/60 text-sm mb-2">Prénom</label>
          {isEditing ? (
            <input
              type="text"
              value={formData.firstName || ''}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              placeholder="Votre prénom"
              className="w-full px-4 py-2 bg-white/40 dark:bg-black/30 border border-primary/20 dark:border-white/10 rounded-lg text-primary dark:text-white focus:border-secondary dark:focus:border-secondary/50 focus:outline-none placeholder:text-primary/50 dark:placeholder:text-white/50"
            />
          ) : (
            <p className="text-primary dark:text-white font-semibold">{formData.firstName || 'Non renseigné'}</p>
          )}
        </div>

        {/* Nom */}
        <div>
          <label className="block text-primary/70 dark:text-white/60 text-sm mb-2">Nom</label>
          {isEditing ? (
            <input
              type="text"
              value={formData.lastName || ''}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              placeholder="Votre nom"
              className="w-full px-4 py-2 bg-white/40 dark:bg-black/30 border border-primary/20 dark:border-white/10 rounded-lg text-primary dark:text-white focus:border-secondary dark:focus:border-secondary/50 focus:outline-none placeholder:text-primary/50 dark:placeholder:text-white/50"
            />
          ) : (
            <p className="text-primary dark:text-white font-semibold">{formData.lastName || 'Non renseigné'}</p>
          )}
        </div>

        {/* Bio */}
        <div>
          <label className="block text-primary/70 dark:text-white/60 text-sm mb-2">Bio</label>
          {isEditing ? (
            <textarea
              value={formData.bio || ''}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              placeholder="Parlez-nous de vous..."
              rows={3}
              className="w-full px-4 py-2 bg-white/40 dark:bg-black/30 border border-primary/20 dark:border-white/10 rounded-lg text-primary dark:text-white focus:border-secondary dark:focus:border-secondary/50 focus:outline-none resize-none placeholder:text-primary/50 dark:placeholder:text-white/50"
            />
          ) : (
            <p className="text-primary/90 dark:text-white/80">{formData.bio || 'Aucune bio'}</p>
          )}
        </div>

        {/* Discord */}
        <div>
          <label className="block text-primary/70 dark:text-white/60 text-sm mb-2">Discord</label>
          {isEditing ? (
            <input
              type="text"
              value={formData.discordTag || ''}
              onChange={(e) => setFormData({ ...formData, discordTag: e.target.value })}
              placeholder="username#1234"
              className="w-full px-4 py-2 bg-white/40 dark:bg-black/30 border border-primary/20 dark:border-white/10 rounded-lg text-primary dark:text-white focus:border-secondary dark:focus:border-secondary/50 focus:outline-none placeholder:text-primary/50 dark:placeholder:text-white/50"
            />
          ) : (
            <p className="text-primary dark:text-white font-semibold">{formData.discordTag || 'Non renseigné'}</p>
          )}
        </div>

        {/* Twitch */}
        <div>
          <label className="block text-primary/70 dark:text-white/60 text-sm mb-2">Twitch</label>
          {isEditing ? (
            <input
              type="text"
              value={formData.twitchUsername || ''}
              onChange={(e) => setFormData({ ...formData, twitchUsername: e.target.value })}
              placeholder="votre_pseudo_twitch"
              className="w-full px-4 py-2 bg-white/40 dark:bg-black/30 border border-primary/20 dark:border-white/10 rounded-lg text-primary dark:text-white focus:border-secondary dark:focus:border-secondary/50 focus:outline-none placeholder:text-primary/50 dark:placeholder:text-white/50"
            />
          ) : (
            <p className="text-primary dark:text-white font-semibold">{formData.twitchUsername || 'Non renseigné'}</p>
          )}
        </div>

        {/* Boutons de sauvegarde */}
        {isEditing && (
          <div className="flex gap-3 pt-4">
            <Button
              variant="primary"
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1"
            >
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
            </Button>
            <Button
              variant="ghost"
              onClick={handleCancel}
              disabled={isSaving}
            >
              <X className="w-4 h-4 mr-2" />
              Annuler
            </Button>
          </div>
        )}
      </div>
    </Card>
  )
}
