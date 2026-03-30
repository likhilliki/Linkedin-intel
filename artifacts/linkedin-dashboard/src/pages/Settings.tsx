import { useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Database, FileSpreadsheet, Bot, KeySquare, CheckCircle2, AlertTriangle, Copy, ExternalLink } from "lucide-react"

interface SettingsData {
  serviceAccountEmail: string | null
  qdrantUrl: string | null
  apifyConfigured: boolean
  openaiConfigured: boolean
  sheetId: string | null
  sheetUrl: string | null
}

function useSettings() {
  return useQuery<SettingsData>({
    queryKey: ["settings"],
    queryFn: async () => {
      const res = await fetch("/api/settings")
      if (!res.ok) throw new Error("Failed to fetch settings")
      return res.json()
    },
    staleTime: 60000,
  })
}

export default function Settings() {
  const { data: settings, isLoading } = useSettings()

  const integrations = [
    {
      name: "Qdrant Vector DB",
      description: settings?.qdrantUrl
        ? `Connected to ${settings.qdrantUrl.replace(/^https?:\/\//, "").split(":")[0]}`
        : "Semantic search and deduplication engine.",
      icon: Database,
      configured: !!settings?.qdrantUrl,
      color: "text-purple-400",
      bg: "bg-purple-500/10",
    },
    {
      name: "Google Sheets",
      description: settings?.sheetId
        ? `Sheet ID: ${settings.sheetId.slice(0, 12)}...`
        : "Not configured — GOOGLE_SHEET_ID missing.",
      icon: FileSpreadsheet,
      configured: !!settings?.sheetId,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      href: settings?.sheetUrl,
    },
    {
      name: "Apify Scrapers",
      description: settings?.apifyConfigured
        ? "LinkedIn post and job extraction actors ready."
        : "Not configured — APIFY_API_KEY missing.",
      icon: Bot,
      configured: !!settings?.apifyConfigured,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
    },
    {
      name: "OpenAI",
      description: settings?.openaiConfigured
        ? "GPT-4o-mini parser and text-embedding-3-small ready."
        : "Not configured — OPENAI_API_KEY missing.",
      icon: KeySquare,
      configured: !!settings?.openaiConfigured,
      color: "text-rose-400",
      bg: "bg-rose-500/10",
    },
  ]

  const sheetsNotShared = settings?.serviceAccountEmail && settings?.sheetId

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 font-display">System Settings</h1>
        <p className="text-muted-foreground">Manage agent integrations and environment configurations.</p>
      </div>

      {/* Google Sheets Permission Banner */}
      {!isLoading && sheetsNotShared && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-amber-300 mb-1">Action Required: Share your Google Sheet</h3>
              <p className="text-sm text-amber-200/80 mb-3">
                The scraper can't write to your Google Sheet because it hasn't been shared with the service account. 
                Open your Google Sheet → click <strong>Share</strong> → add the email below as an <strong>Editor</strong>.
              </p>
              <div className="flex items-center gap-2 bg-black/30 rounded-lg px-3 py-2 font-mono text-sm text-white border border-amber-500/20 w-fit max-w-full">
                <span className="truncate">{settings.serviceAccountEmail}</span>
                <button
                  onClick={() => navigator.clipboard.writeText(settings.serviceAccountEmail!)}
                  className="shrink-0 text-amber-400 hover:text-amber-300 transition-colors"
                  title="Copy to clipboard"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
              {settings.sheetUrl && (
                <a
                  href={settings.sheetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1.5 text-sm text-amber-300 hover:text-amber-200 underline underline-offset-2"
                >
                  Open Google Sheet <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
        </div>
      )}

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
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-white">{integration.name}</h3>
                      {"href" in integration && integration.href && (
                        <a href={integration.href} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-3 h-3 text-muted-foreground hover:text-white" />
                        </a>
                      )}
                    </div>
                    {isLoading ? (
                      <div className="w-16 h-5 bg-white/10 animate-pulse rounded-full" />
                    ) : integration.configured ? (
                      <Badge className="bg-emerald-500/10 text-emerald-400 border-0 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Connected
                      </Badge>
                    ) : (
                      <Badge className="bg-red-500/10 text-red-400 border-0 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        Missing
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{isLoading ? "Loading..." : integration.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Service Account Info */}
      {settings?.serviceAccountEmail && (
        <Card>
          <CardHeader>
            <CardTitle>Google Service Account</CardTitle>
            <CardDescription>This is the identity used to write to Google Sheets.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 bg-white/[0.03] border border-white/10 rounded-lg px-4 py-3">
              <span className="font-mono text-sm text-white/90 flex-1 truncate">{settings.serviceAccountEmail}</span>
              <button
                onClick={() => navigator.clipboard.writeText(settings.serviceAccountEmail!)}
                className="shrink-0 text-muted-foreground hover:text-white transition-colors"
                title="Copy email"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              This email must have <strong>Editor</strong> access to your Google Sheet for the scraper to write data.
            </p>
          </CardContent>
        </Card>
      )}

      <Card className="border-red-500/20">
        <CardHeader>
          <CardTitle className="text-red-400">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Clearing the vector database will remove all deduplication memory. The agent will process previously seen posts as new records.
          </p>
          <button disabled className="px-4 py-2 rounded-lg bg-red-500/10 text-red-500 border border-red-500/20 text-sm font-medium opacity-50 cursor-not-allowed">
            Purge Vector Database
          </button>
        </CardContent>
      </Card>
    </div>
  )
}
