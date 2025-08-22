
import { Route } from 'lucide-react';
import { ThemeToggle } from '@/components/theme/ThemeToggle';

export const Header = () => {
  return (
    <header className="bg-[#f8f3e7]">
        <div className="flex justify-between items-center h-16 w-full ml-8">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Route className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white font-playfair">Safer Path</h1>
          </div>
          
          {/* <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600 dark:text-gray-400">Anonymous</span>
            <ThemeToggle />
          </div> */}
        </div>
    </header>
  );
};
