import Form from '@/components/Form';

export default function Home() {
  return (
    <div className='bg-gray-100 min-h-screen'>
      <div className='max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8'>
        <div className='text-center mb-10'>
          <h1 className='text-3xl font-extrabold text-gray-900 sm:text-4xl'>
            Jira Timesheet
          </h1>
          <p className='mt-4 text-lg text-gray-600'>
            Enter your details to submit your timesheet
          </p>
        </div>

        <Form />
      </div>
    </div>
  );
}
