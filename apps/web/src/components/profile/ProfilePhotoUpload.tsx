'use client'

import { useState, useRef } from 'react'
import { Camera, Upload } from 'lucide-react'
import Card from '@/components/ui/Card'

interface ProfilePhotoUploadProps {
  currentPhoto?: string
  username: string
  onPhotoChange?: (file: File) => void
}

export default function ProfilePhotoUpload({ 
  currentPhoto, 
  username,
  onPhotoChange 
}: ProfilePhotoUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentPhoto || null)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Vérifier le type de fichier
    if (!file.type.startsWith('image/')) {
      alert('Veuillez sélectionner une image')
      return
    }

    // Vérifier la taille (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('L\'image ne doit pas dépasser 5MB')
      return
    }

    // Créer un aperçu local immédiat
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    // Appeler le callback si fourni
    if (onPhotoChange) {
      setIsUploading(true)
      try {
        await onPhotoChange(file)
      } catch (error: any) {
        console.error('Erreur upload photo:', error)
        alert(error?.message || 'Erreur lors de l\'upload de la photo')
        // Réinitialiser l'aperçu en cas d'erreur
        setPreview(currentPhoto || null)
      } finally {
        setIsUploading(false)
      }
    }
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="relative group">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
      
      <div 
        onClick={handleClick}
        className="relative w-32 h-32 rounded-full cursor-pointer transition-all duration-300 group-hover:scale-105"
      >
        {preview ? (
          <img
            src={preview}
            alt={username}
            className="w-full h-full rounded-full object-cover border-2 border-secondary/35 shadow-glow-blue"
          />
        ) : (
          <div className="w-full h-full rounded-full bg-gradient-to-br from-secondary/20 to-danger/20 border-2 border-secondary/35 shadow-glow-blue flex items-center justify-center">
            <span className="title-tech text-secondary font-extrabold text-4xl">
              {username.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        
        {/* Overlay au hover */}
        <div className="absolute inset-0 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          {isUploading ? (
            <div className="text-white text-sm">Upload...</div>
          ) : (
            <Camera className="w-8 h-8 text-white" />
          )}
        </div>

        {/* Badge de changement de photo */}
        <div className="absolute bottom-0 right-0 w-10 h-10 rounded-full bg-secondary border-2 border-dark flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
          <Upload className="w-5 h-5 text-dark" />
        </div>
      </div>

      <p className="text-center text-white/60 text-xs mt-2">
        Cliquer pour changer la photo
      </p>
    </div>
  )
}
