# Appwrite Backend Specification for Madhubani Nikah

This document outlines the comprehensive Appwrite setup, including the database, collections, attributes, and services for the Madhubani Nikah Islamic Matrimony Platform.

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
    2.  **Phone (OTP)**: For mobile number-based sign-up and login (primary for local users).
    3.  **Anonymous Sessions**: For guest browsing (limited profile viewing).
- **User Attributes**: Appwrite's built-in user object will store essential info like `email`, `phone`, `password_hash`, `email_verification_status`, and `phone_verification_status`.

### b. Database Service

A single database will contain all the collections for the application.

- **Database Name**: `Madhubani Nikah DB`
- **Database ID**: `madhubani_nikah_db`

### c. Storage Service

Appwrite Storage will be used to store user-uploaded files.

- **Bucket 1: Profile Pictures**
    - **Bucket ID**: `profile_pictures`
    - **Permissions**:
        - Read: Any authenticated user (to view profile pictures).
        - Write: Only the logged-in user who owns the picture.
    - **File Validation**: JPEG, PNG, WebP (max 5MB)
    - **File Security**: Automatic virus scanning, compression

- **Bucket 2: Verification Documents**
    - **Bucket ID**: `verification_documents`
    - **Permissions**:
        - Read: Admin role only.
        - Write: The logged-in user submitting the document.
    - **File Validation**: JPEG, PNG, PDF (max 10MB)
    - **File Security**: Encrypted storage, audit logs

- **Bucket 3: Success Story Images**
    - **Bucket ID**: `success_story_images`
    - **Permissions**:
        - Read: Any user (public access).
        - Write: Admin only.
    - **File Validation**: JPEG, PNG, WebP (max 3MB)

### d. Functions Service

Server-side functions for complex operations.

- **Function 1: AI Profile Matching**
    - **Function ID**: `ai_profile_matching`
    - **Purpose**: Generate compatibility explanations using Gemini AI
    - **Runtime**: Node.js

- **Function 2: Profile Verification**
    - **Function ID**: `profile_verification`
    - **Purpose**: OCR document verification and fraud detection
    - **Runtime**: Python

- **Function 3: Smart Notifications**
    - **Function ID**: `smart_notifications`
    - **Purpose**: Send relevant match notifications
    - **Runtime**: Node.js

---

## 3. Database Collections

### a. `profiles` Collection

Stores the comprehensive profile information for each user with Madhubani-specific fields.

- **Collection ID**: `profiles`
- **Permissions**:
    - **Document Level**:
        - Read: Any authenticated user.
        - Write: The user who owns the document (`userId`) + Admin.
        - Delete: The user who owns the document (`userId`) + Admin.
- **Attributes**:
    - `userId` (string, required, unique) - Links to Appwrite Auth user
    - `name` (string, required, size: 100)
    - `age` (integer, required, min: 18, max: 100)
    - `gender` (string, required, enum: 'male', 'female')
    - `email` (string, required, format: email, unique)
    
    **Geographical Information:**
    - `district` (string, required) - Primary: Madhubani
    - `block` (string, required) - 22 blocks in Madhubani
    - `village` (string, optional) - Specific village within block
    - `nearbyDistricts` (string array, optional) - Additional coverage areas
    
    **Education & Career:**
    - `education` (string, required) - Education level
    - `occupation` (string, required) - Current occupation
    - `skills` (string array, optional) - Special skills/interests
    
    **Religious & Cultural:**
    - `sect` (string, required, enum: 'Sunni', 'Shia', 'Other')
    - `subSect` (string, optional) - Specific madhab/firqa
    - `biradari` (string, optional) - Social group/caste
    - `religiousPractice` (string, required) - Religious observance level
    - `familyBackground` (string, required, size: 500)
    
    **Personal Details:**
    - `bio` (string, required, size: 1000) - Personal description
    - `familyType` (string, optional, enum: 'nuclear', 'joint')
    - `maritalStatus` (string, required, enum: 'single', 'divorced', 'widowed')
    
    **Profile Settings:**
    - `profilePictureId` (string, optional) - File ID from profile_pictures bucket
    - `isPhotoBlurred` (boolean, default: true) - Privacy setting
    - `isVerified` (boolean, default: false) - Admin verified status
    - `isProfileComplete` (boolean, default: false) - Profile completion status
    - `profileVisibility` (string, default: 'public', enum: 'public', 'members', 'private')
    
    **Preferences & Filters:**
    - `lookingFor` (object, optional) - Partner preferences JSON
    - `ageRangePreference` (string, optional) - "22-28" format
    - `locationPreference` (string array, optional) - Preferred locations
    - `educationPreference` (string array, optional) - Preferred education levels
    
    **System Fields:**
    - `createdAt` (datetime, required, default: now())
    - `updatedAt` (datetime, required, default: now())
    - `lastActiveAt` (datetime, optional) - Last seen timestamp
    - `profileViewCount` (integer, default: 0) - Profile view analytics
    - `isActive` (boolean, default: true) - Account status

