import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiConsumes,
} from "@nestjs/swagger";
import { ApiSuccessResponse } from "../common/decorators/api-response.decorator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { GenerationService } from "./generation.service";
import { CreateGenerationDto } from "./dto/create-generation.dto";
import { diskStorage } from "multer";
import { extname } from "path";
import { v4 as uuidv4 } from "uuid";
import * as fs from "fs";
import * as path from "path";

@ApiTags("Generations")
@ApiBearerAuth("JWT-auth")
@Controller("generations")
export class GenerationController {
  constructor(private generationService: GenerationService) {}

  /**
   * 保存 Base64 图片到文件系统
   * @param base64Data Base64 编码的图片（支持 data URI 或纯 base64）
   * @returns 保存后的文件路径
   */
  private async saveBase64Image(base64Data: string): Promise<string> {
    try {
      // 解析 base64 数据
      let base64String = base64Data;
      let mimeType = "image/png"; // 默认

      // 如果是 data URI 格式，提取 MIME 类型和 base64 数据
      if (base64Data.startsWith("data:")) {
        const matches = base64Data.match(/^data:([^;]+);base64,(.+)$/);
        if (!matches) {
          throw new BadRequestException("无效的 Base64 图片格式");
        }
        mimeType = matches[1];
        base64String = matches[2];
      }

      // 确定文件扩展名
      let ext = ".png";
      if (mimeType.includes("jpeg") || mimeType.includes("jpg")) {
        ext = ".jpg";
      } else if (mimeType.includes("webp")) {
        ext = ".webp";
      }

      // 生成唯一文件名
      const filename = `${uuidv4()}${ext}`;
      const uploadDir = path.join(process.cwd(), "uploads", "originals");
      const filePath = path.join(uploadDir, filename);

      // 确保上传目录存在
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      // 将 base64 转换为 Buffer 并保存
      const buffer = Buffer.from(base64String, "base64");
      fs.writeFileSync(filePath, buffer);

      // 返回相对路径
      return `/uploads/originals/${filename}`;
    } catch (error: any) {
      throw new BadRequestException(`保存图片失败: ${error.message}`);
    }
  }

  @Post("test")
  @ApiOperation({
    summary: "测试创建生成任务（无需认证）",
    description: "临时测试接口",
  })
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      required: ["templateId", "image"],
      properties: {
        templateId: {
          type: "string",
          description: "模版ID",
          example: "cmh4v5z7y00jx2dmofp3x2ars"
        },
        image: {
          type: "string",
          format: "binary",
          description: "用户照片（支持 JPG, PNG, WEBP，最大10MB）",
        },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor("image", {
      storage: diskStorage({
        destination: "./uploads/originals",
        filename: (req, file, cb) => {
          const uniqueName = `${uuidv4()}${extname(file.originalname)}`;
          cb(null, uniqueName);
        },
      }),
      fileFilter: (req, file, cb) => {
        const allowedMimes = [
          "image/jpeg",
          "image/jpg",
          "image/png",
          "image/webp",
        ];
        if (allowedMimes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(
            new Error(
              `不支持的文件类型: ${file.mimetype}。仅支持 JPG, PNG, WEBP 格式`,
            ),
            false,
          );
        }
      },
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
    }),
  )
  async testCreateTask(
    @Body() body: { templateId: string },
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
  ) {
    // 使用固定的测试用户ID
    const testUserId = "cmh4kbwi20000lvocydc1dnvx";
    const imagePath = `/uploads/originals/${file.filename}`;

    const createDto: CreateGenerationDto = {
      templateId: body.templateId,
      generationType: "TEMPLATE",
      title: "测试生成任务",
    };

    return this.generationService.createAndGenerate(
      testUserId,
      createDto,
      imagePath,
    );
  }

