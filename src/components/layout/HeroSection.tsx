import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Shield, Users, MapPin, Code, Heart, ExternalLink } from 'lucide-react';
const HeroSection = () => {
  return <section className="bg-[#f8f3e7] py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="text-center space-y-8">
          {/* Badge */}
          {/* <Badge variant="outline" className="bg-accent/10 text-accent-foreground border-accent/20">
            🌟 Open Source Community Project
          </Badge> */}
          
          {/* Main Heading */}
          <div className="space-y-4 flex flex-col items-center">
            <h1 className="text-4xl lg:text-6xl font-bold font-playfair leading-6">
              Safer paths, shared by those who{' '}
              <span className="text-primary">walk them</span>
            </h1>
            <img src="/assets/walking-flower.png" className="w-[200px] h-[300px]"></img>
            <p className="text-xl opacity-60 max-w-4xl mx-auto">
              An open source platform for discovering and sharing secure walking routes through community collaboration. 
              Built by developers and safety advocates, for everyone who walks.
            </p>
          </div>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-[#81812c]" onClick={() => document.querySelector('#map-section')?.scrollIntoView({
            behavior: 'smooth'
          })}>
              <MapPin className="mr-2 h-5 w-5" />
              Explore the Map
            </Button>
            <Button className="font-[#81812c] bg-white" size="lg" asChild>
              <a href="#" target="_blank" rel="noopener noreferrer" className="text-[#81812c]">
                <ExternalLink className="mr-2 h-5 w-5" />
                Read Our Story
              </a>
            </Button>
          </div>

          {/* Project Features */}
          
        </div>
      </div>
    </section>;
};
export default HeroSection;