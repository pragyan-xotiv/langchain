import { jest } from '@jest/globals';

// Extend the jest types to allow for any function
declare global {
  namespace jest {
    interface Mock {
      mockImplementation<T extends (...args: any[]) => any>(
        fn: T
      ): jest.Mock<ReturnType<T>, Parameters<T>>;
    }
  }
}

// Export an empty object to make this a valid ESM module
export {}; 