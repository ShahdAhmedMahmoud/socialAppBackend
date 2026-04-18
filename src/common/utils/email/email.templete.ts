export const emailTemplate = (otp:number) => {

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>New Anonymous Message</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f4f4f4;
      font-family: Arial, sans-serif;
    }
    .container {
      width: 100%;
      padding: 20px 0;
    }
    .email-box {
      max-width: 600px;
      background: #ffffff;
      margin: auto;
      border-radius: 10px;
      overflow: hidden;
      box-shadow: 0 4px 10px rgba(0,0,0,0.1);
    }
    .header {
      background: #4CAF50;
      color: #ffffff;
      text-align: center;
      padding: 20px;
      font-size: 24px;
      font-weight: bold;
    }
    .content {
      padding: 20px;
      color: #333333;
      line-height: 1.6;
    }
    .message-box {
      background: #f9f9f9;
      border-left: 5px solid #4CAF50;
      padding: 15px;
      margin: 20px 0;
      font-style: italic;
    }
    .button {
      display: inline-block;
      padding: 12px 20px;
      background: #4CAF50;
      color: #ffffff;
      text-decoration: none;
      border-radius: 5px;
      margin-top: 10px;
    }
    .footer {
      text-align: center;
      padding: 15px;
      font-size: 12px;
      color: #888888;
    }
  </style>
</head>
<body>

  <div class="container">
    <div class="email-box">

      <div class="header">
        📩 New Anonymous Message
      </div>

      <div class="content">
        <p>Hello,</p>

        <p>You’ve just received a new anonymous message on your Saraha app 👀</p>

        <div class="message-box">
          code: ${otp}
        </div>

        <p>Curious who sent it? 🤫 Log in to your account to see more details.</p>

        <a href="{{appLink}}" class="button">View Message</a>
      </div>

      <div class="footer">
        © 2026 Saraha App | All rights reserved
      </div>

    </div>
  </div>

</body>
</html>`;
}