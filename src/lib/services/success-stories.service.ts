import { databases, storage, AppwriteService } from '../appwrite';
import { DATABASE_ID, COLLECTION_IDS, BUCKET_IDS } from '../appwrite-config';
import { Query, ID } from 'appwrite';

export interface SuccessStory {
  $id: string;
  coupleNames: string;
  location: string;
  story: string;
  imageId?: string;
  imageUrl?: string;
  marriageDate?: string;
  isPublished: boolean;
  isVerified: boolean;
  submittedBy?: string;
  submittedAt: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSuccessStoryData {
  coupleNames: string;
  location: string;
  story: string;
  marriageDate?: string;
  submittedBy?: string;
}

export class SuccessStoriesService {
  /**
   * Get all published success stories
   */
  static async getPublishedStories(): Promise<SuccessStory[]> {
    return AppwriteService.executeWithErrorHandling(async () => {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_IDS.SUCCESS_STORIES,
        [
          Query.equal('isPublished', true),
          Query.orderDesc('publishedAt'),
          Query.limit(50)
        ]
      );

      const stories = response.documents as SuccessStory[];
      
      // Add image URLs for stories with images
      return await Promise.all(stories.map(async (story) => {
        if (story.imageId) {
          try {
            const imageUrl = storage.getFilePreview(
              BUCKET_IDS.SUCCESS_STORY_IMAGES,
              story.imageId,
              400, // width
              300, // height
              'center', // gravity
              80 // quality
            );
            return { ...story, imageUrl: imageUrl.href };
          } catch (error) {
            console.error('Failed to get image URL for story:', story.$id, error);
            return story;
          }
        }
        return story;
      }));
    }, 'getPublishedStories');
  }

  /**
   * Get success story by ID
   */
  static async getStoryById(storyId: string): Promise<SuccessStory | null> {
    return AppwriteService.executeWithErrorHandling(async () => {
      const response = await databases.getDocument(
        DATABASE_ID,
        COLLECTION_IDS.SUCCESS_STORIES,
        storyId
      );

      const story = response as SuccessStory;
      
      // Add image URL if story has an image
      if (story.imageId) {
        try {
          const imageUrl = storage.getFilePreview(
            BUCKET_IDS.SUCCESS_STORY_IMAGES,
            story.imageId,
            800, // width
            600, // height
            'center', // gravity
            90 // quality
          );
          story.imageUrl = imageUrl.href;
        } catch (error) {
          console.error('Failed to get image URL for story:', story.$id, error);
        }
      }

      return story;
    }, 'getStoryById');
  }

  /**
   * Submit a new success story
   */
  static async submitStory(data: CreateSuccessStoryData): Promise<SuccessStory> {
    return AppwriteService.executeWithErrorHandling(async () => {
      const storyData = {
        ...data,
        isPublished: false,
        isVerified: false,
        submittedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const response = await databases.createDocument(
        DATABASE_ID,
        COLLECTION_IDS.SUCCESS_STORIES,
        ID.unique(),
        storyData
      );

      return response as SuccessStory;
    }, 'submitStory');
  }

  /**
   * Upload image for success story
   */
  static async uploadStoryImage(storyId: string, file: File): Promise<string> {
    return AppwriteService.executeWithErrorHandling(async () => {
      // Upload image to storage
      const uploadResponse = await storage.createFile(
        BUCKET_IDS.SUCCESS_STORY_IMAGES,
        ID.unique(),
        file
      );

      // Update story with image ID
      await databases.updateDocument(
        DATABASE_ID,
        COLLECTION_IDS.SUCCESS_STORIES,
        storyId,
        {
          imageId: uploadResponse.$id,
          updatedAt: new Date().toISOString()
        }
      );

      return uploadResponse.$id;
    }, 'uploadStoryImage');
  }

  /**
   * Get stories by location (for admin/moderation)
   */
  static async getStoriesByLocation(location: string): Promise<SuccessStory[]> {
    return AppwriteService.executeWithErrorHandling(async () => {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_IDS.SUCCESS_STORIES,
        [
          Query.search('location', location),
          Query.orderDesc('submittedAt'),
          Query.limit(20)
        ]
      );

      return response.documents as SuccessStory[];
    }, 'getStoriesByLocation');
  }

