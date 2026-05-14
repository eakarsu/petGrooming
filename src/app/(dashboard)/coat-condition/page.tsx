'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Camera, Upload, AlertCircle, CheckCircle, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function CoatConditionPage() {
  const [imageBase64, setImageBase64] = useState<string | null>(null)
  const [imageName, setImageName] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 6 * 1024 * 1024) {
      toast.error('Image must be under 6MB')
      return
    }
    const reader = new FileReader()
    reader.onload = (ev) => {
      const data = ev.target?.result as string
      setImageBase64(data)
      setImageName(file.name)
      setResult(null)
      setError(null)
    }
    reader.readAsDataURL(file)
  }

  const submit = async () => {
    if (!imageBase64) {
      toast.error('Please upload an image first')
      return
    }
    setLoading(true)
    setResult(null)
    setError(null)
    try {
      const res = await fetch('/api/ai/coat-condition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageBase64 }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || data.message || 'Request failed')
      }
      setResult(data)
      toast.success('Coat assessment complete')
    } catch (err: any) {
      setError(err.message || 'Request failed')
      toast.error(err.message || 'Request failed')
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setImageBase64(null)
    setImageName('')
    setResult(null)
    setError(null)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Camera className="h-6 w-6 text-primary" /> Coat Condition Assessment
        </h1>
        <p className="text-sm text-muted-foreground">
          Upload a clear photo of the pet&apos;s coat for an AI-powered condition assessment.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Upload Photo</CardTitle>
            <CardDescription>
              JPG or PNG, well-lit, full coat visible. Sent as base64 to /api/ai/coat-condition.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-muted rounded-lg p-8 cursor-pointer hover:border-primary transition-colors">
              <Upload className="h-8 w-8 text-muted-foreground mb-2" />
              <span className="text-sm font-medium">Click to upload</span>
              <span className="text-xs text-muted-foreground">PNG or JPG, max 6 MB</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
            </label>

            {imageBase64 && (
              <div className="space-y-3">
                <div className="text-xs text-muted-foreground truncate">{imageName}</div>
                <img
                  src={imageBase64}
                  alt="Pet coat"
                  className="rounded-lg border max-h-[260px] object-cover w-full"
                />
                <div className="flex gap-2">
                  <Button onClick={submit} disabled={loading}>
                    {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                    {loading ? 'Assessing...' : 'Assess Coat'}
                  </Button>
                  <Button variant="outline" onClick={reset} disabled={loading}>
                    Reset
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Assessment Result</CardTitle>
            <CardDescription>Structured findings from the model.</CardDescription>
          </CardHeader>
          <CardContent>
            {!result && !error && !loading && (
              <p className="text-sm text-muted-foreground">No assessment yet. Upload an image and click Assess Coat.</p>
            )}
            {loading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Analyzing coat...
              </div>
            )}
            {error && (
              <div className="flex items-start gap-2 text-sm text-red-600">
                <AlertCircle className="h-4 w-4 mt-0.5" />
                <div>{error}</div>
              </div>
            )}
            {result && (
              <div className="space-y-3 text-sm">
                {result.condition && (
                  <div>
                    <div className="text-xs uppercase text-muted-foreground">Condition</div>
                    <Badge>{String(result.condition)}</Badge>
                  </div>
                )}
                {result.coatType && (
                  <div>
                    <div className="text-xs uppercase text-muted-foreground">Coat Type</div>
                    <div>{String(result.coatType)}</div>
                  </div>
                )}
                {Array.isArray(result.issues) && result.issues.length > 0 && (
                  <div>
                    <div className="text-xs uppercase text-muted-foreground">Issues</div>
                    <ul className="list-disc list-inside">
                      {result.issues.map((it: any, i: number) => (
                        <li key={i}>{typeof it === 'string' ? it : JSON.stringify(it)}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {Array.isArray(result.recommendations) && result.recommendations.length > 0 && (
                  <div>
                    <div className="text-xs uppercase text-muted-foreground">Recommendations</div>
                    <ul className="list-disc list-inside">
                      {result.recommendations.map((it: any, i: number) => (
                        <li key={i}>{typeof it === 'string' ? it : JSON.stringify(it)}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <details className="mt-3">
                  <summary className="cursor-pointer text-xs text-muted-foreground">Show full JSON</summary>
                  <pre className="mt-2 bg-muted p-3 rounded text-xs whitespace-pre-wrap overflow-auto max-h-[300px]">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </details>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
