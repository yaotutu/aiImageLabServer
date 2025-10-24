#!/bin/bash

# 图像生成完整流程测试脚本
# 测试：注册 → 登录 → 查看模板 → 创建任务 → 上传图片 → 查询结果

set -e  # 遇到错误立即退出

BASE_URL="http://localhost:8000/api"
RANDOM_EMAIL="test_$(date +%s)@test.com"

echo "╔════════════════════════════════════════════════════════════════════╗"
echo "║              AI 图像生成完整流程测试                                 ║"
echo "╚════════════════════════════════════════════════════════════════════╝"
echo ""

# ==================== 步骤 1: 用户注册 ====================
echo "📝 步骤 1: 注册新用户..."
REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register/email" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$RANDOM_EMAIL\",
    \"password\": \"TestPass123\",
    \"nickname\": \"测试用户\"
  }")

TOKEN=$(echo $REGISTER_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin).get('token', ''))" 2>/dev/null)

if [ -z "$TOKEN" ]; then
  echo "❌ 注册失败！"
  echo "响应: $REGISTER_RESPONSE"
  exit 1
fi

echo "✅ 注册成功！"
echo "   邮箱: $RANDOM_EMAIL"
echo "   Token: ${TOKEN:0:50}..."
echo ""

# ==================== 步骤 2: 查看可用模板 ====================
echo "📚 步骤 2: 查看可用模板..."
TEMPLATES=$(curl -s -X GET "$BASE_URL/templates" \
  -H "Authorization: Bearer $TOKEN")

TEMPLATE_ID=$(echo $TEMPLATES | python3 -c "import sys, json; data=json.load(sys.stdin); print(data['templates'][0]['id'] if data.get('templates') else '')" 2>/dev/null)

if [ -z "$TEMPLATE_ID" ]; then
  echo "❌ 没有可用的模板！请先运行种子数据: npm run prisma:seed"
  exit 1
fi

TEMPLATE_NAME=$(echo $TEMPLATES | python3 -c "import sys, json; data=json.load(sys.stdin); print(data['templates'][0]['name'] if data.get('templates') else '')" 2>/dev/null)

echo "✅ 找到可用模板！"
echo "   模板ID: $TEMPLATE_ID"
echo "   模板名称: $TEMPLATE_NAME"
echo ""

# ==================== 步骤 3: 创建生成任务 ====================
echo "🎯 步骤 3: 创建图像生成任务..."
TASK_RESPONSE=$(curl -s -X POST "$BASE_URL/generations" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"templateId\": \"$TEMPLATE_ID\",
    \"generationType\": \"TEMPLATE\",
    \"title\": \"测试生成图片\"
  }")

TASK_ID=$(echo $TASK_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin).get('id', ''))" 2>/dev/null)

if [ -z "$TASK_ID" ]; then
  echo "❌ 创建任务失败！"
  echo "响应: $TASK_RESPONSE"
  exit 1
fi

echo "✅ 任务创建成功！"
echo "   任务ID: $TASK_ID"
echo ""

# ==================== 步骤 4: 准备测试图片 ====================
echo "🖼️  步骤 4: 准备测试图片..."

# 检查是否有测试图片
if [ ! -f "test-image.jpg" ]; then
  echo "   未找到 test-image.jpg，创建一个简单的测试图片..."

  # 使用 ImageMagick 或 其他工具创建测试图片
  if command -v convert &> /dev/null; then
    convert -size 512x512 xc:blue -pointsize 40 -fill white -gravity center \
      -annotate +0+0 "Test Image" test-image.jpg 2>/dev/null || \
      echo "   ⚠️  无法自动创建图片，请手动准备一张名为 test-image.jpg 的图片"
  else
    echo "   ⚠️  请手动准备一张测试图片，命名为 test-image.jpg"
    echo ""
    echo "   你可以使用任何图片，比如："
    echo "   - 下载一张图片并重命名为 test-image.jpg"
    echo "   - 或使用以下命令下载测试图片："
    echo "     curl -o test-image.jpg https://picsum.photos/512/512"
    echo ""
    read -p "   按回车键继续（确保 test-image.jpg 存在）..."
  fi
