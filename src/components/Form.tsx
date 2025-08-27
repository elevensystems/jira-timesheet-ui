'use client';

import React, { useMemo, useState } from 'react';

import Image from 'next/image';

import {
  BookOpen,
  CheckCircle,
  Eye,
  FileText,
  Pencil,
  Trash2,
} from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { submitTimesheet } from '@/utils/apiCalls';
import {
  isValidDatesList,
  sanitizeAccount,
  sanitizeDates,
  sanitizeDescription,
  sanitizeHours,
  sanitizeTicketId,
  sanitizeToken,
} from '@/utils/sanitize';

interface Ticket {
  id: string;
  typeOfWork: 'Create' | 'Review' | 'Study';
  description: string;
  timeSpend: number; // hours
  ticketId: string;
}

const Form: React.FC = () => {
  // steps: 1=Setup, 2=Log Ticket, 3=Review, 4=Success
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [userId, setUserId] = useState('');
  const [jiraToken, setJiraToken] = useState('');
  const [dates, setDates] = useState('');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [currentTicket, setCurrentTicket] = useState<Ticket>({
    id: '',
    typeOfWork: 'Create',
    description: '',
    timeSpend: 0.25,
    ticketId: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // success message is shown via dialog and success screen
  const [showDialog, setShowDialog] = useState(false);
  const [dialogMessage, setDialogMessage] = useState('');
  const [dialogTitle, setDialogTitle] = useState('');

  const showMessageDialog = (title: string, message: string) => {
    setDialogTitle(title);
    setDialogMessage(message);
    setShowDialog(true);
  };

  const handleAddTicket = () => {
    if (!currentTicket.ticketId.trim()) {
      setError('Ticket ID is required');
      return;
    }

    if (!currentTicket.description.trim()) {
      setError('Description is required');
      return;
    }

    // Generate a unique ID for this ticket for tracking in the UI
    const newTicket = {
      ...currentTicket,
      id: Date.now().toString(),
    };

    setTickets([...tickets, newTicket]);
    setCurrentTicket({
      id: '',
      typeOfWork: 'Create',
      description: '',
      timeSpend: 0.25,
      ticketId: '',
    });
    setError(null);
  };

  const handleRemoveTicket = (id: string) => {
    setTickets(tickets.filter(ticket => ticket.id !== id));
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate first step inputs
    const safeUser = sanitizeAccount(userId);
    const safeToken = sanitizeToken(jiraToken);
    setUserId(safeUser);
    setJiraToken(safeToken);

    if (!safeUser.trim()) {
      setError('User ID is required');
      return;
    }

    if (!safeToken.trim()) {
      setError('Jira Token is required');
      return;
    }
    setStep(2);
  };

  // no-op back handler removed in this flow version

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault?.();
    setIsSubmitting(true);
    setError(null);

    try {
      if (tickets.length === 0) {
        throw new Error('Please add at least one ticket');
      }

      const safeDates = sanitizeDates(dates);
      if (!safeDates.trim() || !isValidDatesList(safeDates)) {
        throw new Error(
          'Dates must be in format: 20/Aug/25, 21/Aug/25, 22/Aug/25'
        );
      }

      // Submit timesheet with tickets
      await submitTimesheet({
        userId: sanitizeAccount(userId),
        jiraToken: sanitizeToken(jiraToken),
        dates: safeDates,
        tickets: tickets.map(ticket => ({
          typeOfWork: ticket.typeOfWork,
          description: sanitizeDescription(ticket.description),
          timeSpend: sanitizeHours(ticket.timeSpend),
          ticketId: sanitizeTicketId(ticket.ticketId),
        })),
      });

      showMessageDialog('Success', 'Timesheet submitted successfully!');
      setStep(4);
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

  const totalHours = useMemo(
    () => tickets.reduce((sum, t) => sum + t.timeSpend, 0),
    [tickets]
  );

  return (
    <Card className='max-w-4xl mx-auto mt-4'>
      <CardHeader>
        <Tabs value={step.toString()} className='w-full'>
          <TabsList className='grid w-full grid-cols-3 bg-purple-50'>
            <TabsTrigger value='1'>
              <Pencil className='mr-2 h-4 w-4' /> Setup
            </TabsTrigger>
            <TabsTrigger value='2'>
              <FileText className='mr-2 h-4 w-4' /> Log Ticket
            </TabsTrigger>
            <TabsTrigger value='3'>
              <CheckCircle className='mr-2 h-4 w-4' /> Review
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant='destructive' className='mb-4'>
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {/* Flow 1: Setup */}
        {step === 1 && (
          <form onSubmit={handleNext} className='space-y-6'>
            <div className='space-y-1'>
              <Label className='font-semibold'>FPT account</Label>
              <Input
                placeholder='Insert your FPT account (E.g., ThaoLNP5)'
                value={userId}
                onChange={e => setUserId(sanitizeAccount(e.target.value))}
              />
            </div>
            <div className='space-y-1'>
              <Label className='font-semibold'>Jira Token</Label>
              <div className='text-sm text-muted-foreground'>
                Click{' '}
                <a
                  className='underline text-blue-600'
                  href='https://id.atlassian.com/manage-profile/security/api-tokens'
                  target='_blank'
                  rel='noreferrer'
                >
                  here
                </a>
                , → Then Click on Personal Access Tokens → Create Token
              </div>
              <Input
                type='password'
                placeholder='Insert your jira token'
                value={jiraToken}
                onChange={e => setJiraToken(sanitizeToken(e.target.value))}
              />
            </div>
            <div className='flex justify-end'>
              <Button type='submit' className='w-40'>
                Next
              </Button>
            </div>
          </form>
        )}

        {/* Flow 2: Log Ticket (entry) */}
        {step === 2 && (
          <div className='space-y-6'>
            <div className='space-y-1'>
              <Label className='font-semibold'>Your Worklog Dates</Label>
              <ol className='text-sm text-muted-foreground pl-4 list-decimal space-y-1'>
                <li>Click on your Jira Project → Project worklog</li>
                <li>
                  Fill in your account name and the date range, then search your
                  missing work log dates
                </li>
                <li>Copy your missing work log dates</li>
              </ol>
              <textarea
                className='flex h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm'
                placeholder='E.g., 20/Aug/25, 21/Aug/25, 22/Aug/25, 25/Aug/25'
                value={dates}
                onChange={e => setDates(sanitizeDates(e.target.value))}
              />
            </div>
            <div className='grid gap-4 md:grid-cols-2'>
              <div className='space-y-1'>
                <Label className='font-semibold'>Ticket ID</Label>
                <Input
                  placeholder='Enter Jira Ticket (E.g., C99KBBATC2025-37)'
                  value={currentTicket.ticketId}
                  onChange={e =>
                    setCurrentTicket({
                      ...currentTicket,
                      ticketId: sanitizeTicketId(e.target.value),
                    })
                  }
                />
              </div>
              <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-1'>
                  <Label className='font-semibold'>Type of work</Label>
                  <Select
                    value={currentTicket.typeOfWork}
                    onValueChange={v =>
                      setCurrentTicket({
                        ...currentTicket,
                        typeOfWork: v as Ticket['typeOfWork'],
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder='Select 1 item' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value='Create'>
                          <div className='flex items-center gap-2'>
                            <Pencil className='h-4 w-4 text-muted-foreground' />
                            <span>Create</span>
                          </div>
                        </SelectItem>
                        <SelectItem value='Review'>
                          <div className='flex items-center gap-2'>
                            <Eye className='h-4 w-4 text-muted-foreground' />
                            <span>Review</span>
                          </div>
                        </SelectItem>
                        <SelectItem value='Study'>
                          <div className='flex items-center gap-2'>
                            <BookOpen className='h-4 w-4 text-muted-foreground' />
                            <span>Study</span>
                          </div>
                        </SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
                <div className='space-y-1'>
                  <Label className='font-semibold'>Time Spent (hrs)</Label>
                  <Input
                    type='number'
                    step='0.25'
                    min='0.25'
                    value={currentTicket.timeSpend}
                    onChange={e =>
                      setCurrentTicket({
                        ...currentTicket,
                        timeSpend: sanitizeHours(e.target.value),
                      })
                    }
                  />
                </div>
              </div>
            </div>
            <div className='space-y-1'>
              <Label className='font-semibold'>Description</Label>
              <textarea
                className='flex h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm'
                placeholder="Copy Jira Ticket 's description (E.g., Create project plan, do project report...)"
                value={currentTicket.description}
                onChange={e =>
                  setCurrentTicket({
                    ...currentTicket,
                    description: sanitizeDescription(e.target.value),
                  })
                }
              />
            </div>
            <div className='flex justify-center'>
              <Button
                type='button'
                variant='secondary'
                onClick={handleAddTicket}
              >
                + Add ticket
              </Button>
            </div>

            {tickets.length === 0 && (
              <div className='flex justify-end'>
                <Button variant='outline' onClick={() => setStep(1)}>
                  Back
                </Button>
              </div>
            )}

            {/* Added list, and ability to go to review (flow 2b similar to image 3) */}
            {tickets.length > 0 && (
              <div className='space-y-4'>
                <Separator />
                <div>
                  <h3 className='font-semibold mb-3'>
                    Added ticket ({tickets.length})
                  </h3>
                  <div className='border rounded-lg'>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Status</TableHead>
                          <TableHead>Ticket ID</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead className='text-right'>
                            Time spent (hrs)
                          </TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {tickets.map(ticket => (
                          <TableRow key={ticket.id}>
                            <TableCell>
                              <Badge
                                className={
                                  ticket.typeOfWork === 'Create'
                                    ? 'bg-green-200 text-black'
                                    : ticket.typeOfWork === 'Review'
                                      ? 'bg-red-200 text-black'
                                      : 'bg-indigo-200 text-black'
                                }
                              >
                                {ticket.typeOfWork}
                              </Badge>
                            </TableCell>
                            <TableCell className='font-medium'>
                              {ticket.ticketId}
                            </TableCell>
                            <TableCell className='truncate max-w-[280px]'>
                              {ticket.description}
                            </TableCell>
                            <TableCell className='text-right'>
                              {ticket.timeSpend}
                            </TableCell>
                            <TableCell className='text-right'>
                              <Button
                                variant='ghost'
                                size='icon'
                                onClick={() => handleRemoveTicket(ticket.id)}
                              >
                                <Trash2 className='h-4 w-4' />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
                <div className='flex justify-between items-center'>
                  <div className='text-sm text-muted-foreground'>
                    {tickets.length} tickets . Total {totalHours} hrs/day
                  </div>
                  <div className='flex gap-2'>
                    <Button variant='outline' onClick={() => setStep(1)}>
                      Back
                    </Button>
                    <Button
                      onClick={() => {
                        const safeDates = sanitizeDates(dates);
                        setDates(safeDates);
                        if (!safeDates.trim()) {
                          setError('Dates are required');
                          return;
                        }
                        if (!isValidDatesList(safeDates)) {
                          setError(
                            'Dates must be in format: 20/Aug/25, 21/Aug/25, ...'
                          );
                          return;
                        }
                        setError(null);
                        setStep(3);
                      }}
                      className='w-40'
                    >
                      Review
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Flow 3: Review (and submit) */}
        {step === 3 && (
          <div className='space-y-6'>
            <div className='space-y-1'>
              <Label className='font-semibold'>
                Your Worklog Dates (
                {dates.split(',').filter(Boolean).length || 0})
              </Label>
              <textarea
                className='flex h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm'
                value={dates}
                readOnly
              />
            </div>
            <div>
              <div className='border rounded-lg'>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Status</TableHead>
                      <TableHead>Ticket ID</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className='text-right'>
                        Time spent (hrs)
                      </TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tickets.map(ticket => (
                      <TableRow key={ticket.id}>
                        <TableCell>
                          <Badge
                            className={
                              ticket.typeOfWork === 'Create'
                                ? 'bg-green-200 text-black'
                                : ticket.typeOfWork === 'Review'
                                  ? 'bg-red-200 text-black'
                                  : 'bg-indigo-200 text-black'
                            }
                          >
                            {ticket.typeOfWork}
                          </Badge>
                        </TableCell>
                        <TableCell className='font-medium'>
                          {ticket.ticketId}
                        </TableCell>
                        <TableCell className='truncate max-w-[480px]'>
                          {ticket.description}
                        </TableCell>
                        <TableCell className='text-right'>
                          {ticket.timeSpend}
                        </TableCell>
                        <TableCell className='text-right'>
                          <Button
                            variant='ghost'
                            size='icon'
                            onClick={() => handleRemoveTicket(ticket.id)}
                          >
                            <Trash2 className='h-4 w-4' />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className='flex justify-between items-center mt-4'>
                <div className='text-sm text-muted-foreground'>
                  {tickets.length} tickets . Total {totalHours} hrs/day
                </div>
                <div className='flex gap-2'>
                  <Button variant='outline' onClick={() => setStep(2)}>
                    Back
                  </Button>
                  <Button
                    disabled={tickets.length === 0 || isSubmitting}
                    onClick={() => handleSubmit()}
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Success screen */}
        {step === 4 && (
          <div className='flex flex-col items-center justify-center py-16'>
            <Image
              alt=''
              src='/vercel.svg'
              width={128}
              height={128}
              className='opacity-80 mb-6'
            />
            <p className='text-lg font-medium'>Successfully Added !</p>
            <div className='mt-6'>
              <Button
                onClick={() => {
                  setUserId('');
                  setJiraToken('');
                  setDates('');
                  setTickets([]);
                  setStep(1);
                }}
              >
                Add more
              </Button>
            </div>
          </div>
        )}
      </CardContent>

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
    </Card>
  );
};

export default Form;
