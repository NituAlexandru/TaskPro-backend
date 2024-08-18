# TaskPro Backend

This is the backend server for the TaskPro project, a task management application that includes features such as user authentication, board management, and collaboration.

---

## Getting Started

Follow these steps to set up and run the TaskPro backend locally.

1. **Clone the Repository**

```bash
git clone https://github.com/NituAlexandru/TaskPro-Backend.git
cd TaskPro-Backend
```

2. **Install Dependencies**
   npm install

3. **Set up the Environment**
   - PORT=4500
   - DB_URI=<your_mongodb_connection_string>
   - SECRET_KEY=<your_secret_key>
   - BACKEND_URL=http://localhost:4500
   - FRONT_URL=http://localhost:5173
   - JWT_SECRET=<your_jwt_secret>
   - CLOUDINARY_CLOUD_NAME=<your_cloudinary_cloud_name>
   - CLOUDINARY_API_KEY=<your_cloudinary_api_key>
   - CLOUDINARY_API_SECRET=<your_cloudinary_api_secret>
   - GOOGLE_CLIENT_ID=<your_google_client_id>
   - GOOGLE_CLIENT_SECRET=<your_google_client_secret>
   - EMAIL_HOST=<your_email_host>
   - EMAIL_PORT=465
   - EMAIL_USER=<your_email_user>
   - EMAIL_PASS=<your_email_pass>

Make sure to replace the placeholder values with your actual configuration details.

4. **Start the Development Server**
   node src/server.js

5. **Access the Application**
   The backend server will be running on http://localhost:4500. You can use tools like Postman to interact with the API.

## Features

- **User Registration & Authentication**

  - Register and login users with JWT authentication.
  - Google OAuth 2.0 integration for Google login.
  - Token-based authorization for protected routes.
  - Edit user profiles, including changing passwords and updating profile pictures.

- **Board Management**

  - Create, read, update, and delete boards.
  - Customize boards with background images and icons.
  - Manage columns and cards within each board.
  - Invite collaborators to work on boards.
  - Assign cards to specific collaborators.

- **Theme Management**

  - Users can switch between Light, Violet, and Dark themes.
  - The selected theme is saved in the user's profile for a consistent experience across sessions.

- **Error Handling & Validation**

  - Comprehensive error handling with descriptive messages.
  - Data validation using Joi.

- **Email Support**

  - Users can request help by sending an email to <your_email>
  - The email includes the user's comment and contact email for follow-up.

## Technologies

- **Backend:**

  - Node.js: JavaScript runtime environment.
  - Express.js: Web framework for building RESTful APIs.
  - MongoDB: NoSQL database for storing data, using Mongoose for ORM.
  - JWT: JSON Web Tokens for secure authentication.
  - Google OAuth 2.0: Authentication using Google accounts.
  - Cloudinary: Cloud service for managing user profile images and board backgrounds.
  - Swagger: Documentation for API endpoints.
  - Nodemailer: Sending emails for support and notifications.
  - dotenv for environment variables

- **Dev Tools:**

  - Nodemon: Automatically restart the server during development.

- **API Documentation**
  - API documentation is available and automatically generated with Swagger. To access the API documentation, navigate to: http://localhost:4500/api-docs

## License

TaskPro is open-source and available under the MIT License.
