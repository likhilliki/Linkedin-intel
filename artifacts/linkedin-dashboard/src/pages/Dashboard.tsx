import { useJobStats, useJobs } from "@/hooks/use-jobs"
import { useKeywords } from "@/hooks/use-keywords"
import { useScraperRuns, useStartScraperRun } from "@/hooks/use-scraper"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ActivitySquare, Briefcase, ExternalLink, Hash, Play, TrendingUp, Users } from "lucide-react"
import { cn, formatRelativeTime } from "@/lib/utils"
import { Link } from "wouter"
import { ResponsiveContainer, AreaChart, Area } from "recharts"

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useJobStats();
  const { data: keywordsData } = useKeywords();
  const { data: runsData } = useScraperRuns({ limit: 5 });
  const { data: recentJobsData } = useJobs({ limit: 5 });
  const startRun = useStartScraperRun();

  const handleQuickRun = () => {
    startRun.mutate({ data: { scrapeType: "both", maxResults: 50 } });
  };

  // Mock data for the tiny chart
  const chartData = [
    { name: 'Mon', total: 12 }, { name: 'Tue', total: 25 }, 
    { name: 'Wed', total: 45 }, { name: 'Thu', total: 30 },
    { name: 'Fri', total: 65 }, { name: 'Sat', total: 80 }, { name: 'Sun', total: stats?.jobsLast7d || 95 }
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 font-display">Overview</h1>
          <p className="text-muted-foreground">Monitor extraction activity and parsed intelligence.</p>
        </div>
        <Button size="lg" onClick={handleQuickRun} isLoading={startRun.isPending} className="w-full sm:w-auto">
          <Play className="w-5 h-5 mr-2" />
          Quick Scrape
        </Button>
      </div>

      {/* STATS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-card to-card/50">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Total Jobs Parsed</p>
                <h3 className="text-3xl font-bold text-white">{statsLoading ? "-" : stats?.totalJobs}</h3>
              </div>
              <div className="p-3 rounded-xl bg-primary/10 text-primary">
                <Briefcase className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 text-sm text-emerald-400 flex items-center">
              <TrendingUp className="w-4 h-4 mr-1" />
              <span>+{stats?.jobsLast7d} this week</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Recent Runs</p>
                <h3 className="text-3xl font-bold text-white">{statsLoading ? "-" : stats?.totalRuns}</h3>
              </div>
              <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400">
                <ActivitySquare className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 h-[24px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="total" stroke="#a855f7" strokeWidth={2} fillOpacity={1} fill="url(#colorTotal)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Active Keywords</p>
                <h3 className="text-3xl font-bold text-white">{keywordsData?.keywords.length || 0}</h3>
              </div>
              <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400">
                <Hash className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-1">
              {keywordsData?.keywords.slice(0, 3).map(k => (
                <span key={k.id} className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-muted-foreground">{k.keyword}</span>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Top Hiring Companies</p>
                <h3 className="text-xl font-bold text-white truncate max-w-[150px]">
                  {stats?.topCompanies[0]?.company || "N/A"}
                </h3>
              </div>
              <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 text-sm text-muted-foreground flex items-center">
              <span>{stats?.topCompanies[0]?.count || 0} recent postings</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="space-y-1">
                <CardTitle>Recent Job Extractions</CardTitle>
                <CardDescription>Latest parsed records from Qdrant.</CardDescription>
              </div>
              <Link href="/jobs" className="text-sm text-primary hover:underline">View All</Link>
            </CardHeader>
            <CardContent>
              {recentJobsData?.jobs && recentJobsData.jobs.length > 0 ? (
                <div className="space-y-3 mt-4">
                  {recentJobsData.jobs.map((job) => {
                    const title = job.role || job.rawText?.slice(0, 60) || "LinkedIn Post";
                    const company = job.companyName || job.authorName || "Unknown";
                    const badge = job.hiringIntent || job.keywordMatched || "scraped";
                    return (
                      <div key={job.id} className="flex items-start justify-between gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors group">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-white truncate">{title}</p>
                          <p className="text-sm text-muted-foreground truncate">{company} {job.location ? `· ${job.location}` : ""}</p>
                          {job.primarySkills && (
                            <p className="text-xs text-primary/80 mt-1 truncate">{job.primarySkills}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge variant="outline" className="text-xs border-white/10 text-muted-foreground capitalize">{badge}</Badge>
                          {job.postUrl && (
                            <a href={job.postUrl} target="_blank" rel="noopener noreferrer" className="opacity-0 group-hover:opacity-100 transition-opacity">
                              <ExternalLink className="w-3.5 h-3.5 text-muted-foreground hover:text-white" />
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  {statsLoading ? "Loading..." : "No records yet. Run a scrape to start collecting data."}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Agent Activity</CardTitle>
              <CardDescription>Latest scraper runs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-white/10 before:to-transparent">
                {runsData?.runs.slice(0, 4).map((run, i) => (
                  <div key={run.runId} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-card bg-secondary text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                      <div className={cn(
                        "w-2.5 h-2.5 rounded-full",
                        run.status === 'completed' ? 'bg-emerald-400' :
                        run.status === 'failed' ? 'bg-destructive' : 'bg-primary animate-pulse'
                      )} />
                    </div>
                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl bg-white/5 border border-white/5 shadow-sm">
                      <div className="flex items-center justify-between mb-1">
                        <Badge variant={
                          run.status === 'completed' ? 'success' : 
                          run.status === 'failed' ? 'destructive' : 'default'
                        }>
                          {run.status}
                        </Badge>
                        <time className="text-xs text-muted-foreground">{formatRelativeTime(run.startedAt)}</time>
                      </div>
                      <div className="text-sm font-medium text-white">{run.totalProcessed} processed</div>
                      <div className="text-xs text-muted-foreground mt-1 truncate">
                        {run.keywords.join(", ")}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
