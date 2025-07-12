import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  Users, 
  MapPin, 
  Star, 
  ArrowRight, 
  CheckCircle, 
  Heart,
  Navigation,
  Eye,
  MessageCircle,
  TrendingUp,
  Clock
} from 'lucide-react';
import { Link } from 'react-router-dom';

const Landing = () => {
  const [email, setEmail] = useState('');

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle email signup
    console.log('Email signup:', email);
    setEmail('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <Shield className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">SafePath</span>
            </div>
            <nav className="hidden md:flex items-center gap-6">
              <a href="#features" className="text-gray-600 hover:text-gray-900 transition-colors">Features</a>
              <a href="#how-it-works" className="text-gray-600 hover:text-gray-900 transition-colors">How It Works</a>
              <a href="#community" className="text-gray-600 hover:text-gray-900 transition-colors">Community</a>
              <Link to="/app">
                <Button variant="outline" size="sm">Open App</Button>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  Community-Powered Safety
                </Badge>
                <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 leading-tight">
                  Safer paths, shared by the people who 
                  <span className="text-blue-600"> walk them</span>
                </h1>
                <p className="text-xl text-gray-600 leading-relaxed">
                  Discover secure walking routes through real community insights. Share your local knowledge and help others navigate safely through Melbourne's neighborhoods.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/app">
                  <Button size="lg" className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700">
                    Start Exploring Routes
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  Watch How It Works
                </Button>
              </div>

              {/* Trust Indicators */}
              <div className="flex items-center gap-6 pt-4">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-green-600" />
                  <span className="text-sm text-gray-600">2,500+ Active Contributors</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-blue-600" />
                  <span className="text-sm text-gray-600">15,000+ Safe Routes</span>
                </div>
              </div>
            </div>

            {/* Hero Visual */}
            <div className="relative">
              <div className="bg-white rounded-2xl shadow-2xl p-6 transform rotate-3 hover:rotate-0 transition-transform duration-300">
                <div className="bg-gradient-to-br from-blue-500 to-green-500 rounded-lg h-64 flex items-center justify-center">
                  <div className="text-white text-center space-y-4">
                    <MapPin className="h-16 w-16 mx-auto" />
                    <p className="text-lg font-semibold">Interactive Safety Map</p>
                    <p className="text-sm opacity-90">Real-time community insights</p>
                  </div>
                </div>
              </div>
              
              {/* Floating Cards */}
              <div className="absolute -top-4 -left-4 bg-white rounded-lg shadow-lg p-3 transform -rotate-6">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-green-600" />
                  <span className="text-xs font-medium">Well-lit path</span>
                </div>
              </div>
              
              <div className="absolute -bottom-4 -right-4 bg-white rounded-lg shadow-lg p-3 transform rotate-6">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <span className="text-xs font-medium">5-star safety rating</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900">
              Why SafePath Works
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Built by the community, for the community. Every feature is designed to make walking safer through shared local knowledge.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardContent className="p-8 text-center space-y-4">
                <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto">
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Community-Verified</h3>
                <p className="text-gray-600">
                  Every route and safety report is validated by real people who know the area. Trust comes from lived experience.
                </p>
              </CardContent>
            </Card>

            {/* Feature 2 */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardContent className="p-8 text-center space-y-4">
                <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto">
                  <Eye className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Real-Time Insights</h3>
                <p className="text-gray-600">
                  Get up-to-date information about lighting, foot traffic, and safety conditions from people walking these routes daily.
                </p>
              </CardContent>
            </Card>

            {/* Feature 3 */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardContent className="p-8 text-center space-y-4">
                <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto">
                  <Navigation className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Smart Route Planning</h3>
                <p className="text-gray-600">
                  Our algorithm considers community safety data to suggest the most secure paths for your journey.
                </p>
              </CardContent>
            </Card>

            {/* Feature 4 */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardContent className="p-8 text-center space-y-4">
                <div className="bg-yellow-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto">
                  <MessageCircle className="h-8 w-8 text-yellow-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Anonymous Reporting</h3>
                <p className="text-gray-600">
                  Share safety concerns or positive observations without revealing your identity. Your privacy is protected.
                </p>
              </CardContent>
            </Card>

            {/* Feature 5 */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardContent className="p-8 text-center space-y-4">
                <div className="bg-red-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto">
                  <Clock className="h-8 w-8 text-red-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Time-Aware Safety</h3>
                <p className="text-gray-600">
                  Route recommendations adapt based on time of day, considering factors like lighting and typical foot traffic.
                </p>
              </CardContent>
            </Card>

            {/* Feature 6 */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardContent className="p-8 text-center space-y-4">
                <div className="bg-indigo-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto">
                  <Heart className="h-8 w-8 text-indigo-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Built for Everyone</h3>
                <p className="text-gray-600">
                  Designed with accessibility in mind, ensuring everyone can contribute to and benefit from community safety knowledge.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900">
              How SafePath Works
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Simple steps to safer walking. Join thousands of community members making Melbourne's streets safer for everyone.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="text-center space-y-6">
              <div className="bg-blue-600 text-white rounded-full w-16 h-16 flex items-center justify-center mx-auto text-2xl font-bold">
                1
              </div>
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-900">Explore & Discover</h3>
                <p className="text-gray-600">
                  Browse community-verified safe routes in your area. See real-time safety ratings, lighting conditions, and foot traffic data.
                </p>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-md">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="h-4 w-4 text-blue-600" />
                  <span>15 safe routes near you</span>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="text-center space-y-6">
              <div className="bg-green-600 text-white rounded-full w-16 h-16 flex items-center justify-center mx-auto text-2xl font-bold">
                2
              </div>
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-900">Share Your Experience</h3>
                <p className="text-gray-600">
                  Report safety observations, rate routes, and share local insights. Your knowledge helps the entire community stay safer.
                </p>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-md">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <span>Rate this route's safety</span>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="text-center space-y-6">
              <div className="bg-purple-600 text-white rounded-full w-16 h-16 flex items-center justify-center mx-auto text-2xl font-bold">
                3
              </div>
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-900">Build Community</h3>
                <p className="text-gray-600">
                  Connect with neighbors who care about safety. Together, we create a comprehensive map of secure walking paths.
                </p>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-md">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Users className="h-4 w-4 text-purple-600" />
                  <span>Join 2,500+ contributors</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Community Stats Section */}
      <section id="community" className="py-20 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold">
              Powered by Community
            </h2>
            <p className="text-xl opacity-90 max-w-3xl mx-auto">
              Real numbers from real people making a real difference in Melbourne's walking safety.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center space-y-2">
              <div className="text-4xl lg:text-5xl font-bold">2,500+</div>
              <div className="text-lg opacity-90">Active Contributors</div>
            </div>
            <div className="text-center space-y-2">
              <div className="text-4xl lg:text-5xl font-bold">15,000+</div>
              <div className="text-lg opacity-90">Safe Routes Mapped</div>
            </div>
            <div className="text-center space-y-2">
              <div className="text-4xl lg:text-5xl font-bold">45,000+</div>
              <div className="text-lg opacity-90">Safety Reports</div>
            </div>
            <div className="text-center space-y-2">
              <div className="text-4xl lg:text-5xl font-bold">98%</div>
              <div className="text-lg opacity-90">User Satisfaction</div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900">
              What Our Community Says
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Real stories from real people who've made walking safer in their neighborhoods.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Testimonial 1 */}
            <Card className="border-0 shadow-lg">
              <CardContent className="p-8 space-y-4">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-600 italic">
                  "SafePath helped me find a well-lit route home from work. As a night shift worker, this app has been a game-changer for my peace of mind."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-semibold">S</span>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Sarah M.</div>
                    <div className="text-sm text-gray-500">Healthcare Worker, Richmond</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Testimonial 2 */}
            <Card className="border-0 shadow-lg">
              <CardContent className="p-8 space-y-4">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-600 italic">
                  "I love contributing to the community by sharing my local knowledge. It feels good knowing I'm helping others stay safe in my neighborhood."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 font-semibold">M</span>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Marcus T.</div>
                    <div className="text-sm text-gray-500">Local Resident, Fitzroy</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Testimonial 3 */}
            <Card className="border-0 shadow-lg">
              <CardContent className="p-8 space-y-4">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-600 italic">
                  "The anonymous reporting feature is brilliant. I can share safety concerns without worrying about my privacy. The community response has been amazing."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-purple-600 font-semibold">A</span>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Alex K.</div>
                    <div className="text-sm text-gray-500">Student, Carlton</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-blue-50 to-green-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          <div className="space-y-4">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900">
              Ready to Walk Safer?
            </h2>
            <p className="text-xl text-gray-600">
              Join thousands of Melbourne residents making their community safer, one route at a time.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/app">
              <Button size="lg" className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700">
                Start Using SafePath
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="w-full sm:w-auto">
              Learn More
            </Button>
          </div>

          {/* Email Signup */}
          <div className="max-w-md mx-auto">
            <form onSubmit={handleEmailSubmit} className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email for updates"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <Button type="submit" variant="outline">
                Subscribe
              </Button>
            </form>
            <p className="text-xs text-gray-500 mt-2">
              Get notified about new features and safety updates. No spam, ever.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Shield className="h-6 w-6 text-blue-400" />
                <span className="text-lg font-bold">SafePath</span>
              </div>
              <p className="text-gray-400 text-sm">
                Community-driven safety for Melbourne's walking routes. By the people, for the people.
              </p>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-semibold">Product</h4>
              <div className="space-y-2 text-sm text-gray-400">
                <div><a href="#features" className="hover:text-white transition-colors">Features</a></div>
                <div><a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a></div>
                <div><Link to="/app" className="hover:text-white transition-colors">Open App</Link></div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-semibold">Community</h4>
              <div className="space-y-2 text-sm text-gray-400">
                <div><a href="#community" className="hover:text-white transition-colors">Statistics</a></div>
                <div><a href="#" className="hover:text-white transition-colors">Guidelines</a></div>
                <div><a href="#" className="hover:text-white transition-colors">Support</a></div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-semibold">Legal</h4>
              <div className="space-y-2 text-sm text-gray-400">
                <div><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></div>
                <div><a href="#" className="hover:text-white transition-colors">Terms of Service</a></div>
                <div><a href="#" className="hover:text-white transition-colors">Contact</a></div>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
            <p>&copy; 2024 SafePath Melbourne. Made with ❤️ by the community, for the community.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;