import { Clapperboard } from 'lucide-react';

export function Header() {
  return (
    <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Clapperboard className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">
              VoiceOver Studio
            </h1>
          </div>
        </div>
      </div>
    </header>
  );
}
