'use client';

import React, { useMemo, useState } from 'react';

import {
  BookOpen,
  CheckCircle,
  CircleCheckBig,
  Eye,
  FileText,
  Pencil,
  Trash2,
} from 'lucide-react';
import { ZodError, z } from 'zod';

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
import { toast } from '@/components/ui/sonner';
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

// Zod v4 schemas
const Step1Schema = z.object({
  username: z
    .string()
    .min(1, 'Username is required')
    .max(128, 'Username too long'),
  token: z.string().min(1, 'Jira Token is required').max(256, 'Token too long'),
});

const TicketSchema = z.object({
  id: z.string().optional().default(''),
  typeOfWork: z.enum(['Create', 'Review', 'Study']),
  description: z.string().min(1, 'Description is required').max(1000),
  timeSpend: z.number().min(0.25, 'Min 0.25 hour').max(8, 'Max 8 hours'),
  ticketId: z.string().min(1, 'Ticket ID is required').max(128),
});

const DatesSchema = z
  .string()
  .min(1, 'Dates are required')
  .refine((val: string) => isValidDatesList(val), {
    message: 'Dates must be in format: 20/Aug/25, 21/Aug/25, 22/Aug/25',
  });

const SubmitPayloadSchema = z.object({
  username: Step1Schema.shape.username,
  token: Step1Schema.shape.token,
  dates: DatesSchema,
  tickets: z.array(TicketSchema).min(1, 'Please add at least one ticket'),
});

// removed global error messaging helper

