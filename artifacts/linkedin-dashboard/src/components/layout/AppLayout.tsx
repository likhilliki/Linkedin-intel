import { Sidebar } from "./Sidebar"
import { Menu } from "lucide-react"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Link, useLocation } from "wouter"

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [location] = useLocation();

  const NAV_ITEMS = [
    { href: "/", label: "Dashboard" },
    { href: "/keywords", label: "Keywords" },
    { href: "/scraper", label: "Scraper Runs" },
    { href: "/jobs", label: "Job Records" },
    { href: "/settings", label: "Settings" },
  ];

  return (
    <div className="flex min-h-screen bg-background relative overflow-hidden">
      {/* Background Mesh */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-20">
        <img 
          src={`${import.meta.env.BASE_URL}images/hero-mesh.png`}
          alt="Background Mesh"
          className="w-full h-full object-cover mix-blend-screen"
        />
      </div>

      <Sidebar />
      
      <div className="flex-1 flex flex-col relative z-10 max-h-screen overflow-y-auto">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between p-4 border-b border-white/5 bg-background/80 backdrop-blur-md sticky top-0 z-20">
          <h1 className="font-display font-bold text-lg text-white">LinkedIn Intel</h1>
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 text-white/70 hover:text-white"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden bg-card/95 backdrop-blur-xl border-b border-white/5 overflow-hidden z-20 absolute w-full top-[65px]"
            >
              <nav className="flex flex-col p-4 space-y-2">
                {NAV_ITEMS.map(item => (
                  <Link key={item.href} href={item.href} className="block">
                    <div 
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`p-4 rounded-xl font-medium ${location === item.href ? 'bg-primary/20 text-primary' : 'text-muted-foreground'}`}
                    >
                      {item.label}
                    </div>
                  </Link>
                ))}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content Area */}
        <main className="flex-1 p-4 md:p-8 lg:p-12 w-full max-w-7xl mx-auto">
          <motion.div
            key={location}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  )
}
