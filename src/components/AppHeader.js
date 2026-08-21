import React, { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { ConfirmationModal, Button } from './ui';
import { useResumeContext } from '../contexts/ResumeContext';

const AppHeader = () => {
  const { clearStorageAndResetState, resumeData } = useResumeContext();
  const [showResetModal, setShowResetModal] = useState(false);
  const hasData = resumeData?.bullet_points?.length > 0;

  return (
    <>
      <header className="w-full border-b border-gray-200 bg-white">
        <div className="max-w-[90rem] mx-auto px-4 lg:px-8 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src={`${process.env.PUBLIC_URL}/resume_dj_logo.png`}
              alt="Resume DJ"
              className="h-10 w-auto flex-shrink-0"
            />
            <div className="min-w-0">
              <p className="font-semibold text-gray-900 leading-tight">Resume DJ</p>
              <p className="text-sm text-gray-600 truncate">
                Don’t just apply—headline the show.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {hasData && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowResetModal(true)}
                aria-label="Reset all resume data"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </Button>
            )}
          </div>
        </div>
      </header>
      <ConfirmationModal
        isOpen={showResetModal}
        title="Reset all data?"
        message="This clears the uploaded resume and any rewrites. This cannot be undone."
        confirmText="Reset"
        cancelText="Cancel"
        confirmVariant="danger"
        onConfirm={() => {
          clearStorageAndResetState();
          setShowResetModal(false);
        }}
        onCancel={() => setShowResetModal(false)}
      />
    </>
  );
};

export default AppHeader;
