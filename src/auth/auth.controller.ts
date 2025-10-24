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

@ApiTags("认证")
@Controller("auth")
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post("register/email")
  @ApiOperation({
    summary: "邮箱注册",
    description: "使用邮箱和密码注册新用户账号",
  })
  @ApiBody({
    schema: {
      type: "object",
      required: ["email", "password"],
      properties: {
        email: {
          type: "string",
          example: "user@example.com",
          description: "邮箱地址",
        },
        password: {
          type: "string",
          example: "Password123",
          description: "密码",
        },
        nickname: {
          type: "string",
          example: "用户昵称",
          description: "昵称（可选，不提供则使用邮箱前缀）",
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: "注册成功" })
  @ApiResponse({ status: 400, description: "参数错误" })
  @ApiResponse({ status: 409, description: "该邮箱已被注册" })
  async register(
    @Body() body: { email: string; password: string; nickname?: string },
  ) {
    return this.authService.register(body.email, body.password, body.nickname);
  }

  @Post("login/email")
  @ApiOperation({ summary: "邮箱登录", description: "使用邮箱和密码登录" })
  @ApiBody({
    schema: {
      type: "object",
      required: ["email", "password"],
      properties: {
        email: { type: "string", example: "user@example.com" },
        password: { type: "string", example: "Password123" },
      },
    },
  })
  @ApiResponse({ status: 200, description: "登录成功" })
  @ApiResponse({ status: 401, description: "认证失败" })
  async login(@Body() body: { email: string; password: string }) {
    return this.authService.login(body.email, body.password);
  }

  @Post("login/wechat")
  @ApiOperation({ summary: "微信登录", description: "使用微信授权信息登录" })
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
  @ApiResponse({ status: 200, description: "登录成功" })
  @ApiResponse({ status: 400, description: "参数错误" })
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
  @ApiResponse({ status: 200, description: "登录成功" })
  @ApiResponse({ status: 401, description: "认证失败" })
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
  @ApiResponse({ status: 200, description: "成功" })
  @ApiResponse({ status: 401, description: "未授权" })
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
  @ApiResponse({ status: 200, description: "成功" })
  @ApiResponse({ status: 401, description: "未授权" })
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
  @ApiResponse({ status: 200, description: "绑定成功" })
  @ApiResponse({ status: 401, description: "未授权" })
  @ApiResponse({ status: 409, description: "微信账号已被绑定" })
  async bindWechat(
    @Req() req: any,
    @Body() body: { openId: string; unionId?: string },
  ) {
    return this.authService.bindWechat(req.user.userId, body);
  }
}
