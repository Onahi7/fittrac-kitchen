import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

const FROM_EMAIL = process.env.SES_FROM_EMAIL ?? "noreply@fittrac.kitchen";
const AWS_REGION = process.env.AWS_REGION ?? "us-east-1";

function buildClient(): SESClient | null {
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    return null;
  }
  return new SESClient({
    region: AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });
}

const client = buildClient();

const BASE_HTML = (body: string) => `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9f2ee;font-family:Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:24px;">
    <div style="background:#154212;padding:24px 32px;border-radius:16px;text-align:center;margin-bottom:24px;">
      <div style="font-size:28px;margin-bottom:4px;">🌿</div>
      <h1 style="color:#fff;margin:0;font-size:22px;font-weight:700;">Fittrac Kitchen</h1>
      <p style="color:#9dd090;margin:6px 0 0;font-size:13px;">The Earth's Apothecary</p>
    </div>
    <div style="background:#fff;border-radius:16px;padding:28px;margin-bottom:16px;">
      ${body}
    </div>
    <p style="text-align:center;color:#72796e;font-size:12px;margin:0;">
      © 2026 Fittrac Kitchen · Nourishing Nigeria
    </p>
  </div>
</body>
</html>`;

export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<boolean> {
  if (!client) {
    console.info("[Email] SES not configured — skipping:", params.subject, "→", params.to);
    return false;
  }
  try {
    await client.send(
      new SendEmailCommand({
        Source: `Fittrac Kitchen <${FROM_EMAIL}>`,
        Destination: { ToAddresses: [params.to] },
        Message: {
          Subject: { Data: params.subject, Charset: "UTF-8" },
          Body: {
            Html: { Data: params.html, Charset: "UTF-8" },
            Text: {
              Data: params.text ?? params.html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim(),
              Charset: "UTF-8",
            },
          },
        },
      })
    );
    console.info("[Email] Sent:", params.subject, "→", params.to);
    return true;
  } catch (err: any) {
    console.error("[Email] SES error:", err.message);
    return false;
  }
}

export async function sendOrderConfirmation(params: {
  to: string;
  customerName: string;
  orderId: string;
  items: Array<{ name: string; price: number }>;
  total: number;
  fulfillment: string;
  deliveryDate?: string;
}): Promise<boolean> {
  const rows = params.items
    .map(
      (i) =>
        `<tr><td style="padding:8px 4px;border-bottom:1px solid #f3ede8;">${i.name}</td>
         <td style="padding:8px 4px;border-bottom:1px solid #f3ede8;text-align:right;font-weight:600;">₦${i.price.toLocaleString()}</td></tr>`
    )
    .join("");

  const body = `
    <h2 style="color:#154212;margin:0 0 8px;">Order Confirmed! 🎉</h2>
    <p style="color:#42493e;margin:0 0 20px;">Dear <strong>${params.customerName}</strong>, your order has been received.</p>
    <div style="background:#f9f2ee;border-radius:12px;padding:16px;margin-bottom:20px;">
      <p style="margin:0 0 4px;font-size:12px;color:#72796e;text-transform:uppercase;letter-spacing:1px;">Order ID</p>
      <p style="margin:0;font-size:18px;font-weight:700;color:#154212;">${params.orderId}</p>
    </div>
    <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
      <thead><tr style="background:#f3ede8;">
        <th style="padding:10px 4px;text-align:left;font-size:13px;color:#72796e;">Item</th>
        <th style="padding:10px 4px;text-align:right;font-size:13px;color:#72796e;">Price</th>
      </tr></thead>
      <tbody>${rows}</tbody>
      <tfoot><tr>
        <td style="padding:12px 4px;font-weight:700;font-size:16px;color:#154212;">Total</td>
        <td style="padding:12px 4px;font-weight:700;font-size:16px;color:#154212;text-align:right;">₦${params.total.toLocaleString()}</td>
      </tr></tfoot>
    </table>
    <div style="display:flex;gap:12px;flex-wrap:wrap;">
      <span style="background:#e8f5e9;color:#154212;padding:6px 14px;border-radius:100px;font-size:13px;font-weight:600;">
        📦 ${params.fulfillment === "delivery" ? "Home Delivery" : "Pickup"}
      </span>
      ${params.deliveryDate ? `<span style="background:#fff8f0;color:#8b500a;padding:6px 14px;border-radius:100px;font-size:13px;font-weight:600;">📅 ${params.deliveryDate}</span>` : ""}
    </div>
    <p style="margin:20px 0 0;color:#42493e;font-size:14px;">Thank you for choosing Fittrac Kitchen. Your health is our priority. 🌿</p>
  `;

  return sendEmail({
    to: params.to,
    subject: `Order Confirmed — ${params.orderId} | Fittrac Kitchen`,
    html: BASE_HTML(body),
  });
}

