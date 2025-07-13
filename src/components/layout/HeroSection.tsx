import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Shield, Users, MapPin, Code, Heart, ExternalLink } from 'lucide-react';

const HeroSection = () => {
  return (
    <section className="bg-gradient-to-br from-primary/5 via-background to-accent/5 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center space-y-8">
          {/* Badge */}
          <Badge variant="outline" className="bg-accent/10 text-accent-foreground border-accent/20">
            🌟 Open Source Community Project
          </Badge>
          
          {/* Main Heading */}
          <div className="space-y-4">
            <h1 className="text-4xl lg:text-6xl font-bold text-foreground leading-tight">
              Safer paths, shared by the people who{' '}
              <span className="text-primary">walk them</span>
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed max-w-4xl mx-auto">
              An open source platform for discovering and sharing secure walking routes through community collaboration. 
              Built by developers and safety advocates, for everyone who walks.
            </p>
          </div>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="bg-primary hover:bg-primary/90"
              onClick={() => document.querySelector('#map-section')?.scrollIntoView({ behavior: 'smooth' })}
            >
              <MapPin className="mr-2 h-5 w-5" />
              Explore the Map
            </Button>
            <Button variant="outline" size="lg" asChild>
              <a href="#" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-5 w-5" />
                Read Our Story
              </a>
            </Button>
          </div>

          {/* Project Features */}
          <div className="flex flex-wrap items-center justify-center gap-6 pt-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Code className="h-5 w-5 text-accent" />
              <span>Open Source</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <span>Community Driven</span>
            </div>
            <div className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-destructive" />
              <span>Built with Care</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-secondary" />
              <span>Privacy First</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;