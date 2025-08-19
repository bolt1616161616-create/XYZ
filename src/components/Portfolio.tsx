import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { 
  LogOut, 
  Plus, 
  ExternalLink, 
  Github, 
  Edit3, 
  Trash2, 
  User,
  Mail,
  Calendar,
  Code,
  Palette,
  Smartphone,
  Globe,
  Database,
  Settings
} from 'lucide-react'

interface PortfolioItem {
  id: string
  title: string
  description: string | null
  image_url: string | null
  project_url: string | null
  github_url: string | null
  technologies: string[]
  category: string
  created_at: string
}

interface Profile {
  id: string
  email: string
  full_name: string | null
  bio: string | null
  avatar_url: string | null
}

export const Portfolio: React.FC = () => {
  const { user, signOut } = useAuth()
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('all')

  const categories = [
    { id: 'all', name: 'All Projects', icon: Globe },
    { id: 'web', name: 'Web Development', icon: Code },
    { id: 'mobile', name: 'Mobile Apps', icon: Smartphone },
    { id: 'design', name: 'UI/UX Design', icon: Palette },
    { id: 'backend', name: 'Backend', icon: Database },
  ]

  useEffect(() => {
    if (user) {
      fetchProfile()
      fetchPortfolioItems()
    }
  }, [user])

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single()

      if (error) throw error
      setProfile(data)
    } catch (error) {
      console.error('Error fetching profile:', error)
    }
  }

  const fetchPortfolioItems = async () => {
    try {
      const { data, error } = await supabase
        .from('portfolio_items')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setPortfolioItems(data || [])
    } catch (error) {
      console.error('Error fetching portfolio items:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredItems = selectedCategory === 'all' 
    ? portfolioItems 
    : portfolioItems.filter(item => item.category === selectedCategory)

  const getPlaceholderImage = (category: string) => {
    const images = {
      web: 'https://images.pexels.com/photos/270348/pexels-photo-270348.jpeg?auto=compress&cs=tinysrgb&w=800',
      mobile: 'https://images.pexels.com/photos/607812/pexels-photo-607812.jpeg?auto=compress&cs=tinysrgb&w=800',
      design: 'https://images.pexels.com/photos/196644/pexels-photo-196644.jpeg?auto=compress&cs=tinysrgb&w=800',
      backend: 'https://images.pexels.com/photos/1181675/pexels-photo-1181675.jpeg?auto=compress&cs=tinysrgb&w=800',
      default: 'https://images.pexels.com/photos/574071/pexels-photo-574071.jpeg?auto=compress&cs=tinysrgb&w=800'
    }
    return images[category as keyof typeof images] || images.default
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your portfolio...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-blue-600 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  {profile?.full_name || 'My Portfolio'}
                </h1>
                <p className="text-sm text-gray-500">{profile?.email}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button className="btn-secondary flex items-center gap-2">
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">Settings</span>
              </button>
              <button 
                onClick={signOut}
                className="btn-primary flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Section */}
        <div className="card mb-8 animate-fade-in">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="w-20 h-20 bg-gradient-to-r from-primary-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
              <User className="w-10 h-10 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {profile?.full_name || 'Welcome to Your Portfolio'}
              </h2>
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3">
                <div className="flex items-center gap-1">
                  <Mail className="w-4 h-4" />
                  {profile?.email}
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Member since {new Date(user?.created_at || '').toLocaleDateString()}
                </div>
              </div>
              <p className="text-gray-700">
                {profile?.bio || 'Showcase your amazing projects and skills to the world.'}
              </p>
            </div>
            <button className="btn-primary flex items-center gap-2 whitespace-nowrap">
              <Edit3 className="w-4 h-4" />
              Edit Profile
            </button>
          </div>
        </div>

        {/* Category Filter */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => {
              const Icon = category.icon
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    selectedCategory === category.id
                      ? 'bg-primary-600 text-white shadow-lg'
                      : 'bg-white/80 text-gray-700 hover:bg-white hover:shadow-md'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{category.name}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Portfolio Grid */}
        {filteredItems.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Plus className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Projects Yet</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Start building your portfolio by adding your first project. Showcase your skills and creativity!
            </p>
            <button className="btn-primary flex items-center gap-2 mx-auto">
              <Plus className="w-4 h-4" />
              Add Your First Project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item, index) => (
              <div 
                key={item.id} 
                className="card group hover:scale-105 transition-all duration-300"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="aspect-video bg-gray-100 rounded-lg mb-4 overflow-hidden">
                  <img
                    src={item.image_url || getPlaceholderImage(item.category)}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                </div>
                
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                    {item.title}
                  </h3>
                  <div className="flex gap-1">
                    <button className="p-1 text-gray-400 hover:text-primary-600 transition-colors">
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button className="p-1 text-gray-400 hover:text-red-600 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {item.description || 'No description available.'}
                </p>
                
                {item.technologies.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {item.technologies.slice(0, 3).map((tech, techIndex) => (
                      <span
                        key={techIndex}
                        className="px-2 py-1 bg-primary-50 text-primary-700 text-xs rounded-full"
                      >
                        {tech}
                      </span>
                    ))}
                    {item.technologies.length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                        +{item.technologies.length - 3} more
                      </span>
                    )}
                  </div>
                )}
                
                <div className="flex gap-2">
                  {item.project_url && (
                    <a
                      href={item.project_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 btn-primary text-center flex items-center justify-center gap-2 text-sm py-2"
                    >
                      <ExternalLink className="w-4 h-4" />
                      View Live
                    </a>
                  )}
                  {item.github_url && (
                    <a
                      href={item.github_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 btn-secondary text-center flex items-center justify-center gap-2 text-sm py-2"
                    >
                      <Github className="w-4 h-4" />
                      Code
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add Project Button */}
        {filteredItems.length > 0 && (
          <div className="text-center mt-12">
            <button className="btn-primary flex items-center gap-2 mx-auto">
              <Plus className="w-4 h-4" />
              Add New Project
            </button>
          </div>
        )}
      </div>
    </div>
  )
}