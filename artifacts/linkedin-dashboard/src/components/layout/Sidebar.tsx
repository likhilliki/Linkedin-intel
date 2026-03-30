import { Link, useLocation } from "wouter"
import { cn } from "@/lib/utils"
import { 
  LayoutDashboard, 
  Hash, 
  ActivitySquare, 
  Briefcase, 
  Settings,
  BrainCircuit
} from "lucide-react"

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/keywords", label: "Keywords", icon: Hash },
  { href: "/scraper", label: "Scraper Runs", icon: ActivitySquare },
  { href: "/jobs", label: "Job Records", icon: Briefcase },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const [location] = useLocation();

  return (
    <div className="w-72 hidden md:flex flex-col bg-card/30 backdrop-blur-xl border-r border-white/5 h-screen sticky top-0">
      <div className="p-8 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-cyan-500 flex items-center justify-center shadow-lg shadow-primary/20">
          <BrainCircuit className="text-white w-6 h-6" />
        </div>
        <div>
          <h1 className="font-display font-bold text-xl text-white tracking-tight">LinkedIn Intel</h1>
          <p className="text-[10px] uppercase tracking-wider text-primary font-semibold">Agent Dashboard</p>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-2 mt-4">
        {NAV_ITEMS.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href} className="block">
              <div className={cn(
                "flex items-center gap-3 px-4 py-3.5 rounded-xl font-medium transition-all duration-300 group cursor-pointer",
                isActive 
                  ? "bg-primary/10 text-primary border border-primary/20 shadow-inner" 
                  : "text-muted-foreground hover:bg-white/5 hover:text-white border border-transparent"
              )}>
                <item.icon className={cn(
                  "w-5 h-5 transition-transform duration-300", 
                  isActive ? "scale-110" : "group-hover:scale-110"
                )} />
                {item.label}
              </div>
            </Link>
          )
        })}
      </nav>

      <div className="p-6 m-4 rounded-xl bg-gradient-to-b from-white/5 to-transparent border border-white/5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-sm font-medium text-white">System Online</span>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Qdrant semantic engine is active. Sheet sync configured.
        </p>
      </div>
    </div>
  )
}
