import { Controller, Post, Body, Get, UseGuards, Req } from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { AuthService } from "./auth.service";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { JwtAdminAuthGuard } from "./jwt-admin-auth.guard";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { ApiSuccessResponse } from "../common/decorators/api-response.decorator";

@ApiTags("认证")
@Controller("auth")
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post("register/email")
  @ApiOperation({
    summary: "邮箱注册",
    description: "使用邮箱和密码注册新用户账号",
  })
  @ApiSuccessResponse()
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(
      registerDto.email,
      registerDto.password,
      registerDto.nickname,
    );
  }

  @Post("login/email")
  @ApiOperation({ summary: "邮箱登录", description: "使用邮箱和密码登录" })
  @ApiSuccessResponse()
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto.email, loginDto.password);
  }

  @Post("login/wechat")
  @ApiOperation({ summary: "微信登录", description: "使用微信授权信息登录" })
  @ApiSuccessResponse()
  @ApiBody({
    schema: {
      type: "object",
      required: ["openId", "nickname"],
      properties: {
        openId: { type: "string", example: "wx_openid_123456" },
        unionId: { type: "string", example: "wx_unionid_123456" },
        nickname: { type: "string", example: "微信用户" },
        avatarUrl: { type: "string", example: "https://wx.qlogo.cn/..." },
      },
    },
  })
  async wechatLogin(
    @Body()
    body: {
      openId: string;
      unionId?: string;
      nickname: string;
      avatarUrl?: string;
    },
  ) {
    return this.authService.wechatLogin(body);
  }

  @Post("login/admin")
  @ApiOperation({
    summary: "管理员登录",
    description: "管理员使用用户名密码登录",
  })
  @ApiSuccessResponse()
  @ApiBody({
    schema: {
      type: "object",
      required: ["username", "password"],
      properties: {
        username: { type: "string", example: "admin" },
        password: { type: "string", example: "Admin123456" },
      },
    },
  })
  async adminLogin(@Body() body: { username: string; password: string }) {
    return this.authService.adminLogin(body.username, body.password);
  }

  @Get("me")
  @ApiBearerAuth("JWT-auth")
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: "获取当前用户信息",
    description: "获取当前登录用户的详细信息",
  })
  @ApiSuccessResponse()
  async getCurrentUser(@Req() req: any) {
    return this.authService.getCurrentUser(req.user.userId);
  }

  @Get("admin/me")
  @ApiBearerAuth("Admin-JWT-auth")
  @UseGuards(JwtAdminAuthGuard)
  @ApiOperation({
    summary: "获取当前管理员信息",
    description: "获取当前登录管理员的详细信息",
  })
  @ApiSuccessResponse()
  async getCurrentAdmin(@Req() req: any) {
    return this.authService.getCurrentAdmin(req.user.adminId);
  }

  @Post("bind/wechat")
  @ApiBearerAuth("JWT-auth")
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: "绑定微信账号",
    description: "为当前用户绑定微信账号",
  })
  @ApiSuccessResponse()
  @ApiBody({
    schema: {
      type: "object",
      required: ["openId"],
      properties: {
        openId: { type: "string", example: "wx_openid_123456" },
        unionId: { type: "string", example: "wx_unionid_123456" },
      },
    },
  })
  async bindWechat(
    @Req() req: any,
    @Body() body: { openId: string; unionId?: string },
  ) {
    return this.authService.bindWechat(req.user.userId, body);
  }
}
