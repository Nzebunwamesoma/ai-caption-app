import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { 
  Sparkles, 
  Copy, 
  Heart, 
  Trash2, 
  Filter,
  Search,
  Instagram,
  Twitter,
  Facebook,
  Linkedin,
  Music
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import type { Caption } from '@/types/database'
import type { ToneType, PlatformType } from '@/types'
import toast from 'react-hot-toast'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { formatDate, copyToClipboard } from '@/lib/utils'

const captionSchema = z.object({
  content: z.string().min(10, 'Please describe your post in at least 10 characters'),
  tone: z.string(),
  platform: z.string(),
  includeHashtags: z.boolean(),
  hashtagCount: z.number().min(1).max(30).optional(),
})

type CaptionForm = z.infer<typeof captionSchema>

const tones: { value: ToneType; label: string; emoji: string }[] = [
  { value: 'funny', label: 'Funny', emoji: '😄' },
  { value: 'professional', label: 'Professional', emoji: '💼' },
  { value: 'romantic', label: 'Romantic', emoji: '💕' },
  { value: 'motivational', label: 'Motivational', emoji: '💪' },
  { value: 'casual', label: 'Casual', emoji: '😊' },
  { value: 'inspirational', label: 'Inspirational', emoji: '✨' },
]

const platforms: { value: PlatformType; label: string; icon: any; color: string }[] = [
  { value: 'instagram', label: 'Instagram', icon: Instagram, color: 'text-pink-500' },
  { value: 'twitter', label: 'Twitter', icon: Twitter, color: 'text-blue-400' },
  { value: 'facebook', label: 'Facebook', icon: Facebook, color: 'text-blue-600' },
  { value: 'linkedin', label: 'LinkedIn', icon: Linkedin, color: 'text-blue-700' },
  { value: 'tiktok', label: 'TikTok', icon: Music, color: 'text-black' },
]

export default function Dashboard() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedCaption, setGeneratedCaption] = useState<string>('')
  const [generatedHashtags, setGeneratedHashtags] = useState<string[]>([])
  const [savedCaptions, setSavedCaptions] = useState<Caption[]>([])
  const [filteredCaptions, setFilteredCaptions] = useState<Caption[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterTone, setFilterTone] = useState<string>('all')
  const [filterPlatform, setFilterPlatform] = useState<string>('all')
  const { user } = useAuth()

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<CaptionForm>({
    resolver: zodResolver(captionSchema),
    defaultValues: {
      tone: 'casual',
      platform: 'instagram',
      includeHashtags: true,
      hashtagCount: 5,
    },
  })

  const includeHashtags = watch('includeHashtags')

  useEffect(() => {
    if (user) {
      fetchSavedCaptions()
    }
  }, [user])

  useEffect(() => {
    filterCaptions()
  }, [savedCaptions, searchTerm, filterTone, filterPlatform])

  const fetchSavedCaptions = async () => {
    try {
      const { data, error } = await supabase
        .from('captions')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setSavedCaptions(data || [])
    } catch (error) {
      console.error('Error fetching captions:', error)
    }
  }

  const filterCaptions = () => {
    let filtered = savedCaptions

    if (searchTerm) {
      filtered = filtered.filter(caption =>
        caption.content.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (filterTone !== 'all') {
      filtered = filtered.filter(caption => caption.tone === filterTone)
    }

    if (filterPlatform !== 'all') {
      filtered = filtered.filter(caption => caption.platform === filterPlatform)
    }

    setFilteredCaptions(filtered)
  }

  const generateCaption = async (data: CaptionForm) => {
    setIsGenerating(true)
    try {
      const response = await fetch('/api/generate-caption', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: data.content,
          tone: data.tone,
          platform: data.platform,
          includeHashtags: data.includeHashtags,
          hashtagCount: data.hashtagCount || 5,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate caption')
      }

      const result = await response.json()
      setGeneratedCaption(result.caption)
      setGeneratedHashtags(result.hashtags || [])
      
      toast.success('Caption generated successfully!')
    } catch (error) {
      toast.error('Failed to generate caption. Please try again.')
      console.error('Error generating caption:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const saveCaption = async () => {
    if (!generatedCaption || !user) return

    try {
      const formData = watch()
      const { error } = await supabase
        .from('captions')
        .insert({
          user_id: user.id,
          content: generatedCaption,
          tone: formData.tone,
          platform: formData.platform,
          hashtags: generatedHashtags,
        })

      if (error) throw error

      toast.success('Caption saved!')
      fetchSavedCaptions()
    } catch (error) {
      toast.error('Failed to save caption')
      console.error('Error saving caption:', error)
    }
  }

  const toggleFavorite = async (captionId: string, isFavorite: boolean) => {
    try {
      const { error } = await supabase
        .from('captions')
        .update({ is_favorite: !isFavorite })
        .eq('id', captionId)

      if (error) throw error

      setSavedCaptions(prev =>
        prev.map(caption =>
          caption.id === captionId
            ? { ...caption, is_favorite: !isFavorite }
            : caption
        )
      )

      toast.success(isFavorite ? 'Removed from favorites' : 'Added to favorites')
    } catch (error) {
      toast.error('Failed to update favorite')
      console.error('Error updating favorite:', error)
    }
  }

  const deleteCaption = async (captionId: string) => {
    try {
      const { error } = await supabase
        .from('captions')
        .delete()
        .eq('id', captionId)

      if (error) throw error

      setSavedCaptions(prev => prev.filter(caption => caption.id !== captionId))
      toast.success('Caption deleted')
    } catch (error) {
      toast.error('Failed to delete caption')
      console.error('Error deleting caption:', error)
    }
  }

  const handleCopy = async (text: string) => {
    try {
      await copyToClipboard(text)
      toast.success('Copied to clipboard!')
    } catch (error) {
      toast.error('Failed to copy')
    }
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            AI Caption Generator
          </h1>
          <p className="text-gray-600">
            Create engaging captions and hashtags for your social media posts
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Generator Form */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center space-x-2">
              <Sparkles className="h-5 w-5 text-primary-500" />
              <span>Generate Caption</span>
            </h2>

            <form onSubmit={handleSubmit(generateCaption)} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Describe your post
                </label>
                <textarea
                  {...register('content')}
                  rows={4}
                  className="input-field resize-none"
                  placeholder="Describe what your post is about, the mood, key elements, etc."
                />
                {errors.content && (
                  <p className="mt-1 text-sm text-red-600">{errors.content.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tone
                  </label>
                  <select {...register('tone')} className="input-field">
                    {tones.map(tone => (
                      <option key={tone.value} value={tone.value}>
                        {tone.emoji} {tone.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Platform
                  </label>
                  <select {...register('platform')} className="input-field">
                    {platforms.map(platform => (
                      <option key={platform.value} value={platform.value}>
                        {platform.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2">
                  <input
                    {...register('includeHashtags')}
                    type="checkbox"
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Include hashtags
                  </span>
                </label>

                {includeHashtags && (
                  <div className="flex items-center space-x-2">
                    <label className="text-sm font-medium text-gray-700">
                      Count:
                    </label>
                    <input
                      {...register('hashtagCount', { valueAsNumber: true })}
                      type="number"
                      min="1"
                      max="30"
                      className="w-16 px-2 py-1 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={isGenerating}
                className="btn-primary w-full flex items-center justify-center space-x-2"
              >
                {isGenerating ? (
                  <>
                    <LoadingSpinner size="sm" />
                    <span className="loading-dots">Generating</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5" />
                    <span>Generate Caption</span>
                  </>
                )}
              </button>
            </form>

            {/* Generated Result */}
            {generatedCaption && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-8 p-6 bg-gradient-to-r from-primary-50 to-secondary-50 rounded-xl border border-primary-100"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Generated Caption
                  </h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleCopy(generatedCaption + '\n\n' + generatedHashtags.join(' '))}
                      className="p-2 text-gray-600 hover:text-primary-600 transition-colors"
                      title="Copy caption and hashtags"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                    <button
                      onClick={saveCaption}
                      className="p-2 text-gray-600 hover:text-primary-600 transition-colors"
                      title="Save caption"
                    >
                      <Heart className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <p className="text-gray-800 whitespace-pre-wrap">
                      {generatedCaption}
                    </p>
                  </div>
                  
                  {generatedHashtags.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">
                        Hashtags:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {generatedHashtags.map((hashtag, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium"
                          >
                            #{hashtag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </div>

          {/* Saved Captions */}
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Saved Captions ({filteredCaptions.length})
              </h2>
            </div>

            {/* Filters */}
            <div className="space-y-4 mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search captions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-field pl-10"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <select
                  value={filterTone}
                  onChange={(e) => setFilterTone(e.target.value)}
                  className="input-field"
                >
                  <option value="all">All Tones</option>
                  {tones.map(tone => (
                    <option key={tone.value} value={tone.value}>
                      {tone.label}
                    </option>
                  ))}
                </select>

                <select
                  value={filterPlatform}
                  onChange={(e) => setFilterPlatform(e.target.value)}
                  className="input-field"
                >
                  <option value="all">All Platforms</option>
                  {platforms.map(platform => (
                    <option key={platform.value} value={platform.value}>
                      {platform.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Captions List */}
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {filteredCaptions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {savedCaptions.length === 0 ? (
                    <p>No saved captions yet. Generate your first caption!</p>
                  ) : (
                    <p>No captions match your filters.</p>
                  )}
                </div>
              ) : (
                filteredCaptions.map((caption) => {
                  const platform = platforms.find(p => p.value === caption.platform)
                  const tone = tones.find(t => t.value === caption.tone)
                  
                  return (
                    <motion.div
                      key={caption.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          {platform && (
                            <platform.icon className={`h-4 w-4 ${platform.color}`} />
                          )}
                          <span className="text-sm font-medium text-gray-700">
                            {tone?.emoji} {tone?.label}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => toggleFavorite(caption.id, caption.is_favorite)}
                            className={`p-1 transition-colors ${
                              caption.is_favorite
                                ? 'text-red-500 hover:text-red-600'
                                : 'text-gray-400 hover:text-red-500'
                            }`}
                          >
                            <Heart className={`h-4 w-4 ${caption.is_favorite ? 'fill-current' : ''}`} />
                          </button>
                          <button
                            onClick={() => handleCopy(caption.content + '\n\n' + caption.hashtags.join(' '))}
                            className="p-1 text-gray-400 hover:text-primary-600 transition-colors"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => deleteCaption(caption.id)}
                            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      
                      <p className="text-gray-800 text-sm mb-2 line-clamp-3">
                        {caption.content}
                      </p>
                      
                      {caption.hashtags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {caption.hashtags.slice(0, 3).map((hashtag, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-primary-100 text-primary-700 rounded text-xs"
                            >
                              #{hashtag}
                            </span>
                          ))}
                          {caption.hashtags.length > 3 && (
                            <span className="px-2 py-1 bg-gray-200 text-gray-600 rounded text-xs">
                              +{caption.hashtags.length - 3} more
                            </span>
                          )}
                        </div>
                      )}
                      
                      <p className="text-xs text-gray-500">
                        {formatDate(caption.created_at)}
                      </p>
                    </motion.div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}