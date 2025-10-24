import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiParam, ApiBody, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { TemplateService } from './template.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('模版')
@Controller('templates')
export class TemplateController {
  constructor(private templateService: TemplateService) {}

  @Get()
  @ApiOperation({ summary: '获取模版列表', description: '支持分页、分类和付费模式筛选' })
  @ApiQuery({ name: 'category', required: false, description: '模版分类' })
  @ApiQuery({ name: 'isPremium', required: false, description: '是否付费模版' })
  @ApiQuery({ name: 'page', required: false, description: '页码' })
  @ApiQuery({ name: 'pageSize', required: false, description: '每页数量' })
  @ApiResponse({ status: 200, description: '成功' })
  async findAll(
    @Query('category') category?: string,
    @Query('isPremium') isPremium?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const size = pageSize ? parseInt(pageSize, 10) : 20;
    const skip = (pageNum - 1) * size;

    return this.templateService.findAll({
      category,
      isPremium: isPremium === 'true' ? true : isPremium === 'false' ? false : undefined,
      skip,
      take: size,
    });
  }

  @Get('hot')
  @ApiOperation({ summary: '获取热门模版' })
  @ApiQuery({ name: 'limit', required: false, description: '返回数量限制' })
  @ApiResponse({ status: 200, description: '成功' })
  async findHot(@Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.templateService.findHot(limitNum);
  }

  @Get('search')
  @ApiOperation({ summary: '搜索模版' })
  @ApiQuery({ name: 'keyword', required: true, description: '搜索关键词' })
  @ApiResponse({ status: 200, description: '成功' })
  async search(@Query('keyword') keyword: string) {
    return this.templateService.search(keyword);
  }

  @Get('category/:category')
  @ApiOperation({ summary: '按分类获取模版' })
  @ApiParam({ name: 'category', description: '模版分类' })
  @ApiResponse({ status: 200, description: '成功' })
  async findByCategory(@Param('category') category: string) {
    return this.templateService.findByCategory(category);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取模版详情' })
  @ApiParam({ name: 'id', description: '模版ID' })
  @ApiResponse({ status: 200, description: '成功' })
  @ApiResponse({ status: 404, description: '模版不存在' })
  async findById(@Param('id') id: string) {
    return this.templateService.findById(id);
  }

  @Post(':id/like')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '点赞模版' })
  @ApiParam({ name: 'id', description: '模版ID' })
  @ApiResponse({ status: 200, description: '点赞成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  async like(@Param('id') id: string) {
    return this.templateService.toggleLike(id, true);
  }

  @Delete(':id/like')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '取消点赞' })
  @ApiParam({ name: 'id', description: '模版ID' })
  @ApiResponse({ status: 200, description: '取消成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  async unlike(@Param('id') id: string) {
    return this.templateService.toggleLike(id, false);
  }

  @Post()
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '创建模版（管理员）' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['name', 'category', 'aiProvider'],
      properties: {
        name: { type: 'string', example: '证件照模版' },
        description: { type: 'string', example: '专业证件照生成' },
        category: { type: 'string', example: 'id_photo' },
        tags: { type: 'array', items: { type: 'string' }, example: ['证件照', '一寸照'] },
        thumbnailUrl: { type: 'string', example: 'https://example.com/thumb.jpg' },
        previewUrls: { type: 'array', items: { type: 'string' } },
        aiProvider: { type: 'string', example: 'midjourney' },
        aiParams: { type: 'object' },
        prompt: { type: 'string' },
        creditsRequired: { type: 'number', example: 10 },
        isPremium: { type: 'boolean', example: false },
        sortOrder: { type: 'number', example: 100 },
      },
    },
  })
  @ApiResponse({ status: 201, description: '创建成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  async create(
    @Body()
    body: {
      name: string;
      description?: string;
      category: string;
      tags?: string[];
      thumbnailUrl?: string;
      previewUrls?: string[];
      aiProvider: string;
      aiParams?: any;
      prompt?: string;
      creditsRequired?: number;
      isPremium?: boolean;
      sortOrder?: number;
    },
  ) {
    return this.templateService.create(body);
  }

  @Put(':id')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '更新模版（管理员）' })
  @ApiParam({ name: 'id', description: '模版ID' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 404, description: '模版不存在' })
  async update(
    @Param('id') id: string,
    @Body()
    body: {
      name?: string;
      description?: string;
      category?: string;
      tags?: string[];
      thumbnailUrl?: string;
      previewUrls?: string[];
      aiProvider?: string;
      aiParams?: any;
      prompt?: string;
      creditsRequired?: number;
      isPremium?: boolean;
      isActive?: boolean;
      sortOrder?: number;
    },
  ) {
    return this.templateService.update(id, body);
  }

  @Delete(':id')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '删除模版（管理员）' })
  @ApiParam({ name: 'id', description: '模版ID' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 404, description: '模版不存在' })
  async delete(@Param('id') id: string) {
    return this.templateService.delete(id);
  }
}