function zodToFieldErrors(err: unknown, defaultKey?: string) {
  const result: Record<string, string> = {};
  if (err instanceof ZodError) {
    for (const issue of err.issues) {
      const key = (issue.path[0] as string | undefined) ?? defaultKey;
      if (key) result[key] = issue.message;
    }
  }
  return result;
}

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
  const [username, setUsername] = useState('');
  const [token, setToken] = useState('');
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
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
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
    // sanitize inputs
    const sanitized = {
      id: '',
      typeOfWork: currentTicket.typeOfWork,
      description: sanitizeDescription(currentTicket.description),
      timeSpend: sanitizeHours(currentTicket.timeSpend),
      ticketId: sanitizeTicketId(currentTicket.ticketId),
    } as const;

    try {
      TicketSchema.parse(sanitized);
      setFieldErrors(prev => {
        const next = { ...prev } as Record<string, string>;
        delete next.ticketId;
        delete next.description;
        delete next.timeSpend;
        delete next.typeOfWork;
        return next;
      });
    } catch (e) {
      setFieldErrors(prev => ({ ...prev, ...zodToFieldErrors(e) }));
      return;
    }

    // Generate a unique ID for this ticket for tracking in the UI
    const newTicket = {
      ...sanitized,
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
  };

  const handleRemoveTicket = (id: string) => {
    setTickets(tickets.filter(ticket => ticket.id !== id));
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate first step inputs using Zod
    const safeUser = sanitizeAccount(username);
    const safeToken = sanitizeToken(token);

    try {
      Step1Schema.parse({ username: safeUser, token: safeToken });
      setUsername(safeUser);
      setToken(safeToken);
      setFieldErrors(prev => {
        const next = { ...prev } as Record<string, string>;
        delete next.username;
        delete next.token;
        return next;
      });
      setStep(2);
    } catch (e) {
      setFieldErrors(prev => ({ ...prev, ...zodToFieldErrors(e) }));
    }
  };

  // no-op back handler removed in this flow version

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault?.();
    setIsSubmitting(true);

    try {
      const safeDates = sanitizeDates(dates);
      const sanitizedTickets = tickets.map(t => ({
        id: t.id,
        typeOfWork: t.typeOfWork,
        description: sanitizeDescription(t.description),
        timeSpend: sanitizeHours(t.timeSpend),
        ticketId: sanitizeTicketId(t.ticketId),
      }));

      const payload = {
        username: sanitizeAccount(username),
        token: sanitizeToken(token),
        dates: safeDates,
        tickets: sanitizedTickets,
      };

      SubmitPayloadSchema.parse(payload);

      // Submit timesheet with tickets
      await submitTimesheet({
        username: payload.username,
        token: payload.token,
        dates: payload.dates,
        tickets: payload.tickets.map(t => ({
          typeOfWork: t.typeOfWork,
          description: t.description,
          timeSpend: t.timeSpend,
          ticketId: t.ticketId,
        })),
      });

      showMessageDialog('Success', 'Timesheet submitted successfully!');
      setStep(4);
    } catch (err) {
      setFieldErrors(prev => ({ ...prev, ...zodToFieldErrors(err) }));
      const message = err instanceof Error ? err.message : 'Submission failed.';
      toast.error(message);
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
          <TabsList className='grid w-full grid-cols-3'>
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
        {/* Flow 1: Setup */}
        {step === 1 && (
          <form onSubmit={handleNext} className='space-y-6'>
            <div className='space-y-1'>
              <Label
                className={
                  fieldErrors.username
                    ? 'font-semibold text-destructive'
                    : 'font-semibold'
                }
              >
                FPT account
              </Label>
              <Input
                placeholder='Insert your FPT account (E.g., ThaoLNP5)'
                value={username}
                aria-invalid={fieldErrors.username ? true : undefined}
                onChange={e => {
                  setUsername(sanitizeAccount(e.target.value));
                  if (fieldErrors.username) {
                    setFieldErrors(prev => {
                      const next = { ...prev } as Record<string, string>;
                      delete next.username;
                      return next;
                    });
                  }
                }}
              />
              {fieldErrors.username && (
                <p className='text-sm text-destructive mt-1'>
                  {fieldErrors.username}
                </p>
              )}
            </div>
            <div className='space-y-1'>
              <Label
                className={
                  fieldErrors.token
                    ? 'font-semibold text-destructive'
                    : 'font-semibold'
                }
              >
                Jira Token
              </Label>
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
                value={token}
                aria-invalid={fieldErrors.token ? true : undefined}
                onChange={e => {
                  setToken(sanitizeToken(e.target.value));
                  if (fieldErrors.token) {
                    setFieldErrors(prev => {
                      const next = { ...prev } as Record<string, string>;
                      delete next.token;
                      return next;
                    });
                  }
                }}
              />
              {fieldErrors.token && (
                <p className='text-sm text-destructive mt-1'>
                  {fieldErrors.token}
                </p>
              )}
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
              <Label
                className={
                  fieldErrors.dates
                    ? 'font-semibold text-destructive'
                    : 'font-semibold'
                }
              >
                Your Worklog Dates
              </Label>
              <ol className='text-sm text-muted-foreground pl-4 list-decimal space-y-1'>
                <li>Click on your Jira Project → Project worklog</li>
                <li>
                  Fill in your account name and the date range, then search your
                  missing work log dates
                </li>
                <li>Copy your missing work log dates</li>
              </ol>
              <textarea
                className={`flex h-20 w-full rounded-md border bg-background px-3 py-2 text-sm ${fieldErrors.dates ? 'border-destructive' : 'border-input'}`}
                placeholder='E.g., 20/Aug/25, 21/Aug/25, 22/Aug/25, 25/Aug/25'
                value={dates}
                aria-invalid={fieldErrors.dates ? true : undefined}
                onChange={e => {
                  setDates(sanitizeDates(e.target.value));
                  if (fieldErrors.dates) {
                    setFieldErrors(prev => {
                      const next = { ...prev } as Record<string, string>;
                      delete next.dates;
                      return next;
                    });
                  }
                }}
              />
              {fieldErrors.dates && (
                <p className='text-sm text-destructive mt-1'>
                  {fieldErrors.dates}
                </p>
              )}
            </div>
            <div className='grid gap-4 md:grid-cols-2'>
              <div className='space-y-1'>
                <Label
                  className={
                    fieldErrors.ticketId
                      ? 'font-semibold text-destructive'
                      : 'font-semibold'
                  }
                >
                  Ticket ID
                </Label>
                <Input
                  placeholder='Enter Jira Ticket (E.g., C99KBBATC2025-37)'
                  value={currentTicket.ticketId}
                  aria-invalid={fieldErrors.ticketId ? true : undefined}
                  onChange={e => {
                    setCurrentTicket({
                      ...currentTicket,
                      ticketId: sanitizeTicketId(e.target.value),
                    });
                    if (fieldErrors.ticketId) {
                      setFieldErrors(prev => {
                        const next = { ...prev } as Record<string, string>;
                        delete next.ticketId;
                        return next;
                      });
                    }
                  }}
                />
                {fieldErrors.ticketId && (
                  <p className='text-sm text-destructive mt-1'>
                    {fieldErrors.ticketId}
                  </p>
                )}
              </div>
              <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-1'>
                  <Label
                    className={
                      fieldErrors.typeOfWork
                        ? 'font-semibold text-destructive'
                        : 'font-semibold'
                    }
                  >
                    Type of work
                  </Label>
                  <Select
                    value={currentTicket.typeOfWork}
                    onValueChange={v => {
                      setCurrentTicket({
                        ...currentTicket,
                        typeOfWork: v as Ticket['typeOfWork'],
                      });
                      if (fieldErrors.typeOfWork) {
                        setFieldErrors(prev => {
                          const next = { ...prev } as Record<string, string>;
                          delete next.typeOfWork;
                          return next;
                        });
                      }
                    }}
                  >
                    <SelectTrigger
                      aria-invalid={fieldErrors.typeOfWork ? true : undefined}
                    >
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
                  <Label
                    className={
                      fieldErrors.timeSpend
                        ? 'font-semibold text-destructive'
                        : 'font-semibold'
                    }
                  >
                    Time Spent (hrs)
                  </Label>
                  <Input
                    type='number'
                    step='0.25'
                    min='0.25'
                    value={currentTicket.timeSpend}
                    aria-invalid={fieldErrors.timeSpend ? true : undefined}
                    onChange={e => {
                      setCurrentTicket({
                        ...currentTicket,
                        timeSpend: sanitizeHours(e.target.value),
                      });
                      if (fieldErrors.timeSpend) {
                        setFieldErrors(prev => {
                          const next = { ...prev } as Record<string, string>;
                          delete next.timeSpend;
                          return next;
                        });
                      }
                    }}
                  />
                  {fieldErrors.timeSpend && (
                    <p className='text-sm text-destructive mt-1'>
                      {fieldErrors.timeSpend}
                    </p>
                  )}
                </div>
              </div>
            </div>
            <div className='space-y-1'>
              <Label
                className={
                  fieldErrors.description
                    ? 'font-semibold text-destructive'
                    : 'font-semibold'
                }
              >
                Description
              </Label>
              <textarea
                className={`flex h-24 w-full rounded-md border bg-background px-3 py-2 text-sm ${fieldErrors.description ? 'border-destructive' : 'border-input'}`}
                placeholder="Copy Jira Ticket 's description (E.g., Create project plan, do project report...)"
                value={currentTicket.description}
                aria-invalid={fieldErrors.description ? true : undefined}
                onChange={e => {
                  setCurrentTicket({
                    ...currentTicket,
                    description: sanitizeDescription(e.target.value),
                  });
                  if (fieldErrors.description) {
                    setFieldErrors(prev => {
                      const next = { ...prev } as Record<string, string>;
                      delete next.description;
                      return next;
                    });
                  }
                }}
              />
              {fieldErrors.description && (
                <p className='text-sm text-destructive mt-1'>
                  {fieldErrors.description}
                </p>
              )}
            </div>
            <div className='flex justify-center'>
              <Button
                className='hover:bg-green-200'
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
                      <TableHeader className='bg-muted'>
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
                                className='hover:bg-red-200'
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
                        const safe = sanitizeDates(dates);
                        setDates(safe);
                        try {
                          DatesSchema.parse(safe);
                          setFieldErrors(prev => {
                            const next = { ...prev } as Record<string, string>;
                            delete next.dates;
                            return next;
                          });
                          setStep(3);
                        } catch (e) {
                          setFieldErrors(prev => ({
                            ...prev,
                            ...zodToFieldErrors(e, 'dates'),
                          }));
                        }
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
                  <TableHeader className='bg-muted'>
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
                            className='hover:bg-red-200'
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
                    className='w-40'
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
            <CircleCheckBig className='w-24 h-24' />
            <br />
            <p className='text-lg font-medium'>Successfully Added !</p>
            <div className='mt-6'>
              <Button
                onClick={() => {
                  setUsername('');
                  setToken('');
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
