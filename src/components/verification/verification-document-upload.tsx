import React, { useState } from 'react';
import { FileText, Upload, X, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { useVerificationDocumentUpload } from '@/hooks/useFileUpload';
import { FileUpload, FilePreview, FileUploadStatus } from '@/components/ui/file-upload';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { VerificationService, CreateVerificationRequestData } from '@/lib/services/verification.service';
import { cn } from '@/lib/utils';

interface VerificationDocumentUploadProps {
  userId: string;
  onSubmitComplete?: (requestId: string) => void;
  onSubmitError?: (error: Error) => void;
  className?: string;
  existingRequestId?: string; // For resubmission
}

const DOCUMENT_TYPES = [
  { value: 'id_card', label: 'National ID Card', description: 'Government issued ID card' },
  { value: 'passport', label: 'Passport', description: 'Valid passport document' },
  { value: 'driving_license', label: 'Driving License', description: 'Valid driving license' },
  { value: 'other', label: 'Other', description: 'Other government issued document' }
] as const;

export const VerificationDocumentUpload: React.FC<VerificationDocumentUploadProps> = ({
  userId,
  onSubmitComplete,
  onSubmitError,
  className,
  existingRequestId
}) => {
  const [documentType, setDocumentType] = useState<string>('');
  const [documentNumber, setDocumentNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    state,
    selectFiles,
    removeFile,
    clearFiles,
    clearErrors,
    getPreviewUrl
  } = useVerificationDocumentUpload({
    maxFiles: 5,
    onValidationError: (errors) => {
      console.warn('Validation errors:', errors);
    }
  });

  const isResubmission = !!existingRequestId;

  const handleSubmit = async () => {
    if (!documentType) {
      onSubmitError?.(new Error('Please select a document type'));
      return;
    }

    if (state.files.length === 0) {
      onSubmitError?.(new Error('Please select at least one document file'));
      return;
    }

    setIsSubmitting(true);

    try {
      if (isResubmission) {
        // Resubmit existing request
        const result = await VerificationService.resubmitVerificationRequest(
          existingRequestId,
          state.files,
          notes
        );
        onSubmitComplete?.(result.request.$id);
      } else {
        // Create new verification request
        const requestData: CreateVerificationRequestData = {
          userId,
          documentType: documentType as any,
          documentNumber: documentNumber || undefined,
          notes: notes || undefined
        };

        const result = await VerificationService.createVerificationRequest(
          requestData,
          state.files
        );
        onSubmitComplete?.(result.request.$id);
      }

      // Clear form
      setDocumentType('');
      setDocumentNumber('');
      setNotes('');
      clearFiles();
    } catch (error) {
      onSubmitError?.(error instanceof Error ? error : new Error('Submission failed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit = documentType && state.files.length > 0 && !isSubmitting;

  return (
    <Card className={cn('w-full max-w-2xl', className)}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <FileText className="w-5 h-5" />
          <span>
            {isResubmission ? 'Resubmit Verification Documents' : 'Upload Verification Documents'}
          </span>
        </CardTitle>
        <CardDescription>
          {isResubmission 
            ? 'Upload new documents to replace your previous submission'
            : 'Upload clear photos or scans of your government-issued identification documents'
          }
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Document Type Selection */}
        <div className="space-y-2">
          <Label htmlFor="document-type">Document Type *</Label>
          <Select value={documentType} onValueChange={setDocumentType}>
            <SelectTrigger>
              <SelectValue placeholder="Select document type" />
            </SelectTrigger>
            <SelectContent>
              {DOCUMENT_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  <div>
                    <div className="font-medium">{type.label}</div>
                    <div className="text-sm text-gray-500">{type.description}</div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Document Number (Optional) */}
        <div className="space-y-2">
          <Label htmlFor="document-number">Document Number (Optional)</Label>
          <Input
            id="document-number"
            value={documentNumber}
            onChange={(e) => setDocumentNumber(e.target.value)}
            placeholder="Enter document number if applicable"
          />
        </div>

        {/* File Upload */}
        <div className="space-y-4">
          <Label>Document Files *</Label>
          
          {state.files.length === 0 ? (
            <FileUpload
              onFilesSelected={selectFiles}
              accept="image/*,application/pdf"
              multiple
              maxSize={10 * 1024 * 1024} // 10MB
              dragText="Drag and drop your document files here"
              browseText="or click to select files (max 5 files)"
            />
          ) : (
            <div className="space-y-3">
              {state.files.map((file, index) => (
                <FilePreview
                  key={`${file.name}-${index}`}
                  file={file}
                  onRemove={() => removeFile(index)}
                />
              ))}
              
              {state.files.length < 5 && (
                <Button
                  variant="outline"
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*,application/pdf';
                    input.multiple = true;
                    input.onchange = (e) => {
                      const files = (e.target as HTMLInputElement).files;
                      if (files) {
                        selectFiles(Array.from(files));
                      }
                    };
                    input.click();
                  }}
                  className="w-full"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Add More Files
                </Button>
              )}
            </div>
          )}

          {/* Upload Status */}
          <FileUploadStatus
            uploading={false}
            errors={state.errors}
            validationErrors={state.validationErrors}
          />
        </div>

        {/* Additional Notes */}
        <div className="space-y-2">
          <Label htmlFor="notes">Additional Notes (Optional)</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any additional information about your documents..."
            rows={3}
          />
        </div>

        {/* Guidelines */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">Document Guidelines:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Ensure documents are clear and readable</li>
            <li>• All four corners of the document should be visible</li>
            <li>• Avoid glare, shadows, or blurry images</li>
            <li>• Accepted formats: JPG, PNG, PDF</li>
            <li>• Maximum file size: 10MB per file</li>
            <li>• Maximum 5 files per submission</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => {
              clearFiles();
              clearErrors();
              setDocumentType('');
              setDocumentNumber('');
              setNotes('');
            }}
            disabled={isSubmitting}
          >
            Clear All
          </Button>

          <Button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="min-w-[120px]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                {isResubmission ? 'Resubmit' : 'Submit for Review'}
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Verification status display component
interface VerificationStatusProps {
  status: 'none' | 'pending' | 'partial' | 'full';
  latestRequest?: any;
  className?: string;
}

export const VerificationStatus: React.FC<VerificationStatusProps> = ({
  status,
  latestRequest,
  className
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'full':
        return {
          icon: CheckCircle,
          color: 'text-green-600',
          bgColor: 'bg-green-50 border-green-200',
          title: 'Verified',
          description: 'Your identity has been verified'
        };
      case 'pending':
        return {
          icon: Loader2,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50 border-yellow-200',
          title: 'Under Review',
          description: 'Your documents are being reviewed'
        };
      case 'partial':
        return {
          icon: AlertCircle,
          color: 'text-orange-600',
          bgColor: 'bg-orange-50 border-orange-200',
          title: 'Partially Verified',
          description: 'Additional verification may be required'
        };
      default:
        return {
          icon: AlertCircle,
          color: 'text-gray-600',
          bgColor: 'bg-gray-50 border-gray-200',
          title: 'Not Verified',
          description: 'Upload documents to get verified'
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <div className={cn(
      'border rounded-lg p-4',
      config.bgColor,
      className
    )}>
      <div className="flex items-start space-x-3">
        <Icon className={cn('w-5 h-5 mt-0.5', config.color)} />
        <div className="flex-1">
          <h3 className={cn('font-medium', config.color)}>
            {config.title}
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            {config.description}
          </p>
          
          {latestRequest && (
            <div className="mt-2 text-xs text-gray-500">
              Submitted: {new Date(latestRequest.submittedAt).toLocaleDateString()}
              {latestRequest.rejectionReason && (
                <div className="mt-1 text-red-600">
                  Reason: {latestRequest.rejectionReason}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};