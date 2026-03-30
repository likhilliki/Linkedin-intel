import { useState } from "react"
import { useJobs } from "@/hooks/use-jobs"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Modal } from "@/components/ui/modal"
import { Search, MapPin, Building, ExternalLink, Calendar, Mail, Phone, Code2 } from "lucide-react"

export default function Jobs() {
  const [keyword, setKeyword] = useState("");
  const [company, setCompany] = useState("");
  const [selectedJob, setSelectedJob] = useState<any | null>(null);
  
  // Minimal debouncing logic omitted for brevity, passing raw input directly for simplicity
  const { data, isLoading } = useJobs({ limit: 50, keyword, company });

  const getHiringIntentBadge = (intent?: string | null) => {
    if (!intent) return null;
    const lIntent = intent.toLowerCase();
    if (lIntent.includes('urgent') || lIntent.includes('actively')) return <Badge variant="success">{intent}</Badge>;
    if (lIntent.includes('intern')) return <Badge variant="default">{intent}</Badge>;
    return <Badge variant="secondary">{intent}</Badge>;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto h-[calc(100vh-8rem)] flex flex-col">
      <div>
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 font-display">Intelligence Records</h1>
        <p className="text-muted-foreground">Browse and filter structured data parsed from LinkedIn.</p>
      </div>

      <div className="flex gap-4 mb-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Filter by keyword matched..." 
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="relative w-full max-w-sm">
          <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Filter by company..." 
            value={company}
            onChange={e => setCompany(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-white/[0.02] border-b border-white/5 sticky top-0 backdrop-blur-md z-10">
              <tr>
                <th className="px-6 py-4 font-semibold">Role & Company</th>
                <th className="px-6 py-4 font-semibold hidden md:table-cell">Location</th>
                <th className="px-6 py-4 font-semibold hidden lg:table-cell">Primary Skills</th>
                <th className="px-6 py-4 font-semibold hidden sm:table-cell">Intent</th>
                <th className="px-6 py-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={5} className="px-6 py-4">
                      <div className="h-10 bg-white/5 rounded animate-pulse w-full"></div>
                    </td>
                  </tr>
                ))
              ) : data?.jobs.map((job) => (
                <tr 
                  key={job.id} 
                  onClick={() => setSelectedJob(job)}
                  className="hover:bg-white/[0.02] transition-colors cursor-pointer group"
                >
                  <td className="px-6 py-4">
                    <div className="font-semibold text-white group-hover:text-primary transition-colors">
                      {job.role || "Unspecified Role"}
                    </div>
                    <div className="text-muted-foreground mt-0.5 flex items-center">
                      <Building className="w-3 h-3 mr-1" />
                      {job.companyName || "Unknown Company"}
                    </div>
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell text-muted-foreground">
                    <div className="flex items-center">
                      <MapPin className="w-3.5 h-3.5 mr-1.5 opacity-70" />
                      {job.location || "Anywhere"}
                    </div>
                  </td>
                  <td className="px-6 py-4 hidden lg:table-cell">
                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                      {job.primarySkills ? job.primarySkills.split(',').slice(0, 2).map((skill, i) => (
                        <span key={i} className="text-[10px] bg-secondary px-2 py-0.5 rounded text-white truncate max-w-[100px]">{skill.trim()}</span>
                      )) : <span className="text-muted-foreground text-xs">None listed</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4 hidden sm:table-cell">
                    {getHiringIntentBadge(job.hiringIntent)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-primary hover:text-blue-400 text-sm font-medium">View Details</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {data?.jobs.length === 0 && (
             <div className="text-center py-20 text-muted-foreground w-full">
               No records found matching filters.
             </div>
          )}
        </div>
      </Card>

      <Modal 
        isOpen={!!selectedJob} 
        onClose={() => setSelectedJob(null)}
        title={selectedJob?.role || "Job Details"}
        description={selectedJob?.companyName || "Unknown Company"}
      >
        {selectedJob && (
          <div className="space-y-6">
            <div className="flex flex-wrap gap-3 mb-6 border-b border-white/10 pb-6">
              {selectedJob.location && (
                <div className="flex items-center text-sm bg-white/5 px-3 py-1.5 rounded-lg"><MapPin className="w-4 h-4 mr-2 text-primary" />{selectedJob.location}</div>
              )}
              {selectedJob.salaryPackage && (
                <div className="flex items-center text-sm bg-white/5 px-3 py-1.5 rounded-lg"><span className="font-bold text-emerald-400 mr-2">$</span>{selectedJob.salaryPackage}</div>
              )}
              {selectedJob.datePosted && (
                <div className="flex items-center text-sm bg-white/5 px-3 py-1.5 rounded-lg"><Calendar className="w-4 h-4 mr-2 text-primary" />{selectedJob.datePosted}</div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center">
                    <Code2 className="w-4 h-4 mr-2" /> Requirements
                  </h4>
                  <div className="bg-black/20 p-4 rounded-xl space-y-3 border border-white/5">
                    <div>
                      <span className="text-xs text-muted-foreground block mb-1">Primary Skills</span>
                      <p className="text-sm text-white">{selectedJob.primarySkills || "N/A"}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground block mb-1">Secondary Skills</span>
                      <p className="text-sm text-white">{selectedJob.secondarySkills || "N/A"}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground block mb-1">Must Have</span>
                      <p className="text-sm text-amber-200">{selectedJob.mustToHave || "N/A"}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground block mb-1">Experience</span>
                      <p className="text-sm text-white">{selectedJob.yearsOfExperience || "N/A"}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center">
                    <Mail className="w-4 h-4 mr-2" /> Contact & Source
                  </h4>
                  <div className="bg-black/20 p-4 rounded-xl space-y-3 border border-white/5">
                    {selectedJob.authorName && (
                      <div>
                        <span className="text-xs text-muted-foreground block mb-1">Posted By</span>
                        <p className="text-sm text-white">{selectedJob.authorName}</p>
                      </div>
                    )}
                    {selectedJob.email && (
                      <div className="flex items-center text-sm text-white">
                        <Mail className="w-4 h-4 mr-2 text-primary" /> {selectedJob.email}
                      </div>
                    )}
                    {selectedJob.phone && (
                      <div className="flex items-center text-sm text-white">
                        <Phone className="w-4 h-4 mr-2 text-primary" /> {selectedJob.phone}
                      </div>
                    )}
                    {selectedJob.postUrl && (
                      <div className="pt-2">
                        <a href={selectedJob.postUrl} target="_blank" rel="noreferrer" className="inline-flex items-center text-sm text-primary hover:text-blue-400 font-medium">
                          View Original Post <ExternalLink className="w-3.5 h-3.5 ml-1" />
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {selectedJob.rawText && (
              <div className="mt-6 pt-6 border-t border-white/10">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Original Text snippet</h4>
                <div className="bg-black/40 p-4 rounded-xl text-xs text-muted-foreground font-mono whitespace-pre-wrap max-h-40 overflow-y-auto border border-white/5">
                  {selectedJob.rawText}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
