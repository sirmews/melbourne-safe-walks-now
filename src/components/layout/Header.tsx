
import { Shield, MapPin } from 'lucide-react';

export const Header = () => {
  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-2">
            <Shield className="h-8 w-8 text-blue-600" />
            <MapPin className="h-8 w-8 text-green-600" />
            <h1 className="text-xl font-bold text-gray-900">SafePath Melbourne</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">Anonymous Community Safety</span>
          </div>
        </div>
      </div>
    </header>
  );
};