### b. `interests` Collection

Manages proposal/interest interactions between users.

- **Collection ID**: `interests`
- **Permissions**:
    - Write: Any authenticated user.
    - Read: Only the `senderId` or `receiverId`.
    - Update: Only the `receiverId` (to accept/decline).
    - Delete: The `senderId` or `receiverId`.
- **Attributes**:
    - `senderId` (string, required) - User who sent interest
    - `receiverId` (string, required) - User who received interest
    - `status` (string, required, enum: 'pending', 'accepted', 'declined', 'withdrawn', default: 'pending')
    - `message` (string, optional, size: 500) - Personal message with proposal
    - `sentAt` (datetime, required, default: now())
    - `respondedAt` (datetime, optional) - When status was updated
    - `type` (string, required, enum: 'proposal', 'favorite', 'contact_request', default: 'proposal')
    - `isRead` (boolean, default: false) - Read receipt for receiver
    - `aiMatchScore` (integer, optional, min: 0, max: 100) - AI compatibility score
    - `commonInterests` (string array, optional) - Shared interests/skills

### c. `verification_requests` Collection

Manages profile verification process.

- **Collection ID**: `verification_requests`
- **Permissions**:
    - Write: Any authenticated user.
    - Read: User who owns the request + Admin.
    - Update: Admin only.
    - Delete: Admin only.
- **Attributes**:
    - `userId` (string, required) - User requesting verification
    - `documentType` (string, required, enum: 'national_id', 'passport', 'driving_license', 'utility_bill')
    - `documentFileIds` (string array, required) - Array of file IDs from verification_documents bucket
    - `status` (string, required, enum: 'pending', 'under_review', 'approved', 'rejected', 'additional_docs_required', default: 'pending')
    - `submittedAt` (datetime, required, default: now())
    - `reviewedAt` (datetime, optional)
    - `reviewedBy` (string, optional) - Admin user ID who reviewed
    - `rejectionReason` (string, optional, size: 500) - Why verification was rejected
    - `notes` (string, optional, size: 1000) - Admin notes
    - `verificationLevel` (string, optional, enum: 'basic', 'premium', 'gold') - Verification tier
    - `expiresAt` (datetime, optional) - Verification expiry date

### d. `success_stories` Collection

Stores success stories for platform credibility.

- **Collection ID**: `success_stories`
- **Permissions**:
    - Read: Any user (public access).
    - Write: Admin only.
    - Update: Admin only.
    - Delete: Admin only.
- **Attributes**:
    - `coupleName` (string, required, size: 100) - "Ahmed & Fatima"
    - `location` (string, required) - "Benipatti, Madhubani"
    - `story` (string, required, size: 2000) - Success story content
    - `imageId` (string, optional) - File ID from success_story_images bucket
    - `publishedAt` (datetime, required, default: now())
    - `isPublished` (boolean, default: false) - Admin approval for visibility
    - `marriageDate` (datetime, optional) - When they got married
    - `platformJoinDate` (datetime, optional) - When they joined platform
    - `category` (string, optional, enum: 'local', 'intercity', 'professional', 'religious')
    - `tags` (string array, optional) - Story categories for filtering

### e. `user_reports` Collection

Handles user reports and moderation.

- **Collection ID**: `user_reports`
- **Permissions**:
    - Write: Any authenticated user.
    - Read: Admin only.
    - Update: Admin only.
    - Delete: Admin only.
