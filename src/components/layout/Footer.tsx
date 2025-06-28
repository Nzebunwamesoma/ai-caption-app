import React from 'react'
import { Sparkles, Heart } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-white/80 backdrop-blur-md border-t border-white/20 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-2 mb-4 md:mb-0">
            <Sparkles className="h-6 w-6 text-primary-500" />
            <span className="text-lg font-bold gradient-text">CaptionAI</span>
          </div>
          
          <div className="flex items-center space-x-1 text-gray-600">
            <span>Made with</span>
            <Heart className="h-4 w-4 text-red-500 fill-current" />
            <span>for content creators</span>
          </div>
        </div>
        
        <div className="mt-6 pt-6 border-t border-gray-200 text-center text-gray-500 text-sm">
          <p>&copy; 2025 CaptionAI. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}