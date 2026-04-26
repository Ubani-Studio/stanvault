'use client'

import { useState, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { Upload, FileText, CheckCircle, XCircle, Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ImportResult {
  success: boolean
  provider: string
  stats: {
    totalRows: number
    imported: number
    updated: number
    skipped: number
  }
  errors: string[]
  hasMoreErrors: boolean
}

interface EmailImportDropzoneProps {
  onImportComplete?: (result: ImportResult) => void
  className?: string
}

export function EmailImportDropzone({ onImportComplete, className }: EmailImportDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile?.name.toLowerCase().endsWith('.csv')) {
      setFile(droppedFile)
      setResult(null)
      setError(null)
    } else {
      setError('Please upload a CSV file')
    }
  }, [])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile?.name.toLowerCase().endsWith('.csv')) {
      setFile(selectedFile)
      setResult(null)
      setError(null)
    } else {
      setError('Please upload a CSV file')
    }
  }, [])

  const handleUpload = async () => {
    if (!file) return

    setIsUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/import/email', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Import failed')
      }

      setResult(data)
      onImportComplete?.(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed')
    } finally {
      setIsUploading(false)
    }
  }

  const reset = () => {
    setFile(null)
    setResult(null)
    setError(null)
  }

  // Show result state
  if (result) {
    return (
      <div className={cn('bg-[#0a0a0a] border border-[#1a1a1a] p-6', className)}>
        <div className="flex items-center gap-3 mb-4">
          {result.success ? (
            <CheckCircle className="w-8 h-8 text-status-success" />
          ) : (
            <AlertCircle className="w-8 h-8 text-status-error" />
          )}
          <div>
            <h3 className="text-lg font-semibold text-white">
              {result.success ? 'Import Complete' : 'Import Completed with Errors'}
            </h3>
            <p className="text-sm text-gray-500">
              Provider detected: {result.provider}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-black p-4 text-center">
            <p className="text-2xl font-mono font-bold text-white">
              {result.stats.totalRows}
            </p>
            <p className="text-sm text-gray-500">Total Rows</p>
          </div>
          <div className="bg-black p-4 text-center">
            <p className="text-2xl font-mono font-bold text-status-success">
              {result.stats.imported}
            </p>
            <p className="text-sm text-gray-500">Imported</p>
          </div>
          <div className="bg-black p-4 text-center">
            <p className="text-2xl font-mono font-bold text-accent">
              {result.stats.updated}
            </p>
            <p className="text-sm text-gray-500">Updated</p>
          </div>
          <div className="bg-black p-4 text-center">
            <p className="text-2xl font-mono font-bold text-gray-500">
              {result.stats.skipped}
            </p>
            <p className="text-sm text-gray-500">Skipped</p>
          </div>
        </div>

        {result.errors.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-medium text-status-error mb-2">
              Errors ({result.errors.length}{result.hasMoreErrors ? '+' : ''})
            </h4>
            <div className="bg-black p-3 max-h-32 overflow-y-auto">
              {result.errors.map((err, i) => (
                <p key={i} className="text-xs text-gray-500 mb-1">
                  {err}
                </p>
              ))}
            </div>
          </div>
        )}

        <Button onClick={reset} variant="secondary" className="w-full">
          Import Another File
        </Button>
      </div>
    )
  }

  return (
    <div className={cn('bg-[#0a0a0a] border border-[#1a1a1a] p-6', className)}>
      <h3 className="text-sm font-medium text-gray-400 mb-4">
        Import Email Subscribers
      </h3>

      <p className="text-sm text-gray-500 mb-4">
        Upload a CSV export from Mailchimp, ConvertKit, Klaviyo, or other email providers.
        We&apos;ll detect the format and import subscribers. Optional `phone`, `sms_opt_in`, and
        `sms_opt_in_at` columns will seed SMS-ready contacts too.
      </p>

      {/* Dropzone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'border-2 border-dashed p-8 text-center transition-colors cursor-pointer',
          isDragging
            ? 'border-accent bg-accent/5'
            : 'border-[#1a1a1a] hover:border-[#333]',
          file && 'border-status-success bg-status-success/5'
        )}
        onClick={() => document.getElementById('email-csv-input')?.click()}
      >
        <input
          id="email-csv-input"
          type="file"
          accept=".csv"
          onChange={handleFileSelect}
          className="hidden"
        />

        {file ? (
          <div className="flex items-center justify-center gap-3">
            <FileText className="w-8 h-8 text-status-success" />
            <div className="text-left">
              <p className="font-medium text-white">{file.name}</p>
              <p className="text-sm text-gray-500">
                {(file.size / 1024).toFixed(1)} KB
              </p>
            </div>
          </div>
        ) : (
          <>
            <Upload className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <p className="text-white mb-1">
              Drag and drop your CSV file here
            </p>
            <p className="text-sm text-gray-500">
              or click to browse
            </p>
          </>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 mt-4 text-status-error">
          <XCircle className="w-4 h-4" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Upload Button */}
      {file && (
        <Button
          onClick={handleUpload}
          disabled={isUploading}
          className="w-full mt-4"
        >
          {isUploading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Importing...
            </>
          ) : (
            'Import Subscribers'
          )}
        </Button>
      )}

      {/* Supported Formats */}
      <div className="mt-6 pt-6 border-t border-[#1a1a1a]">
        <p className="text-xs text-gray-500 mb-2">Supported formats:</p>
        <div className="flex flex-wrap gap-2">
          {['Mailchimp', 'ConvertKit', 'Klaviyo', 'ActiveCampaign', 'Drip', 'HubSpot'].map(
            (provider) => (
              <span
                key={provider}
                className="px-2 py-1 bg-black text-xs text-gray-500"
              >
                {provider}
              </span>
            )
          )}
        </div>
      </div>
    </div>
  )
}