  /**
   * Get pending stories for admin review
   */
  static async getPendingStories(): Promise<SuccessStory[]> {
    return AppwriteService.executeWithErrorHandling(async () => {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_IDS.SUCCESS_STORIES,
        [
          Query.equal('isPublished', false),
          Query.orderDesc('submittedAt'),
          Query.limit(50)
        ]
      );

      return response.documents as SuccessStory[];
    }, 'getPendingStories');
  }

  /**
   * Publish a success story (Admin only)
   */
  static async publishStory(storyId: string): Promise<SuccessStory> {
    return AppwriteService.executeWithErrorHandling(async () => {
      const response = await databases.updateDocument(
        DATABASE_ID,
        COLLECTION_IDS.SUCCESS_STORIES,
        storyId,
        {
          isPublished: true,
          isVerified: true,
          publishedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      );

      return response as SuccessStory;
    }, 'publishStory');
  }

  /**
   * Unpublish a success story (Admin only)
   */
  static async unpublishStory(storyId: string): Promise<SuccessStory> {
    return AppwriteService.executeWithErrorHandling(async () => {
      const response = await databases.updateDocument(
        DATABASE_ID,
        COLLECTION_IDS.SUCCESS_STORIES,
        storyId,
        {
          isPublished: false,
          updatedAt: new Date().toISOString()
        }
      );

      return response as SuccessStory;
    }, 'unpublishStory');
  }

  /**
   * Delete a success story (Admin only)
   */
  static async deleteStory(storyId: string): Promise<void> {
    return AppwriteService.executeWithErrorHandling(async () => {
      // Get story to check if it has an image
      const story = await this.getStoryById(storyId);
      
      // Delete image if exists
      if (story?.imageId) {
        try {
          await storage.deleteFile(BUCKET_IDS.SUCCESS_STORY_IMAGES, story.imageId);
        } catch (error) {
          console.error('Failed to delete story image:', error);
          // Continue with story deletion even if image deletion fails
        }
      }

      // Delete story document
      await databases.deleteDocument(
        DATABASE_ID,
        COLLECTION_IDS.SUCCESS_STORIES,
        storyId
      );
    }, 'deleteStory');
  }

  /**
   * Get success stories statistics
   */
  static async getStoriesStats(): Promise<{
    totalStories: number;
    publishedStories: number;
    pendingStories: number;
    storiesThisMonth: number;
  }> {
    return AppwriteService.executeWithErrorHandling(async () => {
      const [total, published, pending] = await Promise.all([
        databases.listDocuments(DATABASE_ID, COLLECTION_IDS.SUCCESS_STORIES, [Query.limit(1)]),
        databases.listDocuments(DATABASE_ID, COLLECTION_IDS.SUCCESS_STORIES, [
          Query.equal('isPublished', true),
          Query.limit(1)
        ]),
        databases.listDocuments(DATABASE_ID, COLLECTION_IDS.SUCCESS_STORIES, [
          Query.equal('isPublished', false),
          Query.limit(1)
        ])
      ]);

      // Get stories from this month
      const thisMonth = new Date();
      thisMonth.setDate(1);
      thisMonth.setHours(0, 0, 0, 0);
      
      const thisMonthStories = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_IDS.SUCCESS_STORIES,
        [
          Query.greaterThanEqual('submittedAt', thisMonth.toISOString()),
          Query.limit(1)
        ]
      );

      return {
        totalStories: total.total,
        publishedStories: published.total,
        pendingStories: pending.total,
        storiesThisMonth: thisMonthStories.total
      };
    }, 'getStoriesStats');
  }
}