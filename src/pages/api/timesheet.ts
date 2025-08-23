import type { NextApiRequest, NextApiResponse } from 'next';

type Data = {
  success?: boolean;
  message: string;
  submittedDates?: string[];
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const data = req.body;

    if (
      !data?.userId ||
      !data?.jiraToken ||
      !Array.isArray(data?.dates) ||
      data.dates.length === 0
    ) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    console.log('Timesheet submission data:', data);

    await new Promise(resolve => setTimeout(resolve, 1000));

    return res.status(200).json({
      success: true,
      message: 'Timesheet submitted successfully',
      submittedDates: data.dates,
    });
  } catch (error) {
    console.error('Error processing timesheet:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
