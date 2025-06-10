// __tests__/auth.test.ts
import request from 'supertest';
import { app } from '../../app'; 
import dbInstance from '../../config/config';
import User from '../../models/user.model'; // Import User model directly
import PasswordResetToken from '../../models/passwordResetToken.model'; // Import PasswordResetToken model directly
import EmailService from '../../email/email.service'; // Import the service to spy on it (will be mocked automatically)

// Use a describe block to group related tests and manage setup/teardown for this group
describe('Auth API Endpoints', () => {
  beforeEach(async () => {
    //await dbInstance.sync({ force: true }); // Uncomment if you want to reset DB before each test
  });

  const testUser = {
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123',
    confirmPassword: 'password123'
  };

  const testLoginCredentials = {
    email: 'test@example.com',
    password: 'password123'
  };

   const verificationTestUser = {
        name: 'Verify User',
        email: 'verify.test@example.com',
        password: 'verifypassword123',
        confirmPassword: 'verifypassword123'
    };

    const forgotPasswordTestUser = {
        name: 'Forgot User',
        email: 'forgot.test@example.com',
        password: 'forgotpassword123',
        confirmPassword: 'forgotpassword123'
    };

    const resetPasswordTestUser = {
        name: 'Reset User',
        email: 'reset.test@example.com',
        password: 'resetpassword123',
        confirmPassword: 'resetpassword123'
    };

  test('POST /api/v1/auth/register should create a new user', async () => {
    const response = await request(app)
      .post('/api/v1/auth/register')
      .send(testUser); // Use the defined test user data

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('Registration successful. Please check your email to verify your account.');
    expect(response.body.data).toHaveProperty('id');
    expect(response.body.data.email).toBe(testUser.email);
    expect(response.body.data).not.toHaveProperty('password');
  });

  test('POST /api/v1/auth/login should return a token for a registered user', async () => {
    // This test needs a user to be registered *for this specific test*.
    // Since the previous test creates 'test@example.com', if `beforeEach` doesn't
    // clear the database, this will use the same user.
    // For better isolation, register a NEW user here or ensure beforeEach clears DB.
    // Let's register a unique user for this test to ensure isolation.
    const uniqueUser = {
      name: 'Login User',
      email: 'login.test@example.com', // Unique email
      password: 'loginpassword123',
      confirmPassword: 'loginpassword123'
    };

    await request(app)
      .post('/api/v1/auth/register')
      .send(uniqueUser); // Register the unique user for this login test

    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: uniqueUser.email,
        password: uniqueUser.password
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('token');
    expect(typeof response.body.data.token).toBe('string');
  });

  test('POST /api/v1/auth/register should return 409 for duplicate email', async () => {
    // Register the user first
    await request(app)
      .post('/api/v1/auth/register')
      .send(testUser); // Assuming this user was registered in a previous test or beforeEach

    // Try to register the same user again
    const response = await request(app)
      .post('/api/v1/auth/register')
      .send(testUser);

    expect(response.status).toBe(409); // Assuming 409 Conflict for duplicate email
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Email already registered'); // Adjust based on your actual error message
  });

  test('POST /api/v1/auth/login should return 401 for invalid credentials', async () => {
    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'nonexistent@example.com',
        password: 'wrongpassword'
      });

    expect(response.status).toBe(401); // Assuming 401 Unauthorized
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Invalid credentials'); // Adjust based on your actual error message
  });

  test('GET /api/v1/auth/verify-email should verify user email', async () => {
        // Register a user specifically for verification
        await request(app)
            .post('/api/v1/auth/register')
            .send(verificationTestUser);

        const userInDb = await User.findOne({ where: { email: verificationTestUser.email } });
        expect(userInDb).toBeDefined();
        const verificationToken = userInDb?.verification_token;
        expect(verificationToken).toBeDefined();

        const response = await request(app)
            .get(`/api/v1/auth/verify-email?token=${verificationToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe('Email verified successfully. You can now log in.');

        // Verify the user's email_verified_at is set in the database
        const verifiedUserInDb = await User.findOne({ where: { email: verificationTestUser.email } });
        expect(verifiedUserInDb?.email_verified_at).not.toBeNull();
        expect(verifiedUserInDb?.verification_token).toBeNull();
    });

    test('GET /api/v1/auth/verify-email should return 404 for invalid token', async () => {
        const response = await request(app)
            .get('/api/v1/auth/verify-email?token=invalid-token');

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('Invalid verification token');
    });

    test('GET /api/v1/auth/verify-email should return 410 for expired token', async () => {
        // Register a user
        await request(app)
            .post('/api/v1/auth/register')
            .send(verificationTestUser); // Re-using user, it will overwrite the previous entry

        const userInDb = await User.findOne({ where: { email: verificationTestUser.email } });
        expect(userInDb).toBeDefined();
        const expiredToken = userInDb?.verification_token;

        // Manually set token expiry to a past date
        await userInDb?.update({ verification_token_expires: new Date(Date.now() - 2 * 60 * 60 * 1000) }); // 2 hours ago

        const response = await request(app)
            .get(`/api/v1/auth/verify-email?token=${expiredToken}`);

        expect(response.status).toBe(410);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('Verification link has expired. Please register again.');

        // Verify token is still present but expired (or destroyed if your controller does that)
        const expiredUserInDb = await User.findOne({ where: { email: verificationTestUser.email } });
        expect(expiredUserInDb?.email_verified_at).toBeNull();
        // If your controller `await user.destroy()` for expired tokens, this would be null
        expect(expiredUserInDb?.verification_token).toBe(expiredToken); // Should still be there, but marked as expired
    });


    test('POST /api/v1/auth/forgot-password should send reset link for existing user', async () => {
        // Register a user
        await request(app)
            .post('/api/v1/auth/register')
            .send(forgotPasswordTestUser);

        // Make sure user is verified to avoid email not verified error during login test
        const userToVerify = await User.findOne({ where: { email: forgotPasswordTestUser.email } });
        if (userToVerify) {
            await userToVerify.update({ email_verified_at: new Date(), verification_token: null });
        }


        const response = await request(app)
            .post('/api/v1/auth/forgot-password')
            .send({ email: forgotPasswordTestUser.email });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe('Password reset link sent to your email');

        // Verify that a password reset token was created in the DB
        const tokenRecord = await PasswordResetToken.findOne({ where: { email: forgotPasswordTestUser.email } });
        expect(tokenRecord).toBeDefined();
        expect(tokenRecord?.token).toBeDefined();
        expect(EmailService.sendPasswordResetEmail).toHaveBeenCalledTimes(1);
        expect(EmailService.sendPasswordResetEmail).toHaveBeenCalledWith(
            forgotPasswordTestUser.email,
            forgotPasswordTestUser.name,
            expect.any(String), // The token will be a UUID string
            expect.any(Date)    // The expiry will be a Date object
        );
    });

    test('POST /api/v1/auth/forgot-password should return success for non-existent email (security)', async () => {
        const response = await request(app)
            .post('/api/v1/auth/forgot-password')
            .send({ email: 'nonexistent-forgot@example.com' });

        expect(response.status).toBe(200); // Should return 200 for security reasons
        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe('If an account exists, you will receive a password reset link');
        expect(EmailService.sendPasswordResetEmail).not.toHaveBeenCalled(); // No email should be sent
    });


    test('POST /api/v1/auth/reset-password should reset user password', async () => {
        // 1. Register a user
        await request(app)
            .post('/api/v1/auth/register')
            .send(resetPasswordTestUser);

        // Manually verify email for login later
        const userInDb = await User.findOne({ where: { email: resetPasswordTestUser.email } });
        if (userInDb) {
            await userInDb.update({ email_verified_at: new Date(), verification_token: null });
        }

        // 2. Request a password reset link
        await request(app)
            .post('/api/v1/auth/forgot-password')
            .send({ email: resetPasswordTestUser.email });

        // 3. Get the reset token from the database
        const tokenRecord = await PasswordResetToken.findOne({ where: { email: resetPasswordTestUser.email } });
        expect(tokenRecord).toBeDefined();
        const resetToken = tokenRecord?.token;
        expect(resetToken).toBeDefined();

        const newPassword = 'newStrongPassword123';

        // 4. Reset the password
        const response = await request(app)
            .post('/api/v1/auth/reset-password')
            .send({
                token: resetToken,
                password: newPassword,
                confirmPassword: newPassword // Assuming your controller expects this
            });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe('Password updated successfully');

        // Verify that the reset token is deleted from the database
        const deletedTokenRecord = await PasswordResetToken.findOne({ where: { email: resetPasswordTestUser.email } });
        expect(deletedTokenRecord).toBeNull();

        // Try logging in with the new password
        const loginResponse = await request(app)
            .post('/api/v1/auth/login')
            .send({
                email: resetPasswordTestUser.email,
                password: newPassword
            });

        expect(loginResponse.status).toBe(200);
        expect(loginResponse.body.success).toBe(true);
        expect(loginResponse.body.data).toHaveProperty('token');
    });

    test('POST /api/v1/auth/reset-password should return 400 for invalid/expired token', async () => {
        const response = await request(app)
            .post('/api/v1/auth/reset-password')
            .send({
                token: 'non-existent-token',
                password: 'newPassword'
            });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('Invalid or expired reset token');
    });

    test('POST /api/v1/auth/logout should return success', async () => {
        // For JWT, logout is often client-side, but a server endpoint can be for confirmation
        const response = await request(app)
            .post('/api/v1/auth/logout');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe('Logged out successfully');
    });


});