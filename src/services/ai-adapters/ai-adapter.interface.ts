/**
 * AI服务适配器接口
 * 所有AI服务商都需要实现此接口
 */
export interface GenerationParams {
  imageUrl?: string; // 输入图片URL
  prompt: string; // 文本提示词
  negativePrompt?: string; // 负面提示词
  model?: string; // 模型名称
  [key: string]: any; // 其他自定义参数
}

export interface GenerationResult {
  success: boolean;
  imageUrl?: string; // 生成的图片URL
  width?: number;
  height?: number;
  error?: string;
  requestId?: string;
  rawResponse?: any; // 原始响应
}

export interface IAIAdapter {
  /**
   * 生成图像
   */
  generateImage(params: GenerationParams): Promise<GenerationResult>;

  /**
   * 检查生成状态（用于异步任务）
   */
  checkStatus?(taskId: string): Promise<GenerationResult>;
}
