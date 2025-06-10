// src/__mocks__/email/email.service.ts
const EmailService = {
  sendVerificationEmail: jest.fn(async (email: string, name: string, token: string, expires: Date) => {
    console.log(`Mock EmailService: Verification email sent to ${email} with token ${token}`);
    // You can store these calls in a mock property for later assertions if needed
    // EmailService.sendVerificationEmail.mock.calls.push({ email, name, token, expires });
  }),
  sendPasswordResetEmail: jest.fn(async (email: string, name: string, token: string, expires: Date) => {
    console.log(`Mock EmailService: Password reset email sent to ${email} with token ${token}`);
    // EmailService.sendPasswordResetEmail.mock.calls.push({ email, name, token, expires });
  }),
  // Add other email sending methods if they exist
};

export default EmailService;