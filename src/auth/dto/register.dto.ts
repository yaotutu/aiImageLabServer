import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    description: '邮箱地址',
    example: 'user@example.com',
  })
  @IsEmail({}, { message: '请输入有效的邮箱地址' })
  email: string;

  @ApiProperty({
    description: '密码（至少6个字符）',
    example: 'Password123',
    minLength: 6,
  })
  @IsString({ message: '密码必须是字符串' })
  @MinLength(6, { message: '密码至少需要6个字符' })
  password: string;

  @ApiPropertyOptional({
    description: '用户昵称（可选，不提供则使用邮箱前缀）',
    example: '测试用户',
  })
  @IsOptional()
  @IsString({ message: '昵称必须是字符串' })
  nickname?: string;
}
