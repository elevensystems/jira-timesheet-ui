import axios from 'axios';

interface Ticket {
  id?: string; // For UI tracking only, not needed for API
  typeOfWork: 'Create' | 'Review' | 'Study' | 'Correct' | 'Translate';
  description: string;
  timeSpend: number;
  ticketId: string;
}

interface TimesheetData {
  username: string;
  token: string;
  dates: string;
  tickets?: Ticket[];
}

const API_ENDPOINT = process.env.NEXT_PUBLIC_API_URL;

export async function submitTimesheet(
  data: TimesheetData
): Promise<{ success: boolean; message: string; submittedDates?: string[] }> {
  try {
    // Get API URL from environment variable and construct the endpoint
    const apiUrl = `${API_ENDPOINT}/timesheet`;
    const response = await axios.post(apiUrl, data);
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
