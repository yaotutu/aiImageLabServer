import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * 当前用户装饰器
 * 从请求中提取当前登录用户信息
 *
 * @example
 * @Get('profile')
 * getProfile(@CurrentUser() userId: string) {
 *   return this.userService.findOne(userId);
 * }
 *
 * @example
 * @Get('info')
 * getInfo(@CurrentUser('email') email: string) {
 *   return { email };
 * }
 */
export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return null;
    }

    return data ? user[data] : user.userId;
  },
);
