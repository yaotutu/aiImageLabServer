import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();

// 数据源URL
const PROMPT_SOURCE_URL = 'https://opennana.com/awesome-prompt-gallery/data/prompts.json';
const IMAGE_BASE_URL = 'https://opennana.com/awesome-prompt-gallery/';

// 根据tags推断category的映射规则
function inferCategory(tags: string[]): string {
  const tagSet = new Set(tags.map(t => t.toLowerCase()));

  // 优先级从高到低匹配
  if (tagSet.has('portrait') || tagSet.has('headshot') || tagSet.has('face')) {
    return 'template_character';
  }
  if (tagSet.has('landscape') || tagSet.has('nature') || tagSet.has('scenery')) {
    return 'template_landscape';
  }
  if (tagSet.has('interior') || tagSet.has('room') || tagSet.has('architecture')) {
    return 'template_square';
  }
  if (tagSet.has('artistic') || tagSet.has('art') || tagSet.has('abstract')) {
    return 'template_artistic';
  }

  // 默认归类为艺术类
  return 'template_artistic';
}

// 根据prompt内容和tags判断是否为高级模版
function isPremiumTemplate(prompt: string, tags: string[]): boolean {
  const premiumKeywords = ['professional', 'cinematic', 'high-end', 'luxury', 'detailed'];
  const promptLower = prompt.toLowerCase();

  // 检查prompt长度（长提示词通常更专业）
  if (prompt.length > 500) return true;

  // 检查关键词
  if (premiumKeywords.some(keyword => promptLower.includes(keyword))) {
    return true;
  }

  return false;
}

// 根据复杂度估算所需积分
function estimateCredits(prompt: string, isPremium: boolean): number {
  if (isPremium) return 3;
  if (prompt.length > 300) return 2;
  return 1;
}

interface PromptItem {
  id: number;
  slug: string;
  title: string;
  source: {
    name: string;
    url: string;
  };
  images: string[];
  prompts: string[];
  examples: any[];
  notes: any[];
  originFile: string;
  description: string;
  tags: string[];
  coverImage: string;
}

interface PromptData {
  generatedAt: string;
  total: number;
  items: PromptItem[];
}

async function main() {
  console.log('🚀 开始导入提示词模版...\n');

  try {
    // 1. 获取管理员ID（用于创建者字段）
    console.log('📝 获取管理员信息...');
    const admin = await prisma.admin.findFirst({
      where: { role: 'SUPER_ADMIN' }
    });

    if (!admin) {
      throw new Error('未找到管理员账号，请先运行 npm run prisma:seed');
    }
    console.log(`✅ 使用管理员: ${admin.username}\n`);

    // 2. 从远程获取数据
    console.log(`📥 正在从远程获取数据: ${PROMPT_SOURCE_URL}`);
    const response = await axios.get<PromptData>(PROMPT_SOURCE_URL, {
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; TemplateImporter/1.0)'
      }
    });

    const data = response.data;
    console.log(`✅ 获取成功，共 ${data.total} 条数据\n`);

    // 3. 转换并导入数据
    console.log('🔄 开始转换和导入数据...');
    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    for (const item of data.items) {
      try {
        // 跳过没有prompts的数据
        if (!item.prompts || item.prompts.length === 0) {
          console.log(`⏭️  跳过 [${item.id}] ${item.title} - 无提示词`);
          skipCount++;
          continue;
        }

        // 跳过没有图片的数据
        if (!item.coverImage && (!item.images || item.images.length === 0)) {
          console.log(`⏭️  跳过 [${item.id}] ${item.title} - 无图片`);
          skipCount++;
          continue;
        }

        // 提取第一个提示词（通常是英文版）
        const mainPrompt = item.prompts[0];
        const isPremium = isPremiumTemplate(mainPrompt, item.tags);
        const category = inferCategory(item.tags);
        const credits = estimateCredits(mainPrompt, isPremium);

        // 处理图片URLs
        const thumbnailUrl = item.coverImage
          ? `${IMAGE_BASE_URL}${item.coverImage}`
          : `${IMAGE_BASE_URL}${item.images[0]}`;

        const previewUrls = item.images.map(img => `${IMAGE_BASE_URL}${img}`);

        // 构建描述（如果原始描述为空，使用title）
        const description = item.description || item.title;

        // 构建aiParams，保存额外信息
        const aiParams = {
          allPrompts: item.prompts, // 保存所有语言版本
          originalId: item.id,
          complexity: mainPrompt.length > 500 ? 'high' : mainPrompt.length > 200 ? 'medium' : 'low'
        };

        // 检查是否已存在（根据name去重）
        const existing = await prisma.template.findFirst({
          where: { name: item.title }
        });

        if (existing) {
          console.log(`⏭️  跳过 [${item.id}] ${item.title} - 已存在`);
          skipCount++;
          continue;
        }

        // 创建模版
        await prisma.template.create({
          data: {
            name: item.title,
            description,
            category,
            tags: JSON.stringify(item.tags),
            thumbnailUrl,
            previewUrls: JSON.stringify(previewUrls),
            aiProvider: 'midjourney', // 默认使用midjourney
            aiParams: JSON.stringify(aiParams),
            prompt: mainPrompt,
            creditsRequired: credits,
            isPremium,
            isActive: true,
            sortOrder: data.total - item.id, // 新的排在前面
            createdBy: admin.id
          }
        });

        successCount++;
        console.log(`✅ [${successCount}/${data.total}] 导入: ${item.title} (${category}, ${credits}积分${isPremium ? ', 高级' : ''})`);

      } catch (error: any) {
        errorCount++;
        console.error(`❌ 导入失败 [${item.id}] ${item.title}:`, error.message);
      }
    }

    // 4. 统计结果
    console.log('\n' + '='.repeat(60));
    console.log('📊 导入完成统计:');
    console.log(`   ✅ 成功导入: ${successCount} 条`);
    console.log(`   ⏭️  跳过: ${skipCount} 条`);
    console.log(`   ❌ 失败: ${errorCount} 条`);
    console.log(`   📝 总计: ${data.total} 条`);
    console.log('='.repeat(60));

    // 5. 显示分类统计
    const categoryStats = await prisma.template.groupBy({
      by: ['category'],
      _count: true
    });

    console.log('\n📂 模版分类统计:');
    for (const stat of categoryStats) {
      console.log(`   ${stat.category}: ${stat._count} 个`);
    }

    console.log('\n✨ 导入脚本执行完成！');

  } catch (error: any) {
    console.error('\n❌ 导入过程出错:', error.message);
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', error.response.data);
    }
    process.exit(1);
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ 脚本执行失败:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
