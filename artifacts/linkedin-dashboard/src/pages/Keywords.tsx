import { useState } from "react"
import { useKeywords, useCreateKeyword, useDeleteKeyword } from "@/hooks/use-keywords"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Hash, Plus, Trash2, Search } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

export default function Keywords() {
  const { data, isLoading } = useKeywords();
  const addKeyword = useCreateKeyword();
  const removeKeyword = useDeleteKeyword();
  
  const [newKeyword, setNewKeyword] = useState("");
  const [search, setSearch] = useState("");

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyword.trim()) return;
    addKeyword.mutate({ data: { keyword: newKeyword } }, {
      onSuccess: () => setNewKeyword("")
    });
  };

  const filteredKeywords = data?.keywords.filter(k => 
    k.keyword.toLowerCase().includes(search.toLowerCase())
  ) || [];

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 font-display">Target Keywords</h1>
        <p className="text-muted-foreground">Manage the phrases the agent uses to find matching LinkedIn posts.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <Card className="md:col-span-1 h-fit">
          <CardHeader>
            <CardTitle>Add Keyword</CardTitle>
            <CardDescription>Add a new search phrase.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="space-y-2">
                <Input 
                  placeholder="e.g. 'hiring react developer'" 
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                />
              </div>
              <Button 
                type="submit" 
                className="w-full" 
                disabled={!newKeyword.trim()} 
                isLoading={addKeyword.isPending}
              >
                <Plus className="w-4 h-4 mr-2" /> Add Keyword
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6">
            <div>
              <CardTitle>Active Tracker</CardTitle>
              <CardDescription>{data?.keywords.length || 0} total keywords</CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search list..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-black/40"
              />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex gap-2 flex-wrap">
                {[1,2,3,4,5].map(i => <div key={i} className="h-10 w-32 bg-white/5 animate-pulse rounded-full" />)}
              </div>
            ) : (
              <div className="flex flex-wrap gap-3">
                <AnimatePresence>
                  {filteredKeywords.map((kw) => (
                    <motion.div
                      key={kw.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      layout
                      className="group flex items-center gap-2 px-4 py-2 bg-secondary border border-white/10 rounded-full hover:bg-secondary/80 hover:border-white/20 transition-all shadow-sm"
                    >
                      <Hash className="w-3.5 h-3.5 text-primary" />
                      <span className="text-sm font-medium text-white">{kw.keyword}</span>
                      <button
                        onClick={() => removeKeyword.mutate({ id: kw.id })}
                        disabled={removeKeyword.isPending}
                        className="ml-1 p-1 rounded-full text-muted-foreground hover:bg-destructive/20 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </motion.div>
                  ))}
                  {filteredKeywords.length === 0 && (
                    <div className="w-full py-12 text-center text-muted-foreground border-2 border-dashed border-white/5 rounded-2xl">
                      No keywords found. Add some to get started.
                    </div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
