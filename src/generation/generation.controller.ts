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

@ApiTags("Generations")
@ApiBearerAuth("JWT-auth")
@Controller("generations")
export class GenerationController {
  constructor(private generationService: GenerationService) {}

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

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: "创建图像生成任务",
    description: "上传图片并使用模版生成新图片，一步完成",
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
