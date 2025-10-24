import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import {
  IAIAdapter,
  GenerationParams,
  GenerationResult,
} from './ai-adapter.interface';

/**
 * 阿里云通义千问图像生成适配器
 * 支持文生图和图生图功能
 */
@Injectable()
export class AliyunQwenAdapter implements IAIAdapter {
  private readonly logger = new Logger(AliyunQwenAdapter.name);
  private readonly apiUrl =
    'https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation';
  private readonly apiKey: string;

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('ALIYUN_API_KEY', '');
    if (!this.apiKey) {
      this.logger.warn(
        '⚠️  阿里云API Key未配置，请在.env中设置ALIYUN_API_KEY',
      );
    }
  }

  /**
   * 将本地图片文件转换为 base64 格式
   * @param imagePath 图片路径（可以是 URL 或文件系统路径）
   */
  private convertImageToBase64(imagePath: string): string {
    try {
      // 如果是 HTTP URL，提取路径部分
      let filePath = imagePath;
      if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
        const url = new URL(imagePath);
        filePath = url.pathname; // 例如：/uploads/originals/xxx.png
      }

      // 移除开头的斜杠，将相对路径转换为绝对路径
      const cleanPath = filePath.startsWith('/') ? filePath.substring(1) : filePath;
      const absolutePath = path.join(process.cwd(), cleanPath);

      this.logger.log(`读取图片文件: ${absolutePath}`);

      // 读取图片文件
      const imageBuffer = fs.readFileSync(absolutePath);

      // 转换为 base64
      const base64Image = imageBuffer.toString('base64');

      // 根据文件扩展名确定 MIME 类型
      const ext = path.extname(absolutePath).toLowerCase();
      let mimeType = 'image/jpeg';
      if (ext === '.png') {
        mimeType = 'image/png';
      } else if (ext === '.webp') {
        mimeType = 'image/webp';
      } else if (ext === '.jpg' || ext === '.jpeg') {
        mimeType = 'image/jpeg';
      }

      // 返回 data URI 格式
      return `data:${mimeType};base64,${base64Image}`;
    } catch (error: any) {
      this.logger.error(`图片转换失败: ${error.message}`);
      throw new Error(`无法读取图片文件: ${imagePath}`);
    }
  }

  /**
   * 生成图像
   * @param params 生成参数
   */
  async generateImage(params: GenerationParams): Promise<GenerationResult> {
    try {
      const startTime = Date.now();

      // 构建请求内容
      const content: any[] = [];

      // 如果有输入图片，先添加图片（转换为 base64）
      if (params.imageUrl) {
        const base64Image = this.convertImageToBase64(params.imageUrl);
        content.push({ image: base64Image });
        this.logger.log(`图片已转换为 base64 格式，长度: ${base64Image.length}`);
      }

      // 添加文本提示词
      content.push({ text: params.prompt });

      // 构建请求体
      const requestBody = {
        model: params.model || 'qwen-image-edit',
        input: {
          messages: [
            {
              role: 'user',
              content,
            },
          ],
        },
        parameters: {
          negative_prompt: params.negativePrompt || ' ',
          watermark: false,
        },
      };

      this.logger.log(`调用阿里云API生成图像: ${JSON.stringify(requestBody)}`);

      // 发起请求
      const response = await axios.post(this.apiUrl, requestBody, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        timeout: 60000, // 60秒超时
      });

      const data = response.data;
      const duration = Date.now() - startTime;

      // 检查响应
      if (data.output && data.output.choices && data.output.choices.length > 0) {
        const choice = data.output.choices[0];
        const imageContent = choice.message.content.find(
          (item: any) => item.image,
        );

        if (imageContent && imageContent.image) {
          this.logger.log(
            `✅ 图像生成成功，耗时: ${duration}ms, 请求ID: ${data.request_id}`,
          );

          return {
            success: true,
            imageUrl: imageContent.image,
            width: data.usage?.width,
            height: data.usage?.height,
            requestId: data.request_id,
            rawResponse: data,
          };
        }
      }

      // 响应格式不正确
      this.logger.error(`阿里云API响应格式异常: ${JSON.stringify(data)}`);
      return {
        success: false,
        error: '生成失败：响应格式异常',
        rawResponse: data,
      };
    } catch (error: any) {
      this.logger.error(
        `阿里云API调用失败: ${error.message}`,
        error.stack,
      );

      let errorMessage = '图像生成失败';
      if (error.response) {
        errorMessage = `API错误: ${error.response.status} - ${JSON.stringify(error.response.data)}`;
      } else if (error.request) {
        errorMessage = '网络请求失败，请检查网络连接';
      }

      return {
        success: false,
        error: errorMessage,
        rawResponse: error.response?.data,
      };
    }
  }
}
