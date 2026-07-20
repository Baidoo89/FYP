type EmailInput = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

type EmailResult = {
  delivered: boolean;
  provider: string;
  id?: string;
};

function cleanEnvValue(value?: string | null) {
  const trimmed = value?.trim();

  if (!trimmed) {
    return '';
  }

  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim();
  }

  return trimmed;
}

function envValue(...names: string[]) {
  for (const name of names) {
    const value = cleanEnvValue(process.env[name]);

    if (value) {
      return value;
    }
  }

  return '';
}

function getEmailFrom() {
  return envValue('EMAIL_FROM', 'SMTP_FROM') || 'GCTU Promotion System <gctu-promotion@techdalt.com>';
}

function logDevelopmentEmail(input: EmailInput, provider: string): EmailResult {
  console.log('--- Development email ---');
  console.log(`To: ${input.to}`);
  console.log(`Subject: ${input.subject}`);
  console.log(input.text);
  console.log('--- End development email ---');
  return { delivered: false, provider };
}

export async function sendEmail(input: EmailInput): Promise<EmailResult> {
  const provider = (envValue('EMAIL_PROVIDER') || 'development').toLowerCase();

  if (provider === 'development') {
    return logDevelopmentEmail(input, provider);
  }

  if (provider === 'resend') {
    const apiKey = envValue('RESEND_API_KEY');

    if (!apiKey) {
      throw new Error('RESEND_API_KEY is required when EMAIL_PROVIDER=resend');
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: getEmailFrom(),
        to: input.to,
        subject: input.subject,
        text: input.text,
        html: input.html,
      }),
    });

    const payload = await response.json().catch(() => null) as { id?: string; message?: string; error?: string } | null;

    if (!response.ok) {
      const message = payload?.message || payload?.error || `Resend email delivery failed with status ${response.status}`;
      throw new Error(message);
    }

    return { delivered: true, provider, id: payload?.id };
  }

  console.warn(`EMAIL_PROVIDER=${provider} is not configured. Email was logged only.`);
  return logDevelopmentEmail(input, provider);
}
