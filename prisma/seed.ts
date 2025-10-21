import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 开始数据库初始化...');

  // 1. 创建默认管理员
  console.log('📝 创建默认管理员账号...');
  const adminPassword = await bcrypt.hash('admin123', 10);

  const admin = await prisma.admin.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      passwordHash: adminPassword,
      realName: '系统管理员',
      role: 'SUPER_ADMIN',
    }
  });
  console.log(`✅ 创建管理员: ${admin.username} (密码: admin123)`);

  // 2. 创建证件照规格
  console.log('📸 创建证件照规格...');
  const idPhotoSpecs = [
    {
      name: '1寸',
      width: 295,
      height: 413,
      description: '标准1寸证件照，常用于简历、档案等',
      sortOrder: 1
    },
    {
      name: '2寸',
      width: 413,
      height: 626,
      description: '标准2寸证件照，常用于护照、签证等',
      sortOrder: 2
    },
    {
      name: '小2寸',
      width: 413,
      height: 531,
      description: '小2寸证件照，常用于驾照、社保等',
      sortOrder: 3
    },
    {
      name: '大1寸',
      width: 390,
      height: 567,
      description: '大1寸证件照',
      sortOrder: 4
    },
    {
      name: '5寸',
      width: 1050,
      height: 1500,
      description: '5寸照片',
      sortOrder: 5
    }
  ];

  for (const spec of idPhotoSpecs) {
    await prisma.idPhotoSpec.upsert({
      where: { name: spec.name },
      update: {},
      create: spec
    });
  }
  console.log(`✅ 创建了 ${idPhotoSpecs.length} 个证件照规格`);

  // 3. 创建形象照风格
  console.log('🎨 创建形象照风格...');
  const portraitStyles = [
    {
      categoryId: 'professional',
      categoryName: '职业形象',
      name: '商务正装',
      description: '专业商务正装形象照，适合职场使用',
      creditsRequired: 2,
      sortOrder: 1
    },
    {
      categoryId: 'professional',
      categoryName: '职业形象',
      name: '商务休闲',
      description: '商务休闲风格形象照',
      creditsRequired: 2,
      sortOrder: 2
    },
    {
      categoryId: 'creative',
      categoryName: '创意形象',
      name: '艺术风格',
      description: '创意艺术风格形象照',
      creditsRequired: 3,
      sortOrder: 3
    },
    {
      categoryId: 'casual',
      categoryName: '日常形象',
      name: '清新自然',
      description: '清新自然风格形象照',
      creditsRequired: 2,
      sortOrder: 4
    }
  ];

  for (const style of portraitStyles) {
    await prisma.portraitStyle.create({
      data: style
    });
  }
  console.log(`✅ 创建了 ${portraitStyles.length} 个形象照风格`);

  // 4. 创建示例模版
  console.log('📋 创建示例模版...');
  const templates = [
    {
      name: '证件照-蓝底',
      description: '标准蓝底证件照',
      category: 'id_photo',
      tags: JSON.stringify(['证件照', '蓝底', '正式']),
      aiProvider: 'mock',
      aiParams: JSON.stringify({ background: 'blue', style: 'formal' }),
      creditsRequired: 1,
      isActive: true,
      sortOrder: 1,
      createdBy: admin.id
    },
    {
      name: '证件照-白底',
      description: '标准白底证件照',
      category: 'id_photo',
      tags: JSON.stringify(['证件照', '白底', '正式']),
      aiProvider: 'mock',
      aiParams: JSON.stringify({ background: 'white', style: 'formal' }),
      creditsRequired: 1,
      isActive: true,
      sortOrder: 2,
      createdBy: admin.id
    },
    {
      name: '证件照-红底',
      description: '标准红底证件照',
      category: 'id_photo',
      tags: JSON.stringify(['证件照', '红底', '正式']),
      aiProvider: 'mock',
      aiParams: JSON.stringify({ background: 'red', style: 'formal' }),
      creditsRequired: 1,
      isActive: true,
      sortOrder: 3,
      createdBy: admin.id
    },
    {
      name: '商务形象照',
      description: '专业商务形象照',
      category: 'portrait',
      tags: JSON.stringify(['形象照', '商务', '职业']),
      aiProvider: 'mock',
      aiParams: JSON.stringify({ style: 'business', quality: 'high' }),
      creditsRequired: 2,
      isActive: true,
      sortOrder: 4,
      createdBy: admin.id
    },
    {
      name: '创意海报',
      description: '个性创意海报',
      category: 'template_square',
      tags: JSON.stringify(['创意', '海报', '个性']),
      aiProvider: 'mock',
      aiParams: JSON.stringify({ style: 'creative', type: 'poster' }),
      creditsRequired: 3,
      isActive: true,
      isPremium: true,
      sortOrder: 5,
      createdBy: admin.id
    }
  ];

  for (const template of templates) {
    await prisma.template.create({
      data: template
    });
  }
  console.log(`✅ 创建了 ${templates.length} 个示例模版`);

  // 5. 创建系统配置
  console.log('⚙️  创建系统配置...');
  const systemConfigs = [
    {
      key: 'free_user_daily_limit',
      value: JSON.stringify(5),
      description: '免费用户每日生成限制'
    },
    {
      key: 'generation_cooldown',
      value: JSON.stringify(30000),
      description: '生成冷却时间(毫秒)'
    },
    {
      key: 'ad_reward_credits',
      value: JSON.stringify(1),
      description: '观看广告奖励的积分数'
    },
    {
      key: 'default_user_credits',
      value: JSON.stringify(3),
      description: '新用户默认积分'
    },
    {
      key: 'credit_packages',
      value: JSON.stringify([
        { credits: 50, price: 9.9, name: '入门包' },
        { credits: 200, price: 29.9, name: '标准包' },
        { credits: 500, price: 59.9, name: '超值包' }
      ]),
      description: '积分充值套餐'
    },
    {
      key: 'max_file_size',
      value: JSON.stringify(10 * 1024 * 1024),
      description: '最大上传文件大小(字节)'
    },
    {
      key: 'supported_image_formats',
      value: JSON.stringify(['jpg', 'jpeg', 'png', 'webp']),
      description: '支持的图片格式'
    }
  ];

  for (const config of systemConfigs) {
    await prisma.systemConfig.upsert({
      where: { key: config.key },
      update: { value: config.value, description: config.description },
      create: config
    });
  }
  console.log(`✅ 创建了 ${systemConfigs.length} 个系统配置`);

  // 6. 创建测试用户（仅开发环境）
  if (process.env.NODE_ENV === 'development') {
    console.log('👤 创建测试用户...');

    const testUserEmail = 'test@example.com';
    const testUserPassword = await bcrypt.hash('test123', 10);

    const testUser = await prisma.user.upsert({
      where: { email: testUserEmail },
      update: {},
      create: {
        email: testUserEmail,
        passwordHash: testUserPassword,
        nickname: '测试用户',
        emailVerified: true,
        loginType: 'EMAIL',
        credits: 10
      }
    });
    console.log(`✅ 创建测试用户: ${testUser.email} (密码: test123, 积分: 10)`);
  }

  console.log('\n✨ 数据库初始化完成！');
  console.log('\n📋 初始化摘要:');
  console.log(`   - 管理员账号: admin / admin123`);
  console.log(`   - 证件照规格: ${idPhotoSpecs.length} 个`);
  console.log(`   - 形象照风格: ${portraitStyles.length} 个`);
  console.log(`   - 示例模版: ${templates.length} 个`);
  console.log(`   - 系统配置: ${systemConfigs.length} 个`);
  if (process.env.NODE_ENV === 'development') {
    console.log(`   - 测试用户: test@example.com / test123`);
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ 数据库初始化失败:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