fi

if [ ! -f "test-image.jpg" ]; then
  echo "❌ 找不到 test-image.jpg，请准备测试图片后重试"
  exit 1
fi

echo "✅ 测试图片准备完成！"
echo ""

# ==================== 步骤 5: 上传图片并开始生成 ====================
echo "⬆️  步骤 5: 上传图片，触发 AI 生成..."
UPLOAD_RESPONSE=$(curl -s -X POST "$BASE_URL/generations/$TASK_ID/upload" \
  -H "Authorization: Bearer $TOKEN" \
  -F "image=@test-image.jpg")

echo "✅ 图片上传成功，AI 生成已启动！"
echo "   响应: $UPLOAD_RESPONSE"
echo ""

# ==================== 步骤 6: 查询生成状态 ====================
echo "🔍 步骤 6: 查询生成状态..."
echo "   (AI 生成需要一些时间，持续查询中...)"
echo ""

MAX_ATTEMPTS=30
ATTEMPT=0

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
  ATTEMPT=$((ATTEMPT + 1))

  STATUS_RESPONSE=$(curl -s -X GET "$BASE_URL/generations/$TASK_ID/status" \
    -H "Authorization: Bearer $TOKEN")

  STATUS=$(echo $STATUS_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin).get('status', ''))" 2>/dev/null)

  echo -n "   [尝试 $ATTEMPT/$MAX_ATTEMPTS] 状态: $STATUS"

  if [ "$STATUS" = "SUCCESS" ]; then
    echo " ✅"
    echo ""
    echo "╔════════════════════════════════════════════════════════════════════╗"
    echo "║                     🎉 图像生成成功！                                ║"
    echo "╚════════════════════════════════════════════════════════════════════╝"
    echo ""

    RESULT_IMAGE=$(echo $STATUS_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin).get('resultImageUrl', ''))" 2>/dev/null)
    REQUEST_ID=$(echo $STATUS_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin).get('aiRequestId', ''))" 2>/dev/null)

    echo "📊 生成结果："
    echo "   任务ID: $TASK_ID"
    echo "   AI请求ID: $REQUEST_ID"
    echo "   生成图片URL: $RESULT_IMAGE"
    echo ""
    echo "完整响应:"
    echo "$STATUS_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$STATUS_RESPONSE"
    echo ""

    # 尝试下载生成的图片
    if [ ! -z "$RESULT_IMAGE" ]; then
      echo "📥 下载生成的图片..."
      curl -s -o "generated-result-$TASK_ID.jpg" "$RESULT_IMAGE"
      if [ -f "generated-result-$TASK_ID.jpg" ]; then
        echo "✅ 图片已保存到: generated-result-$TASK_ID.jpg"
      fi
    fi

    exit 0

  elif [ "$STATUS" = "FAILED" ]; then
    echo " ❌"
    echo ""
    ERROR_MSG=$(echo $STATUS_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin).get('errorMessage', ''))" 2>/dev/null)
    echo "❌ 图像生成失败！"
    echo "   错误信息: $ERROR_MSG"
    echo ""
    echo "完整响应:"
    echo "$STATUS_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$STATUS_RESPONSE"
    exit 1

  elif [ "$STATUS" = "PROCESSING" ]; then
    echo " ⏳ (处理中...)"
    sleep 3

  else
    echo " ⏳ (等待中...)"
    sleep 2
  fi
done

echo ""
echo "⚠️  超时：在 ${MAX_ATTEMPTS} 次尝试后仍未完成"
echo "   任务ID: $TASK_ID"
echo "   你可以稍后手动查询: curl -H 'Authorization: Bearer $TOKEN' $BASE_URL/generations/$TASK_ID/status"
