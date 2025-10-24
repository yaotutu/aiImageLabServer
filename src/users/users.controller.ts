import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  UseGuards,
  Req,
  Query,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from "@nestjs/swagger";
import { UsersService } from "./users.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { ApiSuccessResponse } from "../common/decorators/api-response.decorator";

@ApiTags("Users")
@ApiBearerAuth("JWT-auth")
@Controller("users")
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get("profile")
  @ApiOperation({
    summary: "获取用户信息",
    description: "获取当前登录用户的详细信息",
  })
  @ApiSuccessResponse()
  @ApiResponse({ status: 401, description: "未授权" })
  async getProfile(@Req() req: any) {
    return this.usersService.findById(req.user.userId);
  }

  @Put("profile")
  @ApiOperation({ summary: "更新用户信息" })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        nickname: { type: "string", example: "新昵称" },
        avatarUrl: {
          type: "string",
          example: "https://example.com/avatar.jpg",
        },
      },
    },
  })
  @ApiSuccessResponse()
  async updateProfile(
    @Req() req: any,
    @Body() body: { nickname?: string; avatarUrl?: string },
  ) {
    return this.usersService.update(req.user.userId, body);
  }

  @Put("password")
  @ApiOperation({ summary: "修改密码" })
  @ApiBody({
    schema: {
      type: "object",
      required: ["oldPassword", "newPassword"],
      properties: {
        oldPassword: { type: "string", example: "OldPass123" },
        newPassword: { type: "string", example: "NewPass123" },
      },
    },
  })
  @ApiSuccessResponse()
  async changePassword(
    @Req() req: any,
    @Body() body: { oldPassword: string; newPassword: string },
  ) {
    await this.usersService.changePassword(
      req.user.userId,
      body.oldPassword,
      body.newPassword,
    );
    return { message: "密码修改成功" };
  }

  @Post("change-password")
  @ApiOperation({
    summary: "修改密码（兼容接口）",
    description: "修改密码的兼容接口，与 PUT /api/users/password 功能相同",
  })
  @ApiBody({
    schema: {
      type: "object",
      required: ["oldPassword", "newPassword"],
      properties: {
        oldPassword: { type: "string", example: "OldPass123" },
        newPassword: { type: "string", example: "NewPass123" },
      },
    },
  })
  @ApiSuccessResponse()
  async changePasswordCompat(
    @Req() req: any,
    @Body() body: { oldPassword: string; newPassword: string },
  ) {
    await this.usersService.changePassword(
      req.user.userId,
      body.oldPassword,
      body.newPassword,
    );
    return { message: "密码修改成功" };
  }

  @Get("credits")
  @ApiOperation({ summary: "获取用户积分" })
  @ApiSuccessResponse()
  async getCredits(@Req() req: any) {
    const credits = await this.usersService.getCredits(req.user.userId);
    return { credits };
  }

  @Get("credit-logs")
  @ApiOperation({ summary: "获取用户积分变动日志" })
  @ApiQuery({ name: "page", required: false, description: "页码", example: 1 })
  @ApiQuery({
    name: "pageSize",
    required: false,
    description: "每页数量",
    example: 20,
  })
  @ApiSuccessResponse()
  async getCreditLogs(
    @Req() req: any,
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const size = pageSize ? parseInt(pageSize, 10) : 20;
    return this.usersService.getCreditLogs(req.user.userId, pageNum, size);
  }

  @Get("generation-stats")
  @ApiOperation({
    summary: "获取用户生成统计",
    description: "获取用户的生成统计信息，包括成功率、消耗积分等",
  })
  @ApiSuccessResponse()
  async getGenerationStats(@Req() req: any) {
    return this.usersService.getGenerationStats(req.user.userId);
  }
}
