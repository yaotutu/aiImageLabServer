#!/bin/bash

set -e

BASE_URL="http://localhost:8000/api"

echo "🔐 使用测试用户登录..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login/email" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123"
  }')

TOKEN=$(echo $LOGIN_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin).get('token', ''))" 2>/dev/null)

if [ -z "$TOKEN" ]; then
  echo "❌ 登录失败！"
  echo "响应: $LOGIN_RESPONSE"
  exit 1
fi

echo "✅ 登录成功！"
echo "   Token: ${TOKEN:0:50}..."
echo ""

echo "👤 查看用户积分..."
USER_INFO=$(curl -s -X GET "$BASE_URL/users/credits" \
  -H "Authorization: Bearer $TOKEN")
echo "   用户信息: $USER_INFO"
echo ""

echo "📚 获取可用模板..."
TEMPLATES=$(curl -s -X GET "$BASE_URL/templates" \
  -H "Authorization: Bearer $TOKEN")

TEMPLATE_ID=$(echo $TEMPLATES | python3 -c "import sys, json; data=json.load(sys.stdin); print(data['templates'][0]['id'] if data.get('templates') else '')" 2>/dev/null)
TEMPLATE_NAME=$(echo $TEMPLATES | python3 -c "import sys, json; data=json.load(sys.stdin); print(data['templates'][0]['name'] if data.get('templates') else '')" 2>/dev/null)
TEMPLATE_CREDITS=$(echo $TEMPLATES | python3 -c "import sys, json; data=json.load(sys.stdin); print(data['templates'][0]['creditsRequired'] if data.get('templates') else '')" 2>/dev/null)

echo "✅ 选中模板："
echo "   ID: $TEMPLATE_ID"
echo "   名称: $TEMPLATE_NAME"
echo "   需要积分: $TEMPLATE_CREDITS"
echo ""

echo "🎯 创建图像生成任务..."
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

echo "✅ 任务创建成功！任务ID: $TASK_ID"
echo ""

echo "⬆️  上传图片，触发 AI 生成..."
UPLOAD_RESPONSE=$(curl -s -X POST "$BASE_URL/generations/$TASK_ID/upload" \
  -H "Authorization: Bearer $TOKEN" \
  -F "image=@test-image.jpg")

echo "✅ 图片上传成功！"
echo "   响应: $UPLOAD_RESPONSE"
echo ""

echo "🔍 开始查询生成状态（最多等待60秒）..."
echo ""

for i in {1..20}; do
  STATUS_RESPONSE=$(curl -s -X GET "$BASE_URL/generations/$TASK_ID/status" \
    -H "Authorization: Bearer $TOKEN")

  STATUS=$(echo $STATUS_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin).get('status', ''))" 2>/dev/null)

  echo -n "   [尝试 $i/20] 状态: $STATUS"

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
    echo "$STATUS_RESPONSE" | python3 -m json.tool 2>/dev/null

    exit 0

  elif [ "$STATUS" = "FAILED" ]; then
    echo " ❌"
    echo ""
    ERROR_MSG=$(echo $STATUS_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin).get('errorMessage', ''))" 2>/dev/null)
    echo "❌ 图像生成失败！"
    echo "   错误信息: $ERROR_MSG"
    echo ""
    echo "完整响应:"
    echo "$STATUS_RESPONSE" | python3 -m json.tool 2>/dev/null
    exit 1

  else
    echo " ⏳"
    sleep 3
  fi
done

echo ""
echo "⚠️  超时：任务仍未完成"
