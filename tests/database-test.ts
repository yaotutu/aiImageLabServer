import { prisma } from '../src/config/database';

/**
 * 数据库功能验证脚本
 * 测试基本的CRUD操作
 */

async function testDatabase() {
  console.log('🧪 开始数据库功能验证...\n');

  try {
    // 1. 测试管理员查询
    console.log('1️⃣  测试管理员查询...');
    const adminCount = await prisma.admin.count();
    console.log(`   ✅ 管理员总数: ${adminCount}`);

    const admin = await prisma.admin.findFirst();
    if (admin) {
      console.log(`   ✅ 找到管理员: ${admin.username} (${admin.realName})`);
      console.log(`   ✅ 角色: ${admin.role}`);
    }

    // 2. 测试用户查询
    console.log('\n2️⃣  测试用户查询...');
    const userCount = await prisma.user.count();
    console.log(`   ✅ 用户总数: ${userCount}`);

    if (userCount > 0) {
      const user = await prisma.user.findFirst();
      if (user) {
        console.log(`   ✅ 找到用户: ${user.nickname} (${user.email || user.phone || '无联系方式'})`);
        console.log(`   ✅ 积分: ${user.credits}`);
      }
    }

    // 3. 测试模版查询
    console.log('\n3️⃣  测试模版查询...');
    const templateCount = await prisma.template.count();
    console.log(`   ✅ 模版总数: ${templateCount}`);

    const templates = await prisma.template.findMany({
      take: 3,
      orderBy: { sortOrder: 'asc' }
    });
    templates.forEach(t => {
      console.log(`   ✅ 模版: ${t.name} (${t.category}, ${t.creditsRequired}积分)`);
    });

    // 4. 测试证件照规格查询
    console.log('\n4️⃣  测试证件照规格查询...');
    const specCount = await prisma.idPhotoSpec.count();
    console.log(`   ✅ 证件照规格总数: ${specCount}`);

    const specs = await prisma.idPhotoSpec.findMany({
      orderBy: { sortOrder: 'asc' }
    });
    specs.forEach(s => {
      console.log(`   ✅ ${s.name}: ${s.width}x${s.height}px`);
    });

    // 5. 测试形象照风格查询
    console.log('\n5️⃣  测试形象照风格查询...');
    const styleCount = await prisma.portraitStyle.count();
    console.log(`   ✅ 形象照风格总数: ${styleCount}`);

    const styles = await prisma.portraitStyle.findMany({
      orderBy: { sortOrder: 'asc' }
    });
    styles.forEach(s => {
      console.log(`   ✅ ${s.categoryName} - ${s.name} (${s.creditsRequired}积分)`);
    });

    // 6. 测试系统配置查询
    console.log('\n6️⃣  测试系统配置查询...');
    const configCount = await prisma.systemConfig.count();
    console.log(`   ✅ 系统配置总数: ${configCount}`);

    const configs = await prisma.systemConfig.findMany();
    configs.forEach(c => {
      console.log(`   ✅ ${c.key}: ${c.value} (${c.description})`);
    });

    // 7. 测试关联查询
    console.log('\n7️⃣  测试关联查询...');
    const templateWithCreator = await prisma.template.findFirst({
      where: { createdBy: { not: null } },
      include: { creator: true }
    });
    if (templateWithCreator) {
      console.log(`   ✅ 模版 "${templateWithCreator.name}" 由 ${templateWithCreator.creator?.realName} 创建`);
    }

    // 8. 测试数据库连接状态
    console.log('\n8️⃣  测试数据库连接状态...');
    await prisma.$queryRaw`SELECT 1`;
    console.log('   ✅ 数据库连接正常');

    console.log('\n✨ 数据库功能验证全部通过！');

  } catch (error) {
    console.error('\n❌ 数据库功能验证失败:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// 运行测试
testDatabase()
  .then(() => {
    console.log('\n✅ 测试完成');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ 测试失败:', error);
    process.exit(1);
  });
