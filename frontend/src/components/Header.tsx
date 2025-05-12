import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { Button } from './ui/button';
import { Menubar, MenubarContent, MenubarItem, MenubarMenu, MenubarTrigger } from './ui/menubar';

export function Header() {
  const { theme, setTheme } = useTheme();

  return (
    <Menubar className="border-b border-white/10 px-6 py-4 bg-black">
      <div className="flex w-full items-center justify-between max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold tracking-tight text-white">Comp4 Tool</h1>
        
        <MenubarMenu>
          <MenubarTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Toggle theme">
              {theme === 'dark' ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>
          </MenubarTrigger>
          <MenubarContent align="end">
            <MenubarItem onClick={() => setTheme('light')}>Light</MenubarItem>
            <MenubarItem onClick={() => setTheme('dark')}>Dark</MenubarItem>
            <MenubarItem onClick={() => setTheme('system')}>System</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </div>
    </Menubar>
  );
}
