export async function sendReminderEmail(from, to, subject, text) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_GLOBAL_URI}/api/send-all-reminders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from, to, subject, text }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to send email');
  return data;
}
