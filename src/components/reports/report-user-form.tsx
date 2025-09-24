'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Textarea } from '@/components/ui/textarea'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Flag, 
  Upload, 
  X, 
  AlertTriangle,
  Shield,
  Loader2
} from 'lucide-react'
import { 
  CreateReportRequest,
  REPORT_CATEGORIES,
  ReportCategory
} from '@/lib/types/moderation.types'
import { moderationService } from '@/lib/services/moderation.service'
import { useAuth } from '@/hooks/useAuth'

interface ReportUserFormProps {
  reportedUserId: string
  reportedUserName: string
  trigger?: React.ReactNode
  onReportSubmitted?: () => void
}

export function ReportUserForm({ 
  reportedUserId, 
  reportedUserName, 
  trigger,
  onReportSubmitted 
}: ReportUserFormProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  
  const [formData, setFormData] = useState<CreateReportRequest>({
    reportedUserId,
    category: 'inappropriate_content',
    reason: '',
    description: '',
    evidence: [],
    isAnonymous: false
  })

  const { user } = useAuth()

  const handleFileUpload = (files: FileList | null) => {
    if (!files) return
    
    const newFiles = Array.from(files).slice(0, 5) // Limit to 5 files
    setFormData({
      ...formData,
      evidence: [...(formData.evidence || []), ...newFiles]
    })
  }

  const removeFile = (index: number) => {
    const newEvidence = formData.evidence?.filter((_, i) => i !== index) || []
    setFormData({ ...formData, evidence: newEvidence })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      setError('You must be logged in to submit a report')
      return
    }

    if (!formData.reason.trim() || !formData.description.trim()) {
      setError('Please fill in all required fields')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      await moderationService.submitReport(formData, user.$id)
      setSuccess(true)
      
      // Reset form after successful submission
      setTimeout(() => {
        setIsOpen(false)
        setSuccess(false)
        setFormData({
          reportedUserId,
          category: 'inappropriate_content',
          reason: '',
          description: '',
          evidence: [],
          isAnonymous: false
        })
        onReportSubmitted?.()
      }, 2000)
    } catch (error: any) {
      setError(error.message || 'Failed to submit report')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getCategoryDescription = (category: ReportCategory) => {
    const categoryInfo = REPORT_CATEGORIES.find(c => c.value === category)
    return categoryInfo?.description || ''
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Flag className="mr-2 h-4 w-4" />
            Report User
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-red-600" />
            Report User
          </DialogTitle>
          <DialogDescription>
            Report {reportedUserName} for violating community guidelines. 
            All reports are reviewed by our moderation team.
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="text-center py-8">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <Shield className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-green-800 mb-2">
              Report Submitted Successfully
            </h3>
            <p className="text-green-600">
              Thank you for helping keep our community safe. 
              We'll review your report and take appropriate action.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="category">Report Category *</Label>
              <Select 
                value={formData.category} 
                onValueChange={(value: ReportCategory) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REPORT_CATEGORIES.map(category => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-gray-600">
                {getCategoryDescription(formData.category)}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Brief Reason *</Label>
              <Input
                id="reason"
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                placeholder="Brief summary of the issue..."
                required
                maxLength={100}
              />
              <p className="text-xs text-gray-500">
                {formData.reason.length}/100 characters
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Detailed Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Please provide detailed information about what happened, when it occurred, and any other relevant details..."
                required
                rows={4}
                maxLength={1000}
              />
              <p className="text-xs text-gray-500">
                {formData.description.length}/1000 characters
              </p>
            </div>

            <div className="space-y-2">
              <Label>Evidence (Optional)</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                <div className="text-center">
                  <Upload className="mx-auto h-8 w-8 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-600">
                    Upload screenshots or other evidence (max 5 files, 10MB each)
                  </p>
                  <input
                    type="file"
                    multiple
                    accept="image/*,.pdf"
                    onChange={(e) => handleFileUpload(e.target.files)}
                    className="mt-2 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>
              </div>

              {formData.evidence && formData.evidence.length > 0 && (
                <div className="space-y-2">
                  <Label>Uploaded Files:</Label>
                  {formData.evidence.map((file, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                      <span className="text-sm truncate">{file.name}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="anonymous"
                checked={formData.isAnonymous}
                onCheckedChange={(checked) => 
                  setFormData({ ...formData, isAnonymous: checked as boolean })
                }
              />
              <Label htmlFor="anonymous" className="text-sm">
                Submit this report anonymously
              </Label>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-yellow-800">Important:</p>
                  <ul className="mt-1 text-yellow-700 space-y-1">
                    <li>• False reports may result in action against your account</li>
                    <li>• Reports are reviewed by our moderation team</li>
                    <li>• We may contact you for additional information</li>
                    <li>• Serious violations are reported to authorities when required</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={isSubmitting}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Flag className="mr-2 h-4 w-4" />
                    Submit Report
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}