import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { User } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Page } from '../../common/utils/pagination';
import { SearchUsersDto } from './dto/search-users.dto';
import { ProfileView } from './profile-view.serializer';
import { UserCard } from './user-card.serializer';
import { UsersService } from './users.service';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  // DIQQAT: literal route'lar (`search`, `suggested`) `:username` dan oldin turishi shart.
  @Get('search')
  @ApiOperation({ summary: 'username/fullName bo`yicha qidirish' })
  search(@Query() dto: SearchUsersDto): Promise<Page<UserCard>> {
    return this.users.search(dto.q, dto.cursor, dto.limit);
  }

  @Get('suggested')
  @ApiOperation({ summary: 'Tavsiya etilgan public profillar (bo`sh feed UI)' })
  suggested(
    @CurrentUser() viewer: User,
    @Query('limit') limit?: number,
  ): Promise<UserCard[]> {
    return this.users.suggested(viewer, limit);
  }

  @Get(':username')
  @ApiOperation({ summary: 'Profil ko`rish (maxfiylikka bo`ysunadi)' })
  getProfile(
    @Param('username') username: string,
    @CurrentUser() viewer: User,
  ): Promise<ProfileView> {
    return this.users.getProfile(username, viewer);
  }

  @Get(':username/followers')
  @ApiOperation({ summary: 'Obunachilar ro`yxati (maxfiylik)' })
  followers(
    @Param('username') username: string,
    @CurrentUser() viewer: User,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: number,
  ): Promise<Page<UserCard>> {
    return this.users.listFollowers(username, viewer, cursor, limit);
  }

  @Get(':username/following')
  @ApiOperation({ summary: 'Obunalar ro`yxati (maxfiylik)' })
  following(
    @Param('username') username: string,
    @CurrentUser() viewer: User,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: number,
  ): Promise<Page<UserCard>> {
    return this.users.listFollowing(username, viewer, cursor, limit);
  }
}
