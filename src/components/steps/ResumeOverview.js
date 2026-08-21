import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Pencil, Plus, Trash2 } from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Button,
  Input,
  Textarea,
  ConfirmationModal,
} from '../ui';
import { useResumeContext } from '../../contexts/ResumeContext';
import { PHASES } from '../../constants/workflow';
import { looksUnknown } from '../../utils/resumeIds';

const ResumeOverview = () => {
  const {
    resumeData,
    editingJobIndex,
    editingJob,
    startEditingJob,
    saveEditedJob,
    setEditingJob,
    setEditingJobIndex,
    editingBulletInfo,
    editedBullet,
    startEditingBullet,
    saveEditedBullet,
    setEditingBulletInfo,
    setEditedBullet,
    handleStepNavigation,
    handleNavigation,
    addJob,
    addBullet,
    removeBullet,
    removeJob,
  } = useResumeContext();

  const [deleteTarget, setDeleteTarget] = useState(null);

  const totalJobs = resumeData.bullet_points.length;
  const totalBullets = resumeData.bullet_points.reduce((total, job) => {
    return total + (job.achievements ? job.achievements.length : 0);
  }, 0);
  const hasUnknown = resumeData.bullet_points.some(
    (job) => looksUnknown(job.company) || looksUnknown(job.position)
  );

  const confirmDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === 'job') {
      removeJob(deleteTarget.jobIndex);
    } else {
      removeBullet(deleteTarget.jobIndex, deleteTarget.bulletIndex);
    }
    setDeleteTarget(null);
  };

  const goToTarget = () => {
    window.scrollTo(0, 0);
    handleStepNavigation(PHASES.TARGET);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle>We found {totalJobs} {totalJobs === 1 ? 'job' : 'jobs'} and {totalBullets} {totalBullets === 1 ? 'bullet' : 'bullets'}</CardTitle>
            <CardDescription>
              Does this look right? Edit, add, or remove anything the parser missed before we rewrite.
            </CardDescription>
          </div>
          <Button
            onClick={goToTarget}
            variant="primary"
            disabled={totalBullets === 0}
            className="flex-shrink-0"
          >
            Trust the parser — continue
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {hasUnknown && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            Some roles are labeled Unknown. Edit them before rewriting so the suggestions have the right context.
          </div>
        )}

        <div className="space-y-6">
          {resumeData.bullet_points.map((job, jobIndex) => (
            <div
              key={job.id || `${job.company}-${job.position}-${jobIndex}`}
              className="border border-gray-200 rounded-lg p-4 bg-gray-50"
            >
              {editingJobIndex === jobIndex ? (
                <div className="mb-4 pb-4 border-b border-gray-200 space-y-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                    <Input
                      type="text"
                      value={editingJob.position}
                      onChange={(e) => setEditingJob({ ...editingJob, position: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                    <Input
                      type="text"
                      value={editingJob.company}
                      onChange={(e) => setEditingJob({ ...editingJob, company: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Time period</label>
                    <Input
                      type="text"
                      value={editingJob.time_period || ''}
                      onChange={(e) => setEditingJob({ ...editingJob, time_period: e.target.value })}
                    />
                  </div>
                  <div className="flex space-x-2">
                    <Button onClick={saveEditedJob} variant="secondary" size="sm">Save role</Button>
                    <Button
                      onClick={() => {
                        setEditingJobIndex(null);
                        setEditingJob(null);
                      }}
                      variant="ghost"
                      size="sm"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="mb-4 pb-4 border-b border-gray-200 flex items-start justify-between gap-3">
                  <div>
                    <div className="font-medium text-gray-900">{job.position || 'Untitled role'}</div>
                    <div className="text-sm text-gray-600">{job.company || 'Unknown company'}</div>
                    {job.time_period && (
                      <div className="text-sm text-gray-500">{job.time_period}</div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => startEditingJob(jobIndex)}
                      variant="outline"
                      size="sm"
                    >
                      <Pencil className="w-3.5 h-3.5 mr-1" />
                      Edit role
                    </Button>
                    <Button
                      onClick={() => setDeleteTarget({ type: 'job', jobIndex })}
                      variant="ghost"
                      size="sm"
                      aria-label="Delete role"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {(job.achievements || []).map((bullet, bulletIndex) => {
                  const isEditing =
                    editingBulletInfo.jobIndex === jobIndex &&
                    editingBulletInfo.bulletIndex === bulletIndex;

                  if (isEditing) {
                    return (
                      <div key={job.achievementIds?.[bulletIndex] || bulletIndex} className="space-y-2">
                        <Textarea
                          value={editedBullet}
                          onChange={(e) => setEditedBullet(e.target.value)}
                          rows={3}
                        />
                        <div className="flex space-x-2">
                          <Button onClick={saveEditedBullet} variant="secondary" size="sm">Save</Button>
                          <Button
                            onClick={() => setEditingBulletInfo({ jobIndex: null, bulletIndex: null })}
                            variant="ghost"
                            size="sm"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={job.achievementIds?.[bulletIndex] || bulletIndex}
                      className="border border-gray-200 rounded p-3 text-sm text-gray-800 bg-white"
                    >
                      <p>{bullet || 'Empty bullet'}</p>
                      <div className="flex gap-2 mt-2">
                        <Button
                          onClick={() => startEditingBullet(jobIndex, bulletIndex, bullet)}
                          variant="ghost"
                          size="sm"
                          className="px-0"
                        >
                          <Pencil className="w-3 h-3 mr-1" />
                          Edit
                        </Button>
                        <Button
                          onClick={() => setDeleteTarget({ type: 'bullet', jobIndex, bulletIndex })}
                          variant="ghost"
                          size="sm"
                          className="px-0"
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  );
                })}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addBullet(jobIndex)}
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Add bullet
                </Button>
              </div>
            </div>
          ))}
        </div>

        <Button variant="outline" onClick={addJob}>
          <Plus className="w-4 h-4 mr-2" />
          Add role
        </Button>
      </CardContent>

      <CardFooter className="flex justify-between border-t border-gray-200 pt-4">
        <Button onClick={() => handleNavigation('back')} variant="outline">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Upload
        </Button>
        <Button
          onClick={goToTarget}
          variant="primary"
          disabled={totalBullets === 0}
        >
          Trust the parser — continue
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </CardFooter>

      <ConfirmationModal
        isOpen={Boolean(deleteTarget)}
        title={deleteTarget?.type === 'job' ? 'Delete this role?' : 'Delete this bullet?'}
        message="This cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        confirmVariant="danger"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </Card>
  );
};

export default ResumeOverview;
