import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
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
   * 生成图像
   * @param params 生成参数
   */
  async generateImage(params: GenerationParams): Promise<GenerationResult> {
    try {
      const startTime = Date.now();

      // 构建请求内容
      const content: any[] = [];

      // 如果有输入图片，先添加图片
      if (params.imageUrl) {
        content.push({ image: params.imageUrl });
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
