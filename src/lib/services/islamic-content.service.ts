import { databases, AppwriteService } from '../appwrite';
import { DATABASE_ID, COLLECTION_IDS } from '../appwrite-config';
import { Query, ID } from 'appwrite';

export interface IslamicContent {
  $id: string;
  type: 'Quran' | 'Hadith' | 'Quote';
  source: string;
  textKey?: string;
  arabicText?: string;
  englishText: string;
  urduText?: string;
  hindiText?: string;
  attribution?: string;
  category?: string;
  tags?: string[];
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateIslamicContentData {
  type: 'Quran' | 'Hadith' | 'Quote';
  source: string;
  textKey?: string;
  arabicText?: string;
  englishText: string;
  urduText?: string;
  hindiText?: string;
  attribution?: string;
  category?: string;
  tags?: string[];
  displayOrder?: number;
}

export class IslamicContentService {
  /**
   * Get all active Islamic content
   */
  static async getActiveContent(): Promise<IslamicContent[]> {
    return AppwriteService.executeWithErrorHandling(async () => {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_IDS.ISLAMIC_CONTENT,
        [
          Query.equal('isActive', true),
          Query.orderAsc('displayOrder'),
          Query.limit(50)
        ]
      );

      return response.documents as IslamicContent[];
    }, 'getActiveContent');
  }

  /**
   * Get Islamic content by type
   */
  static async getContentByType(type: 'Quran' | 'Hadith' | 'Quote'): Promise<IslamicContent[]> {
    return AppwriteService.executeWithErrorHandling(async () => {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_IDS.ISLAMIC_CONTENT,
        [
          Query.equal('type', type),
          Query.equal('isActive', true),
          Query.orderAsc('displayOrder'),
          Query.limit(20)
        ]
      );

      return response.documents as IslamicContent[];
    }, 'getContentByType');
  }

  /**
   * Get random Islamic content
   */
  static async getRandomContent(limit: number = 5): Promise<IslamicContent[]> {
    return AppwriteService.executeWithErrorHandling(async () => {
      // Get all active content first
      const allContent = await this.getActiveContent();
      
      // Shuffle and return limited results
      const shuffled = allContent.sort(() => 0.5 - Math.random());
      return shuffled.slice(0, limit);
    }, 'getRandomContent');
  }

  /**
   * Create new Islamic content (Admin only)
   */
  static async createContent(data: CreateIslamicContentData): Promise<IslamicContent> {
    return AppwriteService.executeWithErrorHandling(async () => {
      const contentData = {
        ...data,
        isActive: true,
        displayOrder: data.displayOrder || 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const response = await databases.createDocument(
        DATABASE_ID,
        COLLECTION_IDS.ISLAMIC_CONTENT,
        ID.unique(),
        contentData
      );

      return response as IslamicContent;
    }, 'createContent');
  }

  /**
   * Update Islamic content (Admin only)
   */
  static async updateContent(contentId: string, updates: Partial<CreateIslamicContentData>): Promise<IslamicContent> {
    return AppwriteService.executeWithErrorHandling(async () => {
      const updateData = {
        ...updates,
        updatedAt: new Date().toISOString()
      };

      const response = await databases.updateDocument(
        DATABASE_ID,
        COLLECTION_IDS.ISLAMIC_CONTENT,
        contentId,
        updateData
      );

      return response as IslamicContent;
    }, 'updateContent');
  }

  /**
   * Delete Islamic content (Admin only)
   */
  static async deleteContent(contentId: string): Promise<void> {
    return AppwriteService.executeWithErrorHandling(async () => {
      await databases.deleteDocument(
        DATABASE_ID,
        COLLECTION_IDS.ISLAMIC_CONTENT,
        contentId
      );
    }, 'deleteContent');
  }

  /**
   * Toggle content active status (Admin only)
   */
  static async toggleContentStatus(contentId: string, isActive: boolean): Promise<IslamicContent> {
    return AppwriteService.executeWithErrorHandling(async () => {
      const response = await databases.updateDocument(
        DATABASE_ID,
        COLLECTION_IDS.ISLAMIC_CONTENT,
        contentId,
        {
          isActive,
          updatedAt: new Date().toISOString()
        }
      );

      return response as IslamicContent;
    }, 'toggleContentStatus');
  }
}