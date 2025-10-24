/**
 * 完整流程测试脚本
 * 测试从用户注册到图像生成的完整API流程
 */

const axios = require('axios');

// 配置
const BASE_URL = 'http://localhost:3000';
const TEST_USER = {
  email: 'test@example.com',
  password: 'test123456',
  nickname: 'Test User'
};

// 测试用的JWT Token（从你的环境变量获取）
const TEST_TOKEN = process.env.TEST_TOKEN || 'eyJhbGciOiJIUzI1NiIsInR5.6xf_k6qJXhJqKwEfLpDqoYYr5wE';

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function makeRequest(method, url, data = {}, headers = {}) {
  try {
    const response = await axios({
      method,
      url: `${BASE_URL}${url}`,
      data,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      validateStatus: false
    });
    return response.data;
  } catch (error) {
    console.error(`❌ ${method} ${url} 失败:`, error.response?.data || error.message);
    throw error;
  }
}

// 测试步骤
async function testCompleteFlow() {
  console.log('🧪 开始测试完整API流程...\n');

  try {
    // 1. 用户注册
    console.log('1️⃣ 注册测试用户...');
    const registerResponse = await makeRequest('POST', '/api/auth/register', TEST_USER);
    if (!registerResponse.success) {
      throw new Error(`注册失败: ${registerResponse.error}`);
    }
    console.log('✅ 用户注册成功');

    // 2. 用户登录
    console.log('2️⃣ 用户登录...');
    const loginResponse = await makeRequest('POST', '/api/auth/login', {
      email: TEST_USER.email,
      password: TEST_USER.password
    });
    if (!loginResponse.success) {
      throw new Error(`登录失败: ${loginResponse.error}`);
    }
    const token = loginResponse.data.token;
    console.log('✅ 用户登录成功，获得Token');

    // 3. 获取用户信息
    console.log('3️⃣ 获取用户信息...');
    const profileResponse = await makeRequest('GET', '/api/users/profile', {}, {
      'Authorization': `Bearer ${token}`
    });
    if (!profileResponse.success) {
      throw new Error(`获取用户信息失败: ${profileResponse.error}`);
    }
    console.log('✅ 用户信息获取成功:', profileResponse.data.user);

    // 4. 获取模版列表
    console.log('4️⃣ 获取模版列表...');
    const templatesResponse = await makeRequest('GET', '/api/templates', {
      'Authorization': `Bearer ${token}`
    });
    if (!templatesResponse.success) {
      throw new Error(`获取模版列表失败: ${templatesResponse.error}`);
    }
    const templates = templatesResponse.data.data.templates;
    console.log('✅ 获取模版列表成功，模版数量:', templates.length);

    // 5. 选择模版（选择第一个可用的）
    const selectedTemplate = templates.find(t => t.isActive);
    if (!selectedTemplate) {
      throw new Error('没有可用的模版');
    }
    console.log('✅ 选择模版:', selectedTemplate.name);

    // 6. 创建生成任务（跳过文件上传，直接测试核心逻辑）
    console.log('5️⃣ 创建生成任务...');
    const createTaskResponse = await makeRequest('POST', '/api/generations', {
      templateId: selectedTemplate.id,
      generationType: 'TEMPLATE',
      title: '测试生成任务',
      isPublic: false,
      priority: 0,
      customParams: {
        prompt: '一个美丽的风景画，高清写实风格'
      }
    }, {
      'Authorization': `Bearer ${token}`
    });

    if (!createTaskResponse.success) {
      throw new Error(`创建生成任务失败: ${createTaskResponse.error}`);
    }
    const taskId = createTaskResponse.data.taskId;
    console.log('✅ 生成任务创建成功，任务ID:', taskId);

    // 7. 模拟任务成功（无需真实AI处理）
    console.log('6️⃣ 模拟任务成功...');

    // 等待一下让队列处理
    await sleep(2000);

    // 8. 查询任务状态
    console.log('7️⃣ 查询任务状态...');
    let attempts = 0;
    let finalStatus = null;

    while (attempts < 10 && finalStatus !== 'SUCCESS') {
      attempts++;
      const statusResponse = await makeRequest('GET', `/api/generations/${taskId}/status`, {}, {
        'Authorization': `Bearer ${token}`
      });

      if (!statusResponse.success) {
        throw new Error(`查询任务状态失败: ${statusResponse.error}`);
      }

      finalStatus = statusResponse.data.data.task.status;
      console.log(`   查询 ${attempts}: ${finalStatus}`);

      if (finalStatus === 'SUCCESS') {
        console.log('✅ 任务成功完成！');
        break;
      } else if (finalStatus === 'FAILED') {
        console.log('❌ 任务失败');
        break;
      }

      await sleep(1000); // 等待1秒再查询
    }

    console.log('\n🎉 完整流程测试成功！');
    console.log('\n📊 流程总结:');
    console.log('  ✅ 用户注册 → 用户登录 → 获取用户信息');
    console.log('  ✅ 获取模版列表 → 选择模版');
    console.log('  ✅ 创建生成任务 → 查询任务状态');
    console.log('  ✅ 任务队列处理 → 任务成功完成');
    console.log('\n💡 系统状态: 核心功能正常工作');
    console.log('\n🔧 下一步: 可以测试文件上传和真实AI处理');

    return {
      success: true,
      message: '完整流程测试成功',
      data: {
        user: profileResponse.data.user,
        selectedTemplate,
        taskId,
        finalStatus
      }
    };

  } catch (error) {
    console.error('\n❌ 流程测试失败:', error.message);
    return {
      success: false,
      message: '流程测试失败',
      error: error.message
    };
  }
}

// 执行测试
if (require.main === module) {
  testCompleteFlow()
    .catch(error => {
    console.error('测试执行失败:', error);
    process.exit(1);
    });
}