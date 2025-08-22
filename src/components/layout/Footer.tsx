import { Github, FileText, Route } from 'lucide-react';

const Footer = () => {
  return <footer className="bg-primary border-t border-border pt-8 pb-4 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex md:flex-row flex-col gap-4">

          {/* Brand Section */}
          <div className="space-y-2">
            <div className='md:w-[60%] w-full'>
            <div className="flex items-center">
              <Route className="h-8 w-8 text-background" />
                <span className="text-lg font-bold text-foreground font-playfair text-background tracking-wide">Safer Path</span>
              </div>
              <p className="text-sm text-background">
                Community-sourced safety information. 
                Built with open source technologies and powered by local knowledge.
              </p>
            </div>
          </div>

          <div className="flex md:flex-row flex-col justify-end gap-2">

            {/* Community Section */}
            <div className="space-y-2 md:w-[60%] w-full md:mb-0 mb-2">
              <h3 className="text-sm font-semibold text-foreground text-background">Community</h3>
              <div className="space-y-2">
                <p className="text-sm text-background">
                  This project is built by and for the community. 
                  All submissions are anonymous and help create safer walking experiences for everyone.
                </p>
                <p className="text-xs text-background">
                  Free and open source software. No tracking, no ads, no profit.
                </p>
              </div>
            </div>

            {/* Links Section */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground text-background">Resources</h3>
              <div className="space-y-2">
                <a href="https://github.com/your-repo/safepath-melbourne#privacy-policy" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm hover:text-white transition-colors text-background">
                  <FileText className="h-4 w-4" />
                  Privacy Policy
                </a>
                <a href="https://github.com/your-repo/safepath-melbourne#contributing" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm hover:text-white transition-colors text-background">
                  <Github className="h-4 w-4" />
                  Contribution Guidelines
                </a>
                <a href="https://github.com/your-repo/safepath-melbourne" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm hover:text-white transition-colors text-background">
                  <Github className="h-4 w-4" />
                  Contribute on Github
                </a>
              </div>
            </div>
          </div>
        </div>
          
        {/* Bottom Bar */}
        <div className="mt-8 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-background">
            © 2024 Safer Path. Open source project licensed under MIT.
          </p>
          <div className="flex items-center gap-4 text-xs text-background">
            <span>Made with ❤️ for the community</span>
          </div>
        </div>
      </div>
    </footer>;
};
export default Footer;