import { expect, describe, it } from '@jest/globals';
import { config } from '../src/config/environment.js';

describe('Environment Configuration', () => {
  it('should have default values when environment variables are not set', () => {
    expect(config.server.port).toBeDefined();
    expect(config.server.environment).toBeDefined();
    expect(config.logging.level).toBeDefined();
  });
}); 