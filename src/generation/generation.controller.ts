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

@ApiTags("图像生成")
@ApiBearerAuth("JWT-auth")
@Controller("generations")
@UseGuards(JwtAuthGuard)
export class GenerationController {
  constructor(private generationService: GenerationService) {}

  @Post()
  @ApiOperation({
    summary: "创建图像生成任务",
    description: "使用模板创建新的图像生成任务，返回任务ID",
  })
  @ApiBody({
    schema: {
      type: "object",
      required: ["templateId", "generationType"],
      properties: {
        templateId: { type: "string", example: "clh0drk6r0000lufbngp6t3p7" },
        generationType: {
          type: "string",
          enum: ["TEMPLATE", "ID_PHOTO", "PORTRAIT"],
          example: "TEMPLATE",
        },
        title: { type: "string", example: "我的第一张AI图片" },
        aiParams: {
          type: "object",
          example: { style: "realistic", quality: "high" },
        },
      },
    },
  })
  @ApiSuccessResponse()
  @ApiResponse({ status: 400, description: "参数错误或积分不足" })
  @ApiResponse({ status: 404, description: "模板不存在" })
  async createTask(@Body() createDto: CreateGenerationDto, @Req() req: any) {
    return this.generationService.createTask(req.user.userId, createDto);
  }

  @Post(":taskId/upload")
  @ApiOperation({
    summary: "上传原始图片",
    description: "为已创建的任务上传原始图片，上传成功后开始生成",
  })
  @ApiConsumes("multipart/form-data")
  @ApiParam({ name: "taskId", description: "任务ID" })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        image: {
          type: "string",
          format: "binary",
          description: "图片文件（支持 JPG, PNG, WEBP，最大10MB）",
        },
      },
    },
  })
  @ApiSuccessResponse()
  @ApiResponse({ status: 400, description: "文件格式错误或任务状态不允许上传" })
  @ApiResponse({ status: 404, description: "任务不存在" })
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
  async uploadImage(
    @Param("taskId") taskId: string,
    @UploadedFile()
    file: Express.Multer.File,
    @Req() req: any,
  ) {
    const imagePath = `/uploads/originals/${file.filename}`;
    return this.generationService.uploadImage(
      taskId,
      req.user.userId,
      imagePath,
    );
  }

  @Get(":taskId/status")
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
