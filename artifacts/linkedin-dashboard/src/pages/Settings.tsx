import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Database, FileSpreadsheet, Bot, KeySquare, CheckCircle2 } from "lucide-react"

export default function Settings() {
  const integrations = [
    {
      name: "Qdrant Vector DB",
      description: "Semantic search and duplication prevention engine.",
      icon: Database,
      status: "Connected",
      color: "text-purple-400",
      bg: "bg-purple-500/10"
    },
    {
      name: "Google Sheets",
      description: "Data export pipeline for parsed records.",
      icon: FileSpreadsheet,
      status: "Connected",
      color: "text-emerald-400",
      bg: "bg-emerald-500/10"
    },
    {
      name: "Apify Scrapers",
      description: "LinkedIn post and job extraction actors.",
      icon: Bot,
      status: "Connected",
      color: "text-blue-400",
      bg: "bg-blue-500/10"
    },
    {
      name: "OpenAI",
      description: "GPT-4o-mini parser and text embeddings.",
      icon: KeySquare,
      status: "Connected",
      color: "text-rose-400",
      bg: "bg-rose-500/10"
    }
  ]

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 font-display">System Settings</h1>
        <p className="text-muted-foreground">Manage agent integrations and environment configurations.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Integrations</CardTitle>
          <CardDescription>External services configured via Replit Secrets.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {integrations.map((integration, i) => (
              <div key={i} className="p-5 rounded-xl border border-white/5 bg-white/[0.02] flex items-start gap-4">
                <div className={`p-3 rounded-xl ${integration.bg} ${integration.color}`}>
                  <integration.icon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-semibold text-white">{integration.name}</h3>
                    <Badge variant="success" className="bg-emerald-500/10 text-emerald-400 border-0 flex items-center">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      {integration.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{integration.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-red-500/20">
        <CardHeader>
          <CardTitle className="text-red-400">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Clearing the vector database will remove deduplication memory. The agent will process previously seen posts as new.
          </p>
          <button disabled className="px-4 py-2 rounded-lg bg-red-500/10 text-red-500 border border-red-500/20 text-sm font-medium opacity-50 cursor-not-allowed">
            Purge Vector Database
          </button>
        </CardContent>
      </Card>
    </div>
  )
}
