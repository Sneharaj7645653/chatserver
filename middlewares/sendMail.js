import axios from "axios";

const sendMail = async (email, subject, otp) => {
  // Get the sender email and API key from environment variables
  const senderEmail = process.env.SENDER_EMAIL;
  const apiKey = process.env.BREVO_API_KEY;

  // Define the HTML content for the email
  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>OTP Verification</title>
    <style>
        body { font-family: Arial, sans-serif; }
        .container { text-align: center; padding: 20px; }
        .otp { font-size: 36px; color: #7b68ee; }
    </style>
</head>
<body>
    <div class="container">
        <h1>OTP Verification</h1>
        <p>Hello ${email} your (One-Time Password) for your account verification is.</p>
        <p class="otp">${otp}</p> 
    </div>
</body>
</html>
`;

  // This is the new API request to Brevo
  try {
    await axios.post(
      "https://api.brevo.com/v3/smtp/email", // Brevo's API endpoint
      {
        // Body of the request
        sender: {
          email: senderEmail,
        },
        to: [
          {
            email: email,
          },
        ],
        subject: subject,
        htmlContent: htmlContent,
      },
      {
        // Headers for authentication
        headers: {
          "api-key": apiKey,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    // If the API call fails, log the detailed error
    console.error("Brevo API Error:", error.response ? error.response.data : error.message);
    // Re-throw the error so our userController can catch it
    throw new Error("Failed to send email via Brevo API");
  }
};

export default sendMail;