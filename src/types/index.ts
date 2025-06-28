export interface CaptionRequest {
  content: string
  tone: string
  platform: string
  includeHashtags: boolean
  hashtagCount?: number
}

export interface CaptionResponse {
  caption: string
  hashtags: string[]
  id?: string
}

export interface User {
  id: string
  email: string
  fullName?: string
  avatarUrl?: string
}

export type ToneType = 'funny' | 'professional' | 'romantic' | 'motivational' | 'casual' | 'inspirational'
export type PlatformType = 'instagram' | 'twitter' | 'facebook' | 'linkedin' | 'tiktok'