export async function sendWelcomeEmail(params: {
  to: string;
  name: string;
}): Promise<boolean> {
  const body = `
    <h2 style="color:#154212;margin:0 0 8px;">Welcome to Fittrac Kitchen! 🌿</h2>
    <p style="color:#42493e;margin:0 0 16px;">Dear <strong>${params.name}</strong>, welcome to Nigeria's premier health-focused food platform.</p>
    <p style="color:#42493e;margin:0 0 16px;">Your personalised wellness journey starts now. Explore meals curated for your health conditions, track your nutrition, and connect with our clinical team.</p>
    <div style="background:#f3ede8;border-radius:12px;padding:20px;margin-bottom:16px;">
      <p style="margin:0 0 8px;font-weight:600;color:#154212;">What you can do:</p>
      <ul style="margin:0;padding-left:20px;color:#42493e;line-height:1.8;">
        <li>Browse health-condition-specific meals</li>
        <li>Track weight, nutrition & water intake</li>
        <li>Book consultations with doctors & nutritionists</li>
        <li>Chat with our AI Health Coach</li>
      </ul>
    </div>
    <p style="margin:0;color:#72796e;font-size:13px;">Questions? Reply to this email and our team will help.</p>
  `;

  return sendEmail({
    to: params.to,
    subject: `Welcome to Fittrac Kitchen, ${params.name}! 🌿`,
    html: BASE_HTML(body),
  });
}

export async function sendTestResultNotification(params: {
  to: string;
  patientName: string;
  testName: string;
  value?: string;
  flag?: string;
}): Promise<boolean> {
  const flagColor = params.flag === "H" ? "#dc2626" : params.flag === "L" ? "#2563eb" : "#154212";
  const flagLabel = params.flag === "H" ? "⬆ High" : params.flag === "L" ? "⬇ Low" : "✓ Normal";

  const body = `
    <h2 style="color:#154212;margin:0 0 8px;">Lab Result Available 🔬</h2>
    <p style="color:#42493e;margin:0 0 20px;">Dear <strong>${params.patientName}</strong>, your test result is ready.</p>
    <div style="background:#f9f2ee;border-radius:12px;padding:20px;margin-bottom:16px;">
      <p style="margin:0 0 4px;font-size:12px;color:#72796e;text-transform:uppercase;letter-spacing:1px;">Test</p>
      <p style="margin:0 0 12px;font-size:20px;font-weight:700;color:#1d1b19;">${params.testName}</p>
      ${params.value ? `<p style="margin:0 0 4px;font-size:12px;color:#72796e;">Result: <strong>${params.value}</strong></p>` : ""}
      <span style="background:${flagColor}1a;color:${flagColor};padding:4px 12px;border-radius:100px;font-size:13px;font-weight:600;">${flagLabel}</span>
    </div>
    <p style="color:#42493e;margin:0 0 16px;">Please log in to the Fittrac Kitchen app to view your full results and clinical notes.</p>
    <p style="color:#72796e;font-size:13px;margin:0;">For urgent concerns, contact your assigned healthcare provider directly.</p>
  `;

  return sendEmail({
    to: params.to,
    subject: `Lab Result Ready: ${params.testName} | Fittrac Kitchen`,
    html: BASE_HTML(body),
  });
}

export async function sendPrescriptionNotification(params: {
  to: string;
  patientName: string;
  doctorName: string;
  diagnosis: string;
  medicationCount: number;
}): Promise<boolean> {
  const body = `
    <h2 style="color:#154212;margin:0 0 8px;">New Prescription 💊</h2>
    <p style="color:#42493e;margin:0 0 20px;">Dear <strong>${params.patientName}</strong>, a new prescription has been issued for you.</p>
    <div style="background:#f9f2ee;border-radius:12px;padding:20px;margin-bottom:16px;">
      <p style="margin:0 0 8px;"><strong>Doctor:</strong> ${params.doctorName}</p>
      <p style="margin:0 0 8px;"><strong>Diagnosis:</strong> ${params.diagnosis}</p>
      <p style="margin:0;"><strong>Medications:</strong> ${params.medicationCount} prescribed</p>
    </div>
    <p style="color:#42493e;margin:0 0 16px;">View your full prescription and medication instructions in the Fittrac Kitchen app.</p>
    <p style="color:#72796e;font-size:13px;margin:0;">Always consult your doctor before making changes to your medication.</p>
  `;

  return sendEmail({
    to: params.to,
    subject: `New Prescription from ${params.doctorName} | Fittrac Kitchen`,
    html: BASE_HTML(body),
  });
}

export async function sendConsultationReminder(params: {
  to: string;
  patientName: string;
  doctorName: string;
  date: string;
  time: string;
}): Promise<boolean> {
  const body = `
    <h2 style="color:#154212;margin:0 0 8px;">Consultation Reminder 📅</h2>
    <p style="color:#42493e;margin:0 0 20px;">Dear <strong>${params.patientName}</strong>, you have an upcoming consultation.</p>
    <div style="background:#f9f2ee;border-radius:12px;padding:20px;margin-bottom:16px;">
      <p style="margin:0 0 8px;"><strong>With:</strong> ${params.doctorName}</p>
      <p style="margin:0 0 8px;"><strong>Date:</strong> ${params.date}</p>
      <p style="margin:0;"><strong>Time:</strong> ${params.time}</p>
    </div>
    <p style="color:#42493e;margin:0;">Open the Fittrac Kitchen app to join your consultation when it's time.</p>
  `;

  return sendEmail({
    to: params.to,
    subject: `Consultation Reminder: ${params.date} at ${params.time} | Fittrac Kitchen`,
    html: BASE_HTML(body),
  });
}
