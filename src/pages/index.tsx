import Form from '@/components/Form';

export default function Home() {
  return (
    <div className='bg-gray-50 min-h-screen'>
      <div className='max-w-5xl mx-auto py-12 px-4 sm:px-6 lg:px-8'>
        <div className='text-center mb-8'>
          <h1 className='text-4xl font-extrabold tracking-tight'>
            Project Worklog
          </h1>
          <p className='mt-3 text-base text-muted-foreground'>
            Check the instruction{' '}
            <a
              href='https://support.atlassian.com/atlassian-account/docs/manage-api-tokens-for-your-atlassian-account/'
              target='_blank'
              rel='noreferrer'
              className='underline text-primary'
            >
              here
            </a>
          </p>
        </div>

        <Form />
      </div>
    </div>
  );
}
