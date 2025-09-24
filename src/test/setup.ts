import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock Appwrite
vi.mock('appwrite', () => ({
  Client: vi.fn(() => ({
    setEndpoint: vi.fn().mockReturnThis(),
    setProject: vi.fn().mockReturnThis(),
  })),
  Account: vi.fn(() => ({
    create: vi.fn(),
    createEmailSession: vi.fn(),
    createPhoneSession: vi.fn(),
    updatePhoneSession: vi.fn(),
    get: vi.fn(),
    deleteSession: vi.fn(),
  })),
  Databases: vi.fn(() => ({
    createDocument: vi.fn(),
    getDocument: vi.fn(),
    updateDocument: vi.fn(),
    deleteDocument: vi.fn(),
    listDocuments: vi.fn(),
  })),
  Storage: vi.fn(() => ({
    createFile: vi.fn(),
    getFile: vi.fn(),
    deleteFile: vi.fn(),
    getFilePreview: vi.fn(),
  })),
  Functions: vi.fn(() => ({
    createExecution: vi.fn(),
  })),
  Query: {
    equal: vi.fn(),
    notEqual: vi.fn(),
    lessThan: vi.fn(),
    greaterThan: vi.fn(),
    search: vi.fn(),
    orderAsc: vi.fn(),
    orderDesc: vi.fn(),
    limit: vi.fn(),
    offset: vi.fn(),
    and: vi.fn(),
    or: vi.fn(),
  },
  Permission: {
    read: vi.fn(),
    write: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  Role: {
    any: vi.fn(),
    user: vi.fn(),
    users: vi.fn(),
  },
  ID: {
    unique: vi.fn(() => 'mock-id'),
  },
}))

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  })),
  usePathname: vi.fn(() => '/'),
  useSearchParams: vi.fn(() => new URLSearchParams()),
}))

// Mock environment variables
process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT = 'https://test.appwrite.io/v1'
process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID = 'test-project'
process.env.APPWRITE_API_KEY = 'test-api-key'