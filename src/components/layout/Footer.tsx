import { Github, Shield, FileText } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-muted/30 border-t border-border py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              <span className="text-lg font-bold text-foreground">Safer Path</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Community-sourced safety information. 
              Built with open source technologies and powered by local knowledge.
            </p>
          </div>

          {/* Links Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Resources</h3>
            <div className="space-y-2">
              <a 
                href="https://github.com/your-repo/safepath-melbourne#privacy-policy" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <FileText className="h-4 w-4" />
                Privacy Policy
              </a>
              <a 
                href="https://github.com/your-repo/safepath-melbourne#contributing" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <Github className="h-4 w-4" />
                Contribution Guidelines
              </a>
              <a 
                href="https://github.com/your-repo/safepath-melbourne" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <Github className="h-4 w-4" />
                View Source Code
              </a>
            </div>
          </div>

          {/* Community Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Community</h3>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                This project is built by and for the community. 
                All submissions are anonymous and help create safer walking experiences for everyone.
              </p>
              <p className="text-xs text-muted-foreground">
                Free and open source software. No tracking, no ads, no profit.
              </p>
            </div>
          </div>

          {/* Built With Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Built With</h3>
            <div className="space-y-2">
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span>Lovable</span>
                <span>Supabase</span>
                <span>MapLibre GL</span>
                <span>MapTiler</span>
                <span>React</span>
                <span>Vite</span>
                <span>Tailwind CSS</span>
                <span>TypeScript</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Built with love for the open source community.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-border mt-8 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-muted-foreground">
            © 2024 Safer Path. Open source project licensed under MIT.
          </p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>Made with ❤️ for the community</span>
            <a 
              href="https://github.com/your-repo/safer-path" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              Contribute on GitHub
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;