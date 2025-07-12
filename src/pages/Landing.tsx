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
  Clock,
  Github,
  Code,
  GitBranch,
  Coffee
} from 'lucide-react';
import { Link } from 'react-router-dom';

const Landing = () => {
  const [email, setEmail] = useState('');

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle email signup for project updates
    console.log('Project updates signup:', email);
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
              <Badge variant="outline" className="ml-2 text-xs">Open Source</Badge>
            </div>
            <nav className="hidden md:flex items-center gap-6">
              <a href="#about" className="text-gray-600 hover:text-gray-900 transition-colors">About</a>
              <a href="#contribute" className="text-gray-600 hover:text-gray-900 transition-colors">Contribute</a>
              <a href="#community" className="text-gray-600 hover:text-gray-900 transition-colors">Community</a>
              <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-1">
                <Github className="h-4 w-4" />
                GitHub
              </a>
              <Link to="/app">
                <Button variant="outline" size="sm">Try the Demo</Button>
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
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  🌟 Open Source Community Project
                </Badge>
                <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 leading-tight">
                  Safer paths, shared by the people who 
                  <span className="text-blue-600"> walk them</span>
                </h1>
                <p className="text-xl text-gray-600 leading-relaxed">
                  An open source platform for discovering and sharing secure walking routes through community collaboration. Built by developers and safety advocates, for everyone who walks.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/app">
                  <Button size="lg" className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700">
                    Try the Platform
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  <Github className="mr-2 h-5 w-5" />
                  View on GitHub
                </Button>
              </div>

              {/* Project Stats */}
              <div className="flex items-center gap-6 pt-4">
                <div className="flex items-center gap-2">
                  <Code className="h-5 w-5 text-green-600" />
                  <span className="text-sm text-gray-600">Open Source</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  <span className="text-sm text-gray-600">Community Driven</span>
                </div>
                <div className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-red-500" />
                  <span className="text-sm text-gray-600">Built with Care</span>
                </div>
              </div>
            </div>

            {/* Hero Visual */}
            <div className="relative">
              <div className="bg-white rounded-2xl shadow-2xl p-6 transform rotate-3 hover:rotate-0 transition-transform duration-300">
                <div className="bg-gradient-to-br from-blue-500 to-green-500 rounded-lg h-64 flex items-center justify-center">
                  <div className="text-white text-center space-y-4">
                    <MapPin className="h-16 w-16 mx-auto" />
                    <p className="text-lg font-semibold">Community Safety Map</p>
                    <p className="text-sm opacity-90">Open source & collaborative</p>
                  </div>
                </div>
              </div>
              
              {/* Floating Cards */}
              <div className="absolute -top-4 -left-4 bg-white rounded-lg shadow-lg p-3 transform -rotate-6">
                <div className="flex items-center gap-2">
                  <Github className="h-4 w-4 text-gray-700" />
                  <span className="text-xs font-medium">Open Source</span>
                </div>
              </div>
              
              <div className="absolute -bottom-4 -right-4 bg-white rounded-lg shadow-lg p-3 transform rotate-6">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-600" />
                  <span className="text-xs font-medium">Community Built</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About the Project Section */}
      <section id="about" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900">
              About SafePath
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              An open source project that empowers communities to share local safety knowledge and create safer walking experiences for everyone.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardContent className="p-8 text-center space-y-4">
                <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto">
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Community-Driven</h3>
                <p className="text-gray-600">
                  Built by and for the community. Every feature is shaped by real user needs and local safety knowledge.
                </p>
              </CardContent>
            </Card>

            {/* Feature 2 */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardContent className="p-8 text-center space-y-4">
                <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto">
                  <Code className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Open Source</h3>
                <p className="text-gray-600">
                  Transparent, auditable, and free. Anyone can contribute code, suggest features, or help improve the platform.
                </p>
              </CardContent>
            </Card>

            {/* Feature 3 */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardContent className="p-8 text-center space-y-4">
                <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto">
                  <Shield className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Privacy-First</h3>
                <p className="text-gray-600">
                  Anonymous reporting and privacy-focused design. Your safety data stays secure and under your control.
                </p>
              </CardContent>
            </Card>

            {/* Feature 4 */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardContent className="p-8 text-center space-y-4">
                <div className="bg-yellow-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto">
                  <Navigation className="h-8 w-8 text-yellow-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Smart Route Planning</h3>
                <p className="text-gray-600">
                  Our algorithm considers community safety data to suggest the most secure paths for your journey.
                </p>
              </CardContent>
            </Card>

            {/* Feature 5 */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardContent className="p-8 text-center space-y-4">
                <div className="bg-red-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto">
                  <GitBranch className="h-8 w-8 text-red-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Collaborative Development</h3>
                <p className="text-gray-600">
                  Join developers, designers, and safety advocates working together to improve community safety tools.
                </p>
              </CardContent>
            </Card>

            {/* Feature 6 */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardContent className="p-8 text-center space-y-4">
                <div className="bg-indigo-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto">
                  <Heart className="h-8 w-8 text-indigo-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Made with Purpose</h3>
                <p className="text-gray-600">
                  Every line of code is written with the goal of making communities safer and more connected.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How to Contribute Section */}
      <section id="contribute" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900">
              How You Can Contribute
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Whether you're a developer, designer, safety advocate, or community member, there are many ways to help make SafePath better.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Contribute Code */}
            <div className="text-center space-y-6">
              <div className="bg-blue-600 text-white rounded-full w-16 h-16 flex items-center justify-center mx-auto">
                <Code className="h-8 w-8" />
              </div>
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-900">Contribute Code</h3>
                <p className="text-gray-600">
                  Help improve the platform with bug fixes, new features, or performance optimizations. All skill levels welcome.
                </p>
                <div className="space-y-2 text-sm text-gray-500">
                  <div>• React/TypeScript frontend</div>
                  <div>• Supabase backend</div>
                  <div>• MapLibre GL mapping</div>
                </div>
              </div>
              <Button variant="outline" className="w-full">
                <Github className="mr-2 h-4 w-4" />
                View Issues
              </Button>
            </div>

            {/* Share Local Knowledge */}
            <div className="text-center space-y-6">
              <div className="bg-green-600 text-white rounded-full w-16 h-16 flex items-center justify-center mx-auto">
                <MapPin className="h-8 w-8" />
              </div>
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-900">Share Local Knowledge</h3>
                <p className="text-gray-600">
                  Use the platform and contribute safety observations from your neighborhood. Your local insights help everyone.
                </p>
                <div className="space-y-2 text-sm text-gray-500">
                  <div>• Report safety observations</div>
                  <div>• Rate walking routes</div>
                  <div>• Share local insights</div>
                </div>
              </div>
              <Link to="/app">
                <Button variant="outline" className="w-full">
                  <MapPin className="mr-2 h-4 w-4" />
                  Try the Platform
                </Button>
              </Link>
            </div>

            {/* Spread the Word */}
            <div className="text-center space-y-6">
              <div className="bg-purple-600 text-white rounded-full w-16 h-16 flex items-center justify-center mx-auto">
                <Users className="h-8 w-8" />
              </div>
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-900">Spread the Word</h3>
                <p className="text-gray-600">
                  Help grow the community by sharing SafePath with friends, local groups, and safety-conscious organizations.
                </p>
                <div className="space-y-2 text-sm text-gray-500">
                  <div>• Share with community groups</div>
                  <div>• Provide feedback & ideas</div>
                  <div>• Help with documentation</div>
                </div>
              </div>
              <Button variant="outline" className="w-full">
                <Heart className="mr-2 h-4 w-4" />
                Join Community
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Community Section */}
      <section id="community" className="py-20 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold">
              Built by the Community
            </h2>
            <p className="text-xl opacity-90 max-w-3xl mx-auto">
              SafePath is more than code—it's a community of people who believe in making walking safer for everyone.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center space-y-2">
              <div className="text-4xl lg:text-5xl font-bold">Open</div>
              <div className="text-lg opacity-90">Source Project</div>
            </div>
            <div className="text-center space-y-2">
              <div className="text-4xl lg:text-5xl font-bold">100%</div>
              <div className="text-lg opacity-90">Community Driven</div>
            </div>
            <div className="text-center space-y-2">
              <div className="text-4xl lg:text-5xl font-bold">Free</div>
              <div className="text-lg opacity-90">Forever</div>
            </div>
            <div className="text-center space-y-2">
              <div className="text-4xl lg:text-5xl font-bold">Global</div>
              <div className="text-lg opacity-90">Impact Potential</div>
            </div>
          </div>
        </div>
      </section>

      {/* Community Stories Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900">
              Community Stories
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Hear from contributors and users who are helping build a safer walking experience for everyone.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Story 1 */}
            <Card className="border-0 shadow-lg">
              <CardContent className="p-8 space-y-4">
                <div className="flex items-center gap-1">
                  <Coffee className="h-4 w-4 text-brown-500" />
                  <span className="text-sm text-gray-500">Contributor</span>
                </div>
                <p className="text-gray-600 italic">
                  "Contributing to SafePath has been incredibly rewarding. It's amazing to see how open source can directly impact community safety."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-semibold">S</span>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Sarah M.</div>
                    <div className="text-sm text-gray-500">Frontend Developer</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Story 2 */}
            <Card className="border-0 shadow-lg">
              <CardContent className="p-8 space-y-4">
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-gray-500">Local User</span>
                </div>
                <p className="text-gray-600 italic">
                  "I love that this is open source and community-driven. It feels authentic because it's built by people who actually walk these streets."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 font-semibold">M</span>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Marcus T.</div>
                    <div className="text-sm text-gray-500">Community Advocate</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Story 3 */}
            <Card className="border-0 shadow-lg">
              <CardContent className="p-8 space-y-4">
                <div className="flex items-center gap-1">
                  <Code className="h-4 w-4 text-purple-500" />
                  <span className="text-sm text-gray-500">New Contributor</span>
                </div>
                <p className="text-gray-600 italic">
                  "This was my first open source contribution! The community is welcoming and the project has real social impact. Perfect combination."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-purple-600 font-semibold">A</span>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Alex K.</div>
                    <div className="text-sm text-gray-500">CS Student</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Get Involved CTA Section */}
      <section className="py-20 bg-gradient-to-br from-blue-50 to-green-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          <div className="space-y-4">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900">
              Ready to Get Involved?
            </h2>
            <p className="text-xl text-gray-600">
              Join our community of developers, safety advocates, and local contributors making walking safer for everyone.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700">
              <Github className="mr-2 h-5 w-5" />
              Contribute on GitHub
            </Button>
            <Link to="/app">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                Try the Platform
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>

          {/* Project Updates Signup */}
          <div className="max-w-md mx-auto">
            <form onSubmit={handleEmailSubmit} className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Get project updates"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <Button type="submit" variant="outline">
                Subscribe
              </Button>
            </form>
            <p className="text-xs text-gray-500 mt-2">
              Stay updated on new features, releases, and community events.
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
                <Badge variant="outline" className="text-xs border-gray-600 text-gray-400">Open Source</Badge>
              </div>
              <p className="text-gray-400 text-sm">
                An open source community project for safer walking routes. Built with ❤️ by people who care about community safety.
              </p>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-semibold">Project</h4>
              <div className="space-y-2 text-sm text-gray-400">
                <div><a href="#about" className="hover:text-white transition-colors">About</a></div>
                <div><a href="#contribute" className="hover:text-white transition-colors">Contribute</a></div>
                <div><Link to="/app" className="hover:text-white transition-colors">Try Demo</Link></div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-semibold">Community</h4>
              <div className="space-y-2 text-sm text-gray-400">
                <div><a href="#" className="hover:text-white transition-colors flex items-center gap-1"><Github className="h-3 w-3" /> GitHub</a></div>
                <div><a href="#" className="hover:text-white transition-colors">Discussions</a></div>
                <div><a href="#" className="hover:text-white transition-colors">Contributing Guide</a></div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-semibold">Resources</h4>
              <div className="space-y-2 text-sm text-gray-400">
                <div><a href="#" className="hover:text-white transition-colors">Documentation</a></div>
                <div><a href="#" className="hover:text-white transition-colors">API Reference</a></div>
                <div><a href="#" className="hover:text-white transition-colors">License (MIT)</a></div>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
            <p>&copy; 2024 SafePath Community. Open source project licensed under MIT. Made with ❤️ for safer communities.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;