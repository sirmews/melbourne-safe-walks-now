
import { Shield, Route } from 'lucide-react';
import { ThemeToggle } from '@/components/theme/ThemeToggle';

export const Header = () => {
  return (
    <header className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Route className="h-8 w-8 text-primary" />
              <Shield className="h-4 w-4 text-primary absolute -top-1 -right-1" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Safer Path</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600 dark:text-gray-400">Anonymous</span>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
};
