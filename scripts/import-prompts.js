"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const axios_1 = __importDefault(require("axios"));
const prisma = new client_1.PrismaClient();
const PROMPT_SOURCE_URL = 'https://opennana.com/awesome-prompt-gallery/data/prompts.json';
const IMAGE_BASE_URL = 'https://opennana.com/awesome-prompt-gallery/';
function inferCategory(tags) {
    const tagSet = new Set(tags.map(t => t.toLowerCase()));
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
    return 'template_artistic';
}
function isPremiumTemplate(prompt, tags) {
    const premiumKeywords = ['professional', 'cinematic', 'high-end', 'luxury', 'detailed'];
    const promptLower = prompt.toLowerCase();
    if (prompt.length > 500)
        return true;
    if (premiumKeywords.some(keyword => promptLower.includes(keyword))) {
        return true;
    }
    return false;
}
function estimateCredits(prompt, isPremium) {
    if (isPremium)
        return 3;
    if (prompt.length > 300)
        return 2;
    return 1;
}
async function main() {
    console.log('🚀 开始导入提示词模版...\n');
    try {
        console.log('📝 获取管理员信息...');
        const admin = await prisma.admin.findFirst({
            where: { role: 'SUPER_ADMIN' }
        });
        if (!admin) {
            throw new Error('未找到管理员账号，请先运行 npm run prisma:seed');
        }
        console.log(`✅ 使用管理员: ${admin.username}\n`);
        console.log(`📥 正在从远程获取数据: ${PROMPT_SOURCE_URL}`);
        const response = await axios_1.default.get(PROMPT_SOURCE_URL, {
            timeout: 30000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; TemplateImporter/1.0)'
            }
        });
        const data = response.data;
        console.log(`✅ 获取成功，共 ${data.total} 条数据\n`);
        console.log('🔄 开始转换和导入数据...');
        let successCount = 0;
        let skipCount = 0;
        let errorCount = 0;
        for (const item of data.items) {
            try {
                if (!item.prompts || item.prompts.length === 0) {
                    console.log(`⏭️  跳过 [${item.id}] ${item.title} - 无提示词`);
                    skipCount++;
                    continue;
                }
                if (!item.coverImage && (!item.images || item.images.length === 0)) {
                    console.log(`⏭️  跳过 [${item.id}] ${item.title} - 无图片`);
                    skipCount++;
                    continue;
                }
                const mainPrompt = item.prompts[0];
                const isPremium = isPremiumTemplate(mainPrompt, item.tags);
                const category = inferCategory(item.tags);
                const credits = estimateCredits(mainPrompt, isPremium);
                const thumbnailUrl = item.coverImage
                    ? `${IMAGE_BASE_URL}${item.coverImage}`
                    : `${IMAGE_BASE_URL}${item.images[0]}`;
                const previewUrls = item.images.map(img => `${IMAGE_BASE_URL}${img}`);
                const description = item.description || item.title;
                const aiParams = {
                    allPrompts: item.prompts,
                    originalId: item.id,
                    complexity: mainPrompt.length > 500 ? 'high' : mainPrompt.length > 200 ? 'medium' : 'low'
                };
                const existing = await prisma.template.findFirst({
                    where: { name: item.title }
                });
                if (existing) {
                    console.log(`⏭️  跳过 [${item.id}] ${item.title} - 已存在`);
                    skipCount++;
                    continue;
                }
                await prisma.template.create({
                    data: {
                        name: item.title,
                        description,
                        category,
                        tags: JSON.stringify(item.tags),
                        thumbnailUrl,
                        previewUrls: JSON.stringify(previewUrls),
                        aiProvider: 'midjourney',
                        aiParams: JSON.stringify(aiParams),
                        prompt: mainPrompt,
                        creditsRequired: credits,
                        isPremium,
                        isActive: true,
                        sortOrder: data.total - item.id,
                        createdBy: admin.id
                    }
                });
                successCount++;
                console.log(`✅ [${successCount}/${data.total}] 导入: ${item.title} (${category}, ${credits}积分${isPremium ? ', 高级' : ''})`);
            }
            catch (error) {
                errorCount++;
                console.error(`❌ 导入失败 [${item.id}] ${item.title}:`, error.message);
            }
        }
        console.log('\n' + '='.repeat(60));
        console.log('📊 导入完成统计:');
        console.log(`   ✅ 成功导入: ${successCount} 条`);
        console.log(`   ⏭️  跳过: ${skipCount} 条`);
        console.log(`   ❌ 失败: ${errorCount} 条`);
        console.log(`   📝 总计: ${data.total} 条`);
        console.log('='.repeat(60));
        const categoryStats = await prisma.template.groupBy({
            by: ['category'],
            _count: true
        });
        console.log('\n📂 模版分类统计:');
        for (const stat of categoryStats) {
            console.log(`   ${stat.category}: ${stat._count} 个`);
        }
        console.log('\n✨ 导入脚本执行完成！');
    }
    catch (error) {
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
//# sourceMappingURL=import-prompts.js.map