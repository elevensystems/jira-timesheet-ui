import axios from 'axios';

interface Ticket {
  id?: string; // For UI tracking only, not needed for API
  typeOfWork: 'Create' | 'In-progress' | 'Done';
  description: string;
  timeSpend: number;
  ticketId: string;
}

interface TimesheetData {
  userId: string;
  jiraToken: string;
  dates: string[];
  tickets?: Ticket[];
}

export async function submitTimesheet(
  data: TimesheetData
): Promise<{ success: boolean; message: string; submittedDates?: string[] }> {
  try {
    // This is a placeholder API endpoint. Replace with your actual endpoint.
    const response = await axios.post('/api/timesheet', data);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(
        error.response?.data?.message ||
          'Error submitting timesheet. Please check your connection and try again.'
      );
    }
    throw error;
  }
}
