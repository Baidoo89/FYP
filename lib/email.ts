type EmailInput = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

export async function sendEmail(input: EmailInput) {
  const provider = process.env.EMAIL_PROVIDER || 'development';

  if (provider === 'development') {
    console.log('--- Development email ---');
    console.log(`To: ${input.to}`);
    console.log(`Subject: ${input.subject}`);
    console.log(input.text);
    console.log('--- End development email ---');
    return { delivered: false, provider };
  }

  console.warn(`EMAIL_PROVIDER=${provider} is not configured yet. Email was logged only.`);
  console.log(input);
  return { delivered: false, provider };
}