  @Post("base64")
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: "创建图像生成任务（Base64）",
    description: "使用 Base64 编码的图片创建生成任务，适合前端直接传输",
  })
  @ApiBody({
    schema: {
      type: "object",
      required: ["templateId", "imageBase64"],
      properties: {
        templateId: {
          type: "string",
          description: "模版ID",
          example: "cmh4v5z7y00jx2dmofp3x2ars",
        },
        imageBase64: {
          type: "string",
          description: "Base64 编码的图片（支持 data URI 格式或纯 base64 字符串）",
          example: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
        },
        generationType: {
          type: "string",
          enum: ["TEMPLATE", "ID_PHOTO", "PORTRAIT"],
          example: "TEMPLATE",
          description: "可选，默认为 TEMPLATE",
        },
        title: {
          type: "string",
          example: "我的第一张AI图片",
          description: "可选，不填写则自动生成",
        },
      },
    },
  })
  @ApiSuccessResponse()
  @ApiResponse({ status: 400, description: "参数错误或积分不足" })
  @ApiResponse({ status: 404, description: "模板不存在" })
  async createTaskWithBase64(
    @Body() body: {
      templateId: string;
      imageBase64: string;
      generationType?: string;
      title?: string;
    },
    @Req() req: any,
  ) {
    // 保存 base64 图片到文件
    const imagePath = await this.saveBase64Image(body.imageBase64);

    const createDto: CreateGenerationDto = {
      templateId: body.templateId,
      generationType: body.generationType || "TEMPLATE",
      title: body.title,
    };

    return this.generationService.createAndGenerate(
      req.user.userId,
      createDto,
      imagePath,
    );
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: "创建图像生成任务（文件上传）",
    description: "上传图片文件并使用模版生成新图片",
  })
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      required: ["templateId", "image"],
      properties: {
        templateId: {
          type: "string",
          description: "模版ID",
          example: "clh0drk6r0000lufbngp6t3p7"
        },
        generationType: {
          type: "string",
          enum: ["TEMPLATE", "ID_PHOTO", "PORTRAIT"],
          example: "TEMPLATE",
          description: "可选，默认为 TEMPLATE"
        },
        image: {
          type: "string",
          format: "binary",
          description: "用户照片（支持 JPG, PNG, WEBP，最大10MB）",
        },
        title: {
          type: "string",
          example: "我的第一张AI图片",
          description: "可选，不填写则自动生成"
        },
      },
    },
  })
  @ApiSuccessResponse()
  @ApiResponse({ status: 400, description: "参数错误或积分不足" })
  @ApiResponse({ status: 404, description: "模板不存在" })
  @UseInterceptors(
    FileInterceptor("image", {
      storage: diskStorage({
        destination: "./uploads/originals",
        filename: (req, file, cb) => {
          const uniqueName = `${uuidv4()}${extname(file.originalname)}`;
          cb(null, uniqueName);
        },
      }),
      fileFilter: (req, file, cb) => {
        const allowedMimes = [
          "image/jpeg",
          "image/jpg",
          "image/png",
          "image/webp",
        ];
        if (allowedMimes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(
            new Error(
              `不支持的文件类型: ${file.mimetype}。仅支持 JPG, PNG, WEBP 格式`,
            ),
            false,
          );
        }
      },
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
    }),
  )
  async createTask(
    @Body() body: { templateId: string; generationType?: string; title?: string },
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any
  ) {
    const imagePath = `/uploads/originals/${file.filename}`;

    const createDto: CreateGenerationDto = {
      templateId: body.templateId,
      generationType: body.generationType || 'TEMPLATE',
      title: body.title,
    };

    return this.generationService.createAndGenerate(
      req.user.userId,
      createDto,
      imagePath
    );
  }

  
  @Get(":taskId/status")
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: "查询任务状态",
    description: "查询指定任务的生成状态和进度",
  })
  @ApiParam({ name: "taskId", description: "任务ID" })
  @ApiSuccessResponse()
  @ApiResponse({ status: 404, description: "任务不存在" })
  async getTaskStatus(@Param("taskId") taskId: string, @Req() req: any) {
    return this.generationService.getTaskStatus(taskId, req.user.userId);
  }

  @Get(":taskId/test-status")
  @ApiOperation({
    summary: "测试查询任务状态（无需认证）",
    description: "临时测试接口",
  })
  @ApiParam({ name: "taskId", description: "任务ID" })
  async testGetTaskStatus(@Param("taskId") taskId: string) {
    // 使用固定的测试用户ID
    const testUserId = "cmh4kbwi20000lvocydc1dnvx";
    return this.generationService.getTaskStatus(taskId, testUserId);
  }

  @Get()
  @ApiOperation({
    summary: "获取用户任务列表",
    description: "分页查询当前用户的所有生成任务",
  })
  @ApiQuery({
    name: "page",
    required: false,
    description: "页码",
    example: 1,
  })
  @ApiQuery({
    name: "pageSize",
    required: false,
    description: "每页数量",
    example: 20,
  })
  @ApiSuccessResponse()
  async getUserTasks(
    @Query("page") page: number = 1,
    @Query("pageSize") pageSize: number = 20,
    @Req() req: any,
  ) {
    return this.generationService.getUserTasks(
      req.user.userId,
      Number(page),
      Number(pageSize),
    );
  }

  @Delete(":taskId")
  @ApiOperation({
    summary: "取消任务",
    description: "取消正在进行或等待中的生成任务",
  })
  @ApiParam({ name: "taskId", description: "任务ID" })
  @ApiSuccessResponse()
  @ApiResponse({ status: 400, description: "任务状态不允许取消" })
  @ApiResponse({ status: 404, description: "任务不存在" })
  async cancelTask(@Param("taskId") taskId: string, @Req() req: any) {
    return this.generationService.cancelTask(taskId, req.user.userId);
  }
}
