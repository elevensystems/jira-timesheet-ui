'use client';

import React, { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { submitTimesheet } from '@/utils/apiCalls';

const Form: React.FC = () => {
  const [userId, setUserId] = useState('');
  const [jiraToken, setJiraToken] = useState('');
  const [dates, setDates] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [dialogMessage, setDialogMessage] = useState('');
  const [dialogTitle, setDialogTitle] = useState('');

  const showMessageDialog = (title: string, message: string) => {
    setDialogTitle(title);
    setDialogMessage(message);
    setShowDialog(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      // Validate inputs
      if (!userId.trim()) {
        throw new Error('User ID is required');
      }
      if (!jiraToken.trim()) {
        throw new Error('Jira Token is required');
      }
      if (!dates.trim()) {
        throw new Error('Dates are required');
      }

      // Validate date format (dd/MMM/yy, dd/MMM/yy)
      const dateRegex =
        /^\d{1,2}\/[A-Za-z]{3}\/\d{2}(,\s*\d{1,2}\/[A-Za-z]{3}\/\d{2})*$/;
      if (!dateRegex.test(dates)) {
        throw new Error(
          'Dates must be in the format "dd/MMM/yy, dd/MMM/yy" (e.g., "15/Aug/25, 16/Aug/25")'
        );
      }

      const dateArray = dates.split(',').map(date => date.trim());

      // Submit timesheet
      await submitTimesheet({
        userId,
        jiraToken,
        dates: dateArray,
      });

      showMessageDialog('Success', 'Timesheet submitted successfully!');
      setSuccess('Timesheet submitted successfully!');

      // Reset form fields after successful submission
      setUserId('');
      setJiraToken('');
      setDates('');
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'An error occurred. Please try again.';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className='max-w-md mx-auto bg-card rounded-lg shadow-md md:max-w-2xl mt-10 p-6 border'>
      <div className='w-full'>
        <h3 className='text-sm font-semibold text-primary uppercase tracking-wide mb-1'>
          Jira Timesheet
        </h3>
        <h2 className='text-xl font-bold mb-6'>Submit Your Timesheet</h2>

        {error && (
          <div className='bg-destructive/10 border-l-4 border-destructive p-4 mb-4 rounded-sm'>
            <p className='text-sm text-destructive'>{error}</p>
          </div>
        )}

        {success && (
          <div className='bg-green-50 border-l-4 border-green-500 p-4 mb-4 rounded-sm'>
            <p className='text-sm text-green-700'>{success}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className='space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='userId'>User ID</Label>
            <Input
              id='userId'
              type='text'
              placeholder='Enter your user ID'
              value={userId}
              onChange={e => setUserId(e.target.value)}
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='jiraToken'>Jira Token</Label>
            <Input
              id='jiraToken'
              type='password'
              placeholder='Enter your Jira token'
              value={jiraToken}
              onChange={e => setJiraToken(e.target.value)}
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='dates'>Dates (format: dd/MMM/yy, dd/MMM/yy)</Label>
            <textarea
              id='dates'
              className='flex h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
              placeholder='e.g., 15/Aug/25, 16/Aug/25'
              value={dates}
              onChange={e => setDates(e.target.value)}
            />
            <p className='text-muted-foreground text-xs'>
              Enter dates separated by commas
            </p>
          </div>

          <div className='flex justify-end pt-2'>
            <Button type='submit' disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit Timesheet'}
            </Button>
          </div>
        </form>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
            <DialogDescription>{dialogMessage}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setShowDialog(false)}>OK</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Form;
