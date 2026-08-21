import React, { useEffect, useState } from 'react';
import { ArrowRight, Upload } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button } from '../ui';
import { useResumeContext } from '../../contexts/ResumeContext';
import { PHASE_LABELS } from '../../constants/workflow';

const PARSE_STAGES = ['Uploading', 'Reading pages', 'Finding roles'];

const ResumeUpload = () => {
  const {
    handleFileUpload,
    loading,
    errors,
    setErrors,
    resumeData,
    resumablePhase,
    handleStepNavigation,
    clearStorageAndResetState,
  } = useResumeContext();

  const [selectedFileName, setSelectedFileName] = useState('');
  const [stageIndex, setStageIndex] = useState(0);

  const hasSavedSession = resumeData?.bullet_points?.length > 0 && resumablePhase;
  const isParsing = Boolean(loading.parse);

  useEffect(() => {
    if (!isParsing) {
      setStageIndex(0);
      return undefined;
    }
    const timer = setInterval(() => {
      setStageIndex((current) => Math.min(current + 1, PARSE_STAGES.length - 1));
    }, 1200);
    return () => clearInterval(timer);
  }, [isParsing]);

  const onFileInputChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFileName(file.name);

    const allowedTypes = [
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    if (!allowedTypes.includes(file.type) && !/\.(pdf|txt|doc|docx)$/i.test(file.name)) {
      setErrors((prev) => ({
        ...prev,
        parse: 'Please upload a PDF, Word, or text file.',
      }));
      return;
    }

    await handleFileUpload(file);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Upload your resume</CardTitle>
        <CardDescription>
          Upload a PDF, Word, or text file. We extract your roles, then rewrite each bullet.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {hasSavedSession && !isParsing && (
          <div className="border border-primary-200 bg-primary-50 rounded-lg p-4">
            <p className="text-sm text-gray-800 mb-3">
              You have a resume in progress. Continue from {PHASE_LABELS[resumablePhase] || 'Confirm'}, or start over.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="primary"
                onClick={() => handleStepNavigation(resumablePhase)}
              >
                Continue where you left off
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  clearStorageAndResetState();
                  setSelectedFileName('');
                }}
              >
                Start over
              </Button>
            </div>
          </div>
        )}

        <label className="flex flex-col items-center p-6 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-100 w-full transition-colors">
          <div className="bg-primary-100 p-3 rounded-full mb-3">
            <Upload className="w-10 h-10 text-primary-600" />
          </div>
          <span className="font-medium mb-1 text-gray-900">
            {selectedFileName || 'Choose a file'}
          </span>
          <span className="text-xs text-gray-500 mb-1">
            PDF, Word, or text files supported
          </span>
          <span className="text-xs text-gray-400">Max file size: 5MB</span>
          <input
            type="file"
            className="hidden"
            onChange={onFileInputChange}
            accept=".pdf,.txt,.doc,.docx"
            aria-label="Upload resume file"
          />
        </label>

        {errors.parse && (
          <div className="text-red-500 text-sm p-3 bg-red-50 rounded-lg border border-red-200 w-full">
            {errors.parse}
          </div>
        )}

        {isParsing && (
          <div className="text-primary-700 text-sm p-3 bg-primary-50 rounded-lg border border-primary-200 w-full">
            <div className="flex items-center mb-3">
              <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {PARSE_STAGES[stageIndex]}...
            </div>
            <ol className="space-y-1 text-xs">
              {PARSE_STAGES.map((stage, index) => (
                <li key={stage} className={index <= stageIndex ? 'text-primary-800' : 'text-gray-400'}>
                  {index < stageIndex ? 'Done: ' : index === stageIndex ? 'Now: ' : ''}
                  {stage}
                </li>
              ))}
            </ol>
          </div>
        )}

        <p className="text-center text-xs text-gray-500">
          Files are processed to extract roles and bullets. They are not stored permanently.
        </p>
      </CardContent>
    </Card>
  );
};

export default ResumeUpload;