- **Attributes**:
    - `reporterId` (string, required) - User who filed the report
    - `reportedUserId` (string, required) - User being reported
    - `reason` (string, required, enum: 'fake_profile', 'inappropriate_behavior', 'spam', 'harassment', 'other')
    - `description` (string, required, size: 1000) - Detailed report
    - `evidence` (string array, optional) - Screenshots/evidence file IDs
    - `status` (string, required, enum: 'pending', 'investigating', 'resolved', 'dismissed', default: 'pending')
    - `priority` (string, required, enum: 'low', 'medium', 'high', 'urgent', default: 'medium')
    - `submittedAt` (datetime, required, default: now())
    - `investigatedBy` (string, optional) - Admin handling the case
    - `actionTaken` (string, optional) - What action was taken
    - `resolvedAt` (datetime, optional)

### f. `admin_users` Collection

Manages admin access and roles.

- **Collection ID**: `admin_users`
- **Permissions**:
    - Read: Admin only.
    - Write: Super Admin only.
    - Update: Super Admin only.
    - Delete: Super Admin only.
- **Attributes**:
    - `userId` (string, required, unique) - Links to Auth user
    - `role` (string, required, enum: 'admin', 'moderator', 'super_admin')
    - `permissions` (string array, required) - Specific permissions
    - `assignedBy` (string, required) - Who granted admin access
    - `assignedAt` (datetime, required, default: now())
    - `isActive` (boolean, default: true) - Admin account status
    - `lastLoginAt` (datetime, optional)
    - `department` (string, optional, enum: 'verification', 'moderation', 'support', 'analytics')

### g. `user_sessions` Collection

Tracks user activity and analytics.

- **Collection ID**: `user_sessions`
- **Permissions**:
    - Write: System only (via Functions).
    - Read: Admin only.
    - Update: System only.
    - Delete: System only (auto-cleanup after 90 days).
- **Attributes**:
    - `userId` (string, required) - User session belongs to
    - `sessionId` (string, required, unique) - Unique session identifier
    - `ipAddress` (string, required) - User's IP address
    - `userAgent` (string, required) - Browser/device info
    - `loginAt` (datetime, required, default: now())
    - `logoutAt` (datetime, optional)
    - `duration` (integer, optional) - Session duration in minutes
    - `pagesVisited` (string array, optional) - Page visit tracking
    - `actionsPerformed` (string array, optional) - User actions log
    - `deviceType` (string, optional, enum: 'desktop', 'mobile', 'tablet')
    - `location` (object, optional) - Approximate geo-location JSON

### h. `search_analytics` Collection

Tracks search patterns and filter usage.

- **Collection ID**: `search_analytics`
- **Permissions**:
    - Write: System only (via Functions).
    - Read: Admin only.
    - Update: System only.
    - Delete: System only (auto-cleanup after 180 days).
- **Attributes**:
    - `userId` (string, optional) - User who performed search (null for guests)
    - `searchQuery` (string, optional) - Text search terms
    - `filters` (object, required) - Applied filters JSON
    - `resultsCount` (integer, required) - Number of results returned
    - `searchedAt` (datetime, required, default: now())
    - `sessionId` (string, required) - Links to user session
    - `clickedProfiles` (string array, optional) - Which profiles were clicked
    - `timeSpent` (integer, optional) - Time spent on search results page

### i. `notifications` Collection

Manages user notifications and alerts.

- **Collection ID**: `notifications`
- **Permissions**:
    - Write: System only (via Functions) + Admin.
    - Read: User who owns the notification.
    - Update: User who owns the notification (mark as read).
    - Delete: User who owns the notification + Admin.
- **Attributes**:
    - `userId` (string, required) - Notification recipient
    - `type` (string, required, enum: 'new_interest', 'interest_accepted', 'interest_declined', 'new_match', 'profile_view', 'verification_update', 'system_announcement')
    - `title` (string, required, size: 100) - Notification title
    - `message` (string, required, size: 500) - Notification content
    - `isRead` (boolean, default: false) - Read status
    - `priority` (string, required, enum: 'low', 'medium', 'high', default: 'medium')
    - `createdAt` (datetime, required, default: now())
    - `readAt` (datetime, optional) - When notification was read
    - `relatedUserId` (string, optional) - Other user involved (for interests)
    - `actionUrl` (string, optional) - Deep link for notification action
    - `metadata` (object, optional) - Additional notification data JSON

