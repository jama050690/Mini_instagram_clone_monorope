/**
 * Test env'ni jest worker boshlanishidan oldin yuklaydi.
 * `.env.test` test DB'ga ishora qiladi — dev DB'ga tegmaydi.
 */
import { config } from 'dotenv';
import { join } from 'path';

config({ path: join(__dirname, '..', '.env.test'), override: true });
