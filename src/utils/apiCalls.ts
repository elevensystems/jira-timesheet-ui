import axios from 'axios';

interface TimesheetData {
  userId: string;
  jiraToken: string;
  dates: string[];
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
