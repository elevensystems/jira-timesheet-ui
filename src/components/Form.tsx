'use client';

import React, { useState } from 'react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
  SelectLabel,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { submitTimesheet } from '@/utils/apiCalls';

interface Ticket {
  id: string;
  typeOfWork: 'Create' | 'In-progress' | 'Done';
  description: string;
  timeSpend: number;
  ticketId: string;
}

const Form: React.FC = () => {
  const [step, setStep] = useState<1 | 2>(1);
  const [userId, setUserId] = useState('');
  const [jiraToken, setJiraToken] = useState('');
  const [dates, setDates] = useState('');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [currentTicket, setCurrentTicket] = useState<Ticket>({
    id: '',
    typeOfWork: 'Create',
    description: '',
    timeSpend: 1,
    ticketId: '',
  });
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
      timeSpend: 1,
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
    if (!userId.trim()) {
      setError('User ID is required');
      return;
    }

    if (!jiraToken.trim()) {
      setError('Jira Token is required');
      return;
    }

    if (!dates.trim()) {
      setError('Dates are required');
      return;
    }

    // Validate date format (dd/MMM/yy, dd/MMM/yy)
    const dateRegex =
      /^\d{1,2}\/[A-Za-z]{3}\/\d{2}(,\s*\d{1,2}\/[A-Za-z]{3}\/\d{2})*$/;
    if (!dateRegex.test(dates)) {
      setError(
        'Dates must be in the format "dd/MMM/yy, dd/MMM/yy" (e.g., "15/Aug/25, 16/Aug/25")'
      );
      return;
    }

    // Move to the second step
    setStep(2);
  };

  const handleBack = () => {
    setStep(1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      if (tickets.length === 0) {
        throw new Error('Please add at least one ticket');
      }

      // Submit timesheet with tickets
      await submitTimesheet({
        userId,
        jiraToken,
        dates,
        tickets: tickets.map(ticket => ({
          typeOfWork: ticket.typeOfWork,
          description: ticket.description,
          timeSpend: ticket.timeSpend,
          ticketId: ticket.ticketId,
        })),
      });

      showMessageDialog('Success', 'Timesheet submitted successfully!');
      setSuccess('Timesheet submitted successfully!');

      // Reset form fields after successful submission
      setUserId('');
      setJiraToken('');
      setDates('');
      setTickets([]);
      setStep(1);
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
    <Card className='max-w-md mx-auto md:max-w-2xl mt-10'>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <div>
            <Badge
              variant='outline'
              className='text-xs font-semibold text-primary uppercase mb-1'
            >
              Jira Timesheet
            </Badge>
            <CardTitle>Submit Your Timesheet</CardTitle>
            <CardDescription>
              Fill in your details to generate a timesheet
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant='destructive' className='mb-4'>
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className='mb-4 border-green-500 text-green-700 bg-green-50'>
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <Tabs value={step === 1 ? 'details' : 'tickets'} className='mt-4'>
          <TabsList className='grid w-full grid-cols-2'>
            <TabsTrigger
              value='details'
              onClick={() => step !== 1 && handleBack()}
              disabled={step === 2 && isSubmitting}
            >
              User Details
            </TabsTrigger>
            <TabsTrigger value='tickets' disabled={step === 1 || isSubmitting}>
              Tickets
            </TabsTrigger>
          </TabsList>

          <TabsContent value='details' className='mt-4'>
            <form onSubmit={handleNext} className='space-y-4'>
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
                <Label htmlFor='dates'>
                  Dates (format: dd/MMM/yy, dd/MMM/yy)
                </Label>
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
                <Button type='submit'>Next</Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value='tickets' className='mt-4'>
            <div className='space-y-6'>
              {/* Display selected dates */}
              <Card>
                <CardHeader className='pb-2'>
                  <CardTitle className='text-sm'>
                    Selected Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='grid grid-cols-2 gap-2 text-sm'>
                    <div>
                      <p className='text-muted-foreground'>User ID:</p>
                      <p className='font-medium'>{userId}</p>
                    </div>
                    <div>
                      <p className='text-muted-foreground'>Dates:</p>
                      <p className='font-medium'>{dates}</p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className='pt-0 flex justify-end'>
                  <Button variant='outline' size='sm' onClick={handleBack}>
                    Edit Details
                  </Button>
                </CardFooter>
              </Card>

              {/* Add tickets form */}
              <div className='border-t pt-4'>
                <h3 className='text-md font-medium mb-4'>Add Tickets</h3>

                <div className='space-y-3'>
                  <div className='space-y-2'>
                    <Label htmlFor='ticketId'>Ticket ID</Label>
                    <Input
                      id='ticketId'
                      type='text'
                      placeholder='Enter Jira ticket ID'
                      value={currentTicket.ticketId}
                      onChange={e =>
                        setCurrentTicket({
                          ...currentTicket,
                          ticketId: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className='grid grid-cols-10 gap-4'>
                    <div className='space-y-2 col-span-7'>
                      <Label htmlFor='typeOfWork'>Type of Work</Label>
                      <Select
                        value={currentTicket.typeOfWork}
                        onValueChange={value =>
                          setCurrentTicket({
                            ...currentTicket,
                            typeOfWork: value as
                              | 'Create'
                              | 'In-progress'
                              | 'Done',
                          })
                        }
                      >
                        <SelectTrigger id='typeOfWork' className='w-full'>
                          <SelectValue placeholder='Select type of work' />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectLabel>Work Type</SelectLabel>
                            <SelectItem value='Create'>
                              <div className='flex items-center'>
                                <div className='h-2 w-2 rounded-full bg-blue-500 mr-2'></div>
                                Create
                              </div>
                            </SelectItem>
                            <SelectItem value='In-progress'>
                              <div className='flex items-center'>
                                <div className='h-2 w-2 rounded-full bg-amber-500 mr-2'></div>
                                In-progress
                              </div>
                            </SelectItem>
                            <SelectItem value='Done'>
                              <div className='flex items-center'>
                                <div className='h-2 w-2 rounded-full bg-green-500 mr-2'></div>
                                Done
                              </div>
                            </SelectItem>
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className='space-y-2 col-span-3'>
                      <Label htmlFor='timeSpend'>Time Spent (hours)</Label>
                      <Select
                        value={currentTicket.timeSpend.toString()}
                        onValueChange={value =>
                          setCurrentTicket({
                            ...currentTicket,
                            timeSpend: parseFloat(value),
                          })
                        }
                      >
                        <SelectTrigger id='timeSpend'>
                          <SelectValue placeholder='Select time spent' />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectLabel>Hours</SelectLabel>
                            <SelectItem value='0.5'>0.5</SelectItem>
                            <SelectItem value='1'>1</SelectItem>
                            <SelectItem value='1.5'>1.5</SelectItem>
                            <SelectItem value='2'>2</SelectItem>
                            <SelectItem value='2.5'>2.5</SelectItem>
                            <SelectItem value='3'>3</SelectItem>
                            <SelectItem value='3.5'>3.5</SelectItem>
                            <SelectItem value='4'>4</SelectItem>
                            <SelectItem value='4.5'>4.5</SelectItem>
                            <SelectItem value='5'>5</SelectItem>
                            <SelectItem value='5.5'>5.5</SelectItem>
                            <SelectItem value='6'>6</SelectItem>
                            <SelectItem value='6.5'>6.5</SelectItem>
                            <SelectItem value='7'>7</SelectItem>
                            <SelectItem value='7.5'>7.5</SelectItem>
                            <SelectItem value='8'>8</SelectItem>
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='description'>Description</Label>
                    <textarea
                      id='description'
                      className='flex h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
                      placeholder='Describe the work done'
                      value={currentTicket.description}
                      onChange={e =>
                        setCurrentTicket({
                          ...currentTicket,
                          description: e.target.value,
                        })
                      }
                    />
                  </div>
                  <Button
                    type='button'
                    onClick={handleAddTicket}
                    className='w-full flex items-center justify-center gap-2'
                    variant='default'
                  >
                    <svg
                      width='16'
                      height='16'
                      viewBox='0 0 24 24'
                      fill='none'
                      xmlns='http://www.w3.org/2000/svg'
                      className='mr-1'
                    >
                      <path
                        d='M12 5V19'
                        stroke='currentColor'
                        strokeWidth='2'
                        strokeLinecap='round'
                        strokeLinejoin='round'
                      />
                      <path
                        d='M5 12H19'
                        stroke='currentColor'
                        strokeWidth='2'
                        strokeLinecap='round'
                        strokeLinejoin='round'
                      />
                    </svg>
                    Add Ticket
                  </Button>
                </div>

                {/* Ticket List */}
                {tickets.length > 0 && (
                  <div className='mt-6 space-y-4'>
                    <div className='flex items-center justify-between mb-2'>
                      <div className='flex items-center'>
                        <h4 className='font-medium text-base'>Added Tickets</h4>
                        <Badge className='ml-2 bg-primary/10 text-primary hover:bg-primary/20 border-0'>
                          {tickets.length}
                        </Badge>
                      </div>
                    </div>

                    <div className='border rounded-lg shadow-sm'>
                      <Table className='[&_th]:text-muted-foreground [&_th]:font-medium [&_th]:text-xs'>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Status</TableHead>
                            <TableHead>Ticket ID</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead className='text-right'>
                              Time Spent
                            </TableHead>
                            <TableHead className='w-[70px]'></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {tickets.map(ticket => (
                            <TableRow key={ticket.id}>
                              <TableCell>
                                <Badge
                                  variant={
                                    ticket.typeOfWork === 'Create'
                                      ? 'default'
                                      : ticket.typeOfWork === 'In-progress'
                                        ? 'outline'
                                        : 'secondary'
                                  }
                                  className={
                                    ticket.typeOfWork === 'Create'
                                      ? 'bg-blue-100 text-blue-800 hover:bg-blue-100'
                                      : ticket.typeOfWork === 'In-progress'
                                        ? 'bg-amber-100 text-amber-800 hover:bg-amber-100'
                                        : 'bg-green-100 text-green-800 hover:bg-green-100'
                                  }
                                >
                                  {ticket.typeOfWork}
                                </Badge>
                              </TableCell>
                              <TableCell className='font-medium'>
                                {ticket.ticketId}
                              </TableCell>
                              <TableCell className='max-w-[250px] truncate'>
                                {ticket.description}
                              </TableCell>
                              <TableCell className='text-right'>
                                {ticket.timeSpend}h
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant='ghost'
                                  size='sm'
                                  onClick={() => handleRemoveTicket(ticket.id)}
                                  className='h-8 w-8 p-0 text-destructive hover:text-destructive/90 hover:bg-destructive/10'
                                >
                                  <span className='sr-only'>Remove</span>
                                  <svg
                                    xmlns='http://www.w3.org/2000/svg'
                                    width='16'
                                    height='16'
                                    viewBox='0 0 24 24'
                                    fill='none'
                                    stroke='currentColor'
                                    strokeWidth='2'
                                    strokeLinecap='round'
                                    strokeLinejoin='round'
                                  >
                                    <path d='M3 6h18'></path>
                                    <path d='M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2'></path>
                                  </svg>
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    <Separator className='my-4' />

                    <div className='flex justify-between items-center pt-2'>
                      <div className='text-sm text-muted-foreground'>
                        <span>
                          {tickets.length}{' '}
                          {tickets.length === 1 ? 'ticket' : 'tickets'}
                        </span>
                        <span className='mx-1'>•</span>
                        <span>
                          Total:{' '}
                          {tickets.reduce(
                            (sum, ticket) => sum + ticket.timeSpend,
                            0
                          )}
                          h
                        </span>
                      </div>
                      <Button
                        type='button'
                        onClick={handleSubmit}
                        disabled={isSubmitting || tickets.length === 0}
                        className='px-6'
                      >
                        {isSubmitting ? 'Submitting...' : 'Submit Timesheet'}
                      </Button>
                    </div>
                  </div>
                )}

                {tickets.length === 0 && (
                  <Alert className='mt-4'>
                    <AlertDescription>
                      Add at least one ticket to submit your timesheet.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
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
