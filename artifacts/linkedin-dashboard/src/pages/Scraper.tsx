import { useState } from "react"
import { useScraperRuns, useStartScraperRun, useScraperStatus } from "@/hooks/use-scraper"
import { useKeywords } from "@/hooks/use-keywords"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Play, ActivitySquare, AlertCircle, CheckCircle2, Clock } from "lucide-react"
import { formatRelativeTime } from "@/lib/utils"

export default function Scraper() {
  const { data: runs, isLoading } = useScraperRuns();
  const { data: keywordsData } = useKeywords();
  const startRun = useStartScraperRun();
  
  const [maxResults, setMaxResults] = useState("50");
  const [scrapeType, setScrapeType] = useState<"posts" | "jobs" | "both">("both");

  // If there's a recent run, optionally poll its status
  const activeRunId = runs?.runs.find(r => r.status === 'running' || r.status === 'pending')?.runId;
  const { data: activeStatus } = useScraperStatus(activeRunId || "");

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    startRun.mutate({
      data: {
        maxResults: parseInt(maxResults),
        scrapeType,
        // empty keywords array uses saved ones automatically backend-side
      }
    });
  };

  const hasKeywords = (keywordsData?.keywords.length || 0) > 0;

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 font-display">Scraper Engine</h1>
        <p className="text-muted-foreground">Trigger manual extractions and monitor agent pipelines.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-primary/20 shadow-primary/5">
            <CardHeader>
              <CardTitle>Trigger Extraction</CardTitle>
              <CardDescription>Launch Apify actors and OpenAI parser</CardDescription>
            </CardHeader>
            <CardContent>
              {!hasKeywords ? (
                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-200">You must add at least one target keyword before starting a run.</p>
                </div>
              ) : (
                <form onSubmit={handleStart} className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white">Target Types</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(["posts", "jobs", "both"] as const).map(type => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setScrapeType(type)}
                          className={`py-2 text-sm rounded-lg border transition-all ${
                            scrapeType === type 
                              ? "bg-primary text-white border-primary" 
                              : "bg-black/20 text-muted-foreground border-white/10 hover:border-white/30"
                          }`}
                        >
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white">Max Results (per keyword)</label>
                    <Input 
                      type="number" 
                      min="1" 
                      max="500" 
                      value={maxResults}
                      onChange={(e) => setMaxResults(e.target.value)}
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full py-6 text-lg shadow-primary/30" 
                    isLoading={startRun.isPending || activeStatus?.status === 'running' || activeStatus?.status === 'pending'}
                  >
                    <Play className="w-5 h-5 mr-2" /> Initiate Engine
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>

          {activeStatus && (activeStatus.status === 'running' || activeStatus.status === 'pending') && (
            <Card className="border-blue-500/30 bg-blue-900/10 animate-pulse">
              <CardContent className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-blue-400 flex items-center">
                    <ActivitySquare className="w-4 h-4 mr-2" /> Active Pipeline
                  </h3>
                  <Badge variant="default" className="animate-pulse">{activeStatus.status}</Badge>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>Records Fetched</span>
                      <span>{activeStatus.totalFetched}</span>
                    </div>
                    <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 w-[100%] animate-[shimmer_2s_infinite] bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.3),transparent)]" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2 border-t border-white/5">
                    <div>
                      <p className="text-xs text-muted-foreground">Processed</p>
                      <p className="text-xl font-semibold text-white">{activeStatus.totalProcessed}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Duplicates</p>
                      <p className="text-xl font-semibold text-amber-400">{activeStatus.totalDuplicates}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Execution History</CardTitle>
              <CardDescription>Log of past runs and sync status.</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[1,2,3].map(i => <div key={i} className="h-20 bg-white/5 rounded-xl animate-pulse" />)}
                </div>
              ) : (
                <div className="space-y-4">
                  {runs?.runs.map((run) => (
                    <div key={run.runId} className="group p-4 bg-secondary/50 rounded-xl border border-white/5 hover:bg-secondary transition-colors">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-xs text-muted-foreground bg-black/40 px-2 py-1 rounded">
                              {run.runId.split('-')[0]}
                            </span>
                            <Badge variant={
                              run.status === 'completed' ? 'success' : 
                              run.status === 'failed' ? 'destructive' : 'default'
                            }>
                              {run.status}
                            </Badge>
                            {run.status === 'completed' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                          </div>
                          <div className="text-sm text-muted-foreground line-clamp-1 max-w-md">
                            Keywords: {run.keywords.join(", ")}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-6 sm:text-right">
                          <div>
                            <p className="text-xs text-muted-foreground">Processed</p>
                            <p className="text-sm font-semibold text-white">{run.totalProcessed}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Duration</p>
                            <p className="text-sm font-medium text-white flex items-center">
                              <Clock className="w-3 h-3 mr-1" />
                              {run.completedAt ? 'Finished' : 'Running'}
                            </p>
                          </div>
                          <div className="hidden sm:block">
                            <p className="text-xs text-muted-foreground">Started</p>
                            <p className="text-sm text-white">{formatRelativeTime(run.startedAt)}</p>
                          </div>
                        </div>
                      </div>
                      {run.errorMessage && (
                        <div className="mt-3 p-2 bg-destructive/10 border border-destructive/20 rounded text-xs text-red-400">
                          Error: {run.errorMessage}
                        </div>
                      )}
                    </div>
                  ))}
                  {runs?.runs.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">No scraper runs executed yet.</div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
