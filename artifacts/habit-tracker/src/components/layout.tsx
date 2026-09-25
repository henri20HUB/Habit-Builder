import { Link, useLocation } from "wouter";
import { 
  Home, 
  ListTodo, 
  BarChart2, 
  Menu
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useState } from "react";

const navItems = [
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/habits", label: "Habits", icon: ListTodo },
  { href: "/stats", label: "Statistics", icon: BarChart2 },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const NavLinks = () => (
    <nav className="space-y-1 mt-8">
      {navItems.map((item) => {
        const isActive = location === item.href;
        return (
          <Link key={item.href} href={item.href} onClick={() => setIsOpen(false)}>
            <div
              className={`flex items-center gap-3 px-4 py-2.5 rounded-md transition-colors cursor-pointer ${
                isActive
                  ? "bg-primary text-primary-foreground font-medium"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </div>
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="flex min-h-[100dvh] bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r border-border bg-card px-4 py-6">
        <div className="flex items-center gap-2 px-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold">
            H
          </div>
          <span className="text-xl font-bold tracking-tight">HabitSpace</span>
        </div>
        <NavLinks />
      </aside>

      {/* Mobile Nav */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 border-b border-border bg-card z-50 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold">
            H
          </div>
          <span className="text-xl font-bold tracking-tight">HabitSpace</span>
        </div>
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-4">
            <div className="flex items-center gap-2 px-2 py-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold">
                H
              </div>
              <span className="text-xl font-bold tracking-tight">HabitSpace</span>
            </div>
            <NavLinks />
          </SheetContent>
        </Sheet>
      </div>

      {/* Main Content */}
      <main className="flex-1 md:p-8 p-4 pt-20 md:pt-8 overflow-y-auto max-w-5xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
}
