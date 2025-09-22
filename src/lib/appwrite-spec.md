# Appwrite Backend Specification for Madhubani Nikah

This document outlines the required Appwrite setup, including the database, collections, attributes, and services for the Madhubani Nikah platform.

---

## 1. Project Setup

- **Project Name**: Madhubani Nikah
- **Database Name**: `madhubani_nikah_db`
- **Database ID**: `madhubani_nikah_db`

---

## 2. Appwrite Services

### a. Auth Service

The Appwrite Auth service will be used to manage users, authentication, and sessions.

- **Authentication Methods**:
    1.  **Email/Password**: Standard email and password login.
    2.  **Phone (OTP)**: For mobile number-based sign-up and login.
- **User Attributes**: Appwrite's built-in user object will store essential info like `email`, `phone`, `password_hash`, and `email_verification_status`.

### b. Database Service

A single database will contain all the collections for the application.

- **Database Name**: `Madhubani Nikah DB`
- **Database ID**: `madhubani_nikah_db`

### c. Storage Service

Appwrite Storage will be used to store user-uploaded files, primarily profile pictures.

- **Bucket Name**: `Profile Pictures`
- **Bucket ID**: `profile_pictures`
- **Permissions**:
    - Read: Any user (to view profile pictures).
    - Write: Only the logged-in user who owns the picture.

---

## 3. Database Collections

### a. `profiles` Collection

Stores the detailed public and private profile information for each user.

- **Collection ID**: `profiles`
- **Permissions**:
    - **Document Level**:
        - Read: Any user.
        - Write: The user who owns the document (`userId`).
- **Attributes**:
    - `name` (string, required)
    - `age` (integer, required)
    - `gender` (string, required, enum: 'male', 'female')
    - `village` (string, required) - For geo-based matching.
    - `education` (string, required)
    - `occupation` (string, required)
    - `religiousPractice` (string, required)
    - `familyBackground` (string, required)
    - `isPhotoBlurred` (boolean, default: `true`)
    - `bio` (string, required)
    - `profilePictureId` (string, optional) - Corresponds to the file ID in the `profile_pictures` bucket.
    - `isVerified` (boolean, default: `false`) - To be updated by an admin.
    - `userId` (string, required, unique) - This links the profile to the Appwrite Auth user.

### b. `success_stories` Collection

Stores the success stories to be displayed on the platform.

- **Collection ID**: `success_stories`
- **Permissions**:
    - Read: Any user.
    - Write: Admin only.
- **Attributes**:
    - `coupleName` (string, required)
    - `location` (string, required)
    - `story` (string, required, max 1000 characters)
    - `imageId` (string, required) - File ID from a dedicated `success_story_images` bucket.
    - `publishedAt` (datetime, required)

### c. `interests` Collection

Manages the "interest" or "proposal" interactions between users.

- **Collection ID**: `interests`
- **Permissions**:
    - Write: Any logged-in user.
    - Read/Update: Only the `senderId` or `receiverId`.
- **Attributes**:
    - `senderId` (string, required)
    - `receiverId` (string, required)
    - `status` (string, required, enum: 'pending', 'accepted', 'declined', default: 'pending')
    - `sentAt` (datetime, required)
    - `updatedAt` (datetime, optional)

---

This specification provides a clear roadmap for setting up the Appwrite backend. The next step would be to create these collections and services in your Appwrite console.
