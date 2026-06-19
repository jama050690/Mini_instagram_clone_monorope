import { Global, Module } from '@nestjs/common';
import { VisibilityService } from './visibility.service';

/** Global module — VisibilityService barcha modullarga import'siz ochiq (PrismaModule kabi). */
@Global()
@Module({
  providers: [VisibilityService],
  exports: [VisibilityService],
})
export class VisibilityModule {}