### j. `platform_settings` Collection

Stores platform configuration and content.

- **Collection ID**: `platform_settings`
- **Permissions**:
    - Read: Any user (for public settings).
    - Write: Admin only.
    - Update: Admin only.
    - Delete: Admin only.
- **Attributes**:
    - `key` (string, required, unique) - Setting identifier
    - `value` (string, required) - Setting value (JSON for complex data)
    - `category` (string, required, enum: 'general', 'features', 'content', 'security', 'payments')
    - `description` (string, optional, size: 500) - Setting description
    - `isPublic` (boolean, default: false) - Whether setting is publicly readable
    - `updatedBy` (string, required) - Admin who last updated
    - `updatedAt` (datetime, required, default: now())
    - `dataType` (string, required, enum: 'string', 'number', 'boolean', 'json', 'array')

### k. `feedback` Collection

Collects user feedback and suggestions.

- **Collection ID**: `feedback`
- **Permissions**:
    - Write: Any authenticated user.
    - Read: Admin only.
    - Update: Admin only (to mark as reviewed).
    - Delete: Admin only.
- **Attributes**:
    - `userId` (string, required) - User who submitted feedback
    - `type` (string, required, enum: 'bug_report', 'feature_request', 'general_feedback', 'complaint', 'compliment')
    - `subject` (string, required, size: 200) - Feedback subject
    - `message` (string, required, size: 2000) - Detailed feedback
    - `priority` (string, required, enum: 'low', 'medium', 'high', default: 'medium')
    - `status` (string, required, enum: 'new', 'reviewed', 'in_progress', 'resolved', 'closed', default: 'new')
    - `submittedAt` (datetime, required, default: now())
    - `reviewedBy` (string, optional) - Admin who reviewed
    - `reviewedAt` (datetime, optional)
    - `adminResponse` (string, optional, size: 1000) - Admin response to feedback
    - `category` (string, optional) - Feature/area this feedback relates to
    - `screenshots` (string array, optional) - Attached screenshot file IDs

---

## 4. Required Indexes

For optimal query performance:

### a. Profiles Collection Indexes
- `userId` (unique)
- `gender` + `age` + `district` (compound)
- `isVerified` + `isActive` (compound)
- `district` + `block` + `village` (compound)
- `sect` + `subSect` + `biradari` (compound)
- `createdAt` (desc)
- `lastActiveAt` (desc)

### b. Interests Collection Indexes
- `senderId` + `status` (compound)
- `receiverId` + `status` (compound)
- `sentAt` (desc)

### c. Verification Requests Indexes
- `userId` (unique)
- `status` + `submittedAt` (compound)

### d. Notifications Indexes
- `userId` + `isRead` + `createdAt` (compound)
- `type` + `createdAt` (compound)

---

## 5. Security Rules & Permissions

### a. User Roles
- **Guest**: Can view limited profile information
- **Member**: Full platform access, can create/edit own profile
- **Verified Member**: Enhanced visibility and features
- **Admin**: Full moderation capabilities
- **Super Admin**: Complete system access

### b. Data Privacy
- Personal contact information protected until mutual interest
- Photo visibility controlled by user preferences
- Automatic data anonymization for analytics
- GDPR compliance for data deletion requests

### c. Rate Limiting
- Search queries: 100 per hour per user
- Interest proposals: 10 per day per user
- Profile views: 200 per day per user
- File uploads: 20 per day per user

---

## 6. Real-time Features (Using Appwrite Realtime)

### a. Live Notifications
- Subscribe to user's notification collection
- Real-time interest proposals and responses
- Online status indicators

### b. Activity Feeds
- New profile additions
- Success story updates
- Platform announcements

---

## 7. Backup & Data Management

### a. Automated Backups
- Daily database backups
- Weekly full system backups
- File storage replication

### b. Data Retention Policies
- User sessions: 90 days
- Search analytics: 180 days
- Deleted profiles: 30 day soft delete
- Success stories: Permanent (unless removed)

---

This specification provides a comprehensive backend foundation for the Madhubani Nikah platform with focus on Islamic matrimony features, geographical specificity to Madhubani district, advanced filtering capabilities, and robust admin management tools.
