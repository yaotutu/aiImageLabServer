/**
 * 测试 Base64 图片上传接口
 */

// JWT Token (testuser@example.com)
const TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWg0em0zNHEwMDAwOTZhcDV3OXJ6YWh1IiwiZW1haWwiOiJ0ZXN0dXNlckBleGFtcGxlLmNvbSIsImxvZ2luVHlwZSI6IkVNQUlMIiwiaWF0IjoxNzYxMzE4NTkxLCJleHAiOjE3NjE5MjMzOTF9.bP_ZZd9lB0G25Prbb4yMTaQ7zV6wDlJPi6cXIB2AtjQ";

// 一个简单的 1x1 像素的红色 PNG 图片的 base64 编码
const TEST_IMAGE_BASE64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==";

// 有效的模版ID（从代码中看到的示例）
const TEMPLATE_ID = "cmh4v5z7y00jx2dmofp3x2ars";

async function testBase64Upload() {
  console.log("🧪 开始测试 Base64 图片上传接口...\n");

  try {
    // 测试用例 1: 使用 data URI 格式
    console.log("📝 测试用例 1: 使用 data URI 格式的 base64 图片");
    const response1 = await fetch("http://localhost:8000/api/generations/base64", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${TOKEN}`
      },
      body: JSON.stringify({
        templateId: TEMPLATE_ID,
        imageBase64: TEST_IMAGE_BASE64,
        generationType: "TEMPLATE",
        title: "Base64 测试图片"
      })
    });

    const result1 = await response1.json();
    console.log("📊 响应状态:", response1.status);
    console.log("📊 响应内容:", JSON.stringify(result1, null, 2));

    if (response1.ok) {
      console.log("✅ 测试用例 1 通过！");
      console.log("🆔 任务 ID:", result1.data?.id || result1.id);
    } else {
      console.log("❌ 测试用例 1 失败！");
    }

    console.log("\n" + "=".repeat(60) + "\n");

    // 测试用例 2: 使用纯 base64 字符串（无 data URI 前缀）
    console.log("📝 测试用例 2: 使用纯 base64 字符串");
    const pureBase64 = TEST_IMAGE_BASE64.split(",")[1]; // 移除 data URI 前缀

    const response2 = await fetch("http://localhost:8000/api/generations/base64", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${TOKEN}`
      },
      body: JSON.stringify({
        templateId: TEMPLATE_ID,
        imageBase64: pureBase64,
        title: "纯 Base64 测试"
      })
    });

    const result2 = await response2.json();
    console.log("📊 响应状态:", response2.status);
    console.log("📊 响应内容:", JSON.stringify(result2, null, 2));

    if (response2.ok) {
      console.log("✅ 测试用例 2 通过！");
      console.log("🆔 任务 ID:", result2.data?.id || result2.id);
    } else {
      console.log("❌ 测试用例 2 失败！");
    }

    console.log("\n" + "=".repeat(60) + "\n");

    // 测试用例 3: 测试错误情况 - 无效的 base64
    console.log("📝 测试用例 3: 测试无效的 base64 数据");
    const response3 = await fetch("http://localhost:8000/api/generations/base64", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${TOKEN}`
      },
      body: JSON.stringify({
        templateId: TEMPLATE_ID,
        imageBase64: "invalid-base64-data",
        title: "无效数据测试"
      })
    });

    const result3 = await response3.json();
    console.log("📊 响应状态:", response3.status);
    console.log("📊 响应内容:", JSON.stringify(result3, null, 2));

    if (!response3.ok && response3.status === 400) {
      console.log("✅ 测试用例 3 通过！（正确返回了错误）");
    } else {
      console.log("❌ 测试用例 3 失败！（应该返回 400 错误）");
    }

    console.log("\n" + "=".repeat(60) + "\n");
    console.log("🎉 所有测试完成！");

  } catch (error) {
    console.error("❌ 测试过程中发生错误:", error);
  }
}

// 运行测试
testBase64Upload();
