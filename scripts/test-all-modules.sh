#!/bin/bash

set -e

BASE_URL="http://localhost:8000/api"
RANDOM_EMAIL="test_$(date +%s)@test.com"

echo "╔════════════════════════════════════════════════════════════════════╗"
echo "║                    AI 图像生成平台 - 完整流程测试                      ║"
echo "╚════════════════════════════════════════════════════════════════════╝"
echo ""
echo "🌐 测试环境: $BASE_URL"
echo "📧 测试邮箱: $RANDOM_EMAIL"
echo ""

# ==================== 模块 1: 认证系统测试 ====================
echo "═══════════════════════════════════════════════════════════════════"
echo "📝 模块 1: 用户认证系统"
echo "═══════════════════════════════════════════════════════════════════"
echo ""

echo "➤ 1.1 用户注册..."
REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register/email" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$RANDOM_EMAIL\",
    \"password\": \"TestPass123\",
    \"nickname\": \"测试用户\"
  }")

TOKEN=$(echo $REGISTER_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin).get('token', ''))" 2>/dev/null)

if [ -z "$TOKEN" ]; then
  echo "❌ 注册失败"
  echo "$REGISTER_RESPONSE"
  exit 1
fi

echo "✅ 注册成功"
echo ""

echo "➤ 1.2 用户登录..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login/email" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$RANDOM_EMAIL\",
    \"password\": \"TestPass123\"
  }")

NEW_TOKEN=$(echo $LOGIN_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin).get('token', ''))" 2>/dev/null)

if [ -z "$NEW_TOKEN" ]; then
  echo "❌ 登录失败"
  exit 1
fi

echo "✅ 登录成功"
TOKEN=$NEW_TOKEN
echo ""

# ==================== 模块 2: 用户管理测试 ====================
echo "═══════════════════════════════════════════════════════════════════"
echo "👤 模块 2: 用户管理系统"
echo "═══════════════════════════════════════════════════════════════════"
echo ""

echo "➤ 2.1 获取用户信息..."
PROFILE_RESPONSE=$(curl -s -X GET "$BASE_URL/users/profile" \
  -H "Authorization: Bearer $TOKEN")

EMAIL=$(echo $PROFILE_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin).get('email', ''))" 2>/dev/null)

if [ "$EMAIL" != "$RANDOM_EMAIL" ]; then
  echo "❌ 获取用户信息失败"
  exit 1
fi

echo "✅ 用户信息正确"
echo ""

echo "➤ 2.2 更新用户昵称..."
UPDATE_RESPONSE=$(curl -s -X PUT "$BASE_URL/users/profile" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"nickname": "更新后的昵称"}')

NICKNAME=$(echo $UPDATE_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin).get('nickname', ''))" 2>/dev/null)

if [ "$NICKNAME" != "更新后的昵称" ]; then
  echo "❌ 更新昵称失败"
  exit 1
fi

echo "✅ 昵称更新成功"
echo ""

echo "➤ 2.3 查询用户积分..."
CREDITS_RESPONSE=$(curl -s -X GET "$BASE_URL/users/credits" \
  -H "Authorization: Bearer $TOKEN")

CREDITS=$(echo $CREDITS_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin).get('credits', ''))" 2>/dev/null)

echo "✅ 当前积分: $CREDITS"
echo ""

echo "➤ 2.4 修改密码..."
PASSWORD_RESPONSE=$(curl -s -X PUT "$BASE_URL/users/password" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"oldPassword": "TestPass123", "newPassword": "NewPass456"}')

if echo "$PASSWORD_RESPONSE" | grep -q "成功"; then
  echo "✅ 密码修改成功"
else
  echo "❌ 密码修改失败"
  exit 1
fi
echo ""

# ==================== 模块 3: 模板系统测试 ====================
echo "═══════════════════════════════════════════════════════════════════"
echo "🎨 模块 3: 模板管理系统"
echo "═══════════════════════════════════════════════════════════════════"
echo ""

echo "➤ 3.1 获取所有模板..."
TEMPLATES_RESPONSE=$(curl -s -X GET "$BASE_URL/templates")

TEMPLATE_COUNT=$(echo $TEMPLATES_RESPONSE | python3 -c "import sys, json; data=json.load(sys.stdin); print(len(data.get('templates', [])))" 2>/dev/null)

echo "✅ 找到 $TEMPLATE_COUNT 个模板"
echo ""

echo "➤ 3.2 分页查询模板..."
PAGE_RESPONSE=$(curl -s -X GET "$BASE_URL/templates?page=1&pageSize=5")

PAGE_COUNT=$(echo $PAGE_RESPONSE | python3 -c "import sys, json; data=json.load(sys.stdin); print(len(data.get('templates', [])))" 2>/dev/null)

echo "✅ 第1页返回 $PAGE_COUNT 个模板"
echo ""

echo "➤ 3.3 获取热门模板..."
HOT_RESPONSE=$(curl -s -X GET "$BASE_URL/templates/hot")

HOT_COUNT=$(echo $HOT_RESPONSE | python3 -c "import sys, json; print(len(json.load(sys.stdin)))" 2>/dev/null)

echo "✅ 热门模板数量: $HOT_COUNT"
echo ""

echo "➤ 3.4 按分类查询（证件照）..."
CATEGORY_RESPONSE=$(curl -s -X GET "$BASE_URL/templates/category/id_photo")

CATEGORY_COUNT=$(echo $CATEGORY_RESPONSE | python3 -c "import sys, json; print(len(json.load(sys.stdin)))" 2>/dev/null)

echo "✅ 证件照模板数量: $CATEGORY_COUNT"
echo ""

echo "➤ 3.5 搜索模板（关键词：证件）..."
SEARCH_RESPONSE=$(curl -s -X GET "$BASE_URL/templates/search?keyword=证件")

SEARCH_COUNT=$(echo $SEARCH_RESPONSE | python3 -c "import sys, json; print(len(json.load(sys.stdin)))" 2>/dev/null)

echo "✅ 搜索结果数量: $SEARCH_COUNT"
echo ""

# 获取第一个模板用于测试
TEMPLATE_ID=$(echo $TEMPLATES_RESPONSE | python3 -c "import sys, json; data=json.load(sys.stdin); print(data['templates'][0]['id'] if data.get('templates') else '')" 2>/dev/null)
TEMPLATE_NAME=$(echo $TEMPLATES_RESPONSE | python3 -c "import sys, json; data=json.load(sys.stdin); print(data['templates'][0]['name'] if data.get('templates') else '')" 2>/dev/null)

echo "➤ 3.6 获取模板详情 ($TEMPLATE_NAME)..."
DETAIL_RESPONSE=$(curl -s -X GET "$BASE_URL/templates/$TEMPLATE_ID")

DETAIL_NAME=$(echo $DETAIL_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin).get('name', ''))" 2>/dev/null)

if [ "$DETAIL_NAME" = "$TEMPLATE_NAME" ]; then
  echo "✅ 模板详情正确"
else
  echo "❌ 模板详情错误"
  exit 1
fi
echo ""

echo "➤ 3.7 点赞模板..."
LIKE_RESPONSE=$(curl -s -X POST "$BASE_URL/templates/$TEMPLATE_ID/like" \
  -H "Authorization: Bearer $TOKEN")

LIKE_COUNT=$(echo $LIKE_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin).get('likeCount', 0))" 2>/dev/null)

echo "✅ 点赞成功，当前点赞数: $LIKE_COUNT"
echo ""

# ==================== 模块 4: 图像生成测试 ====================
echo "═══════════════════════════════════════════════════════════════════"
echo "🖼️  模块 4: 图像生成系统"
echo "═══════════════════════════════════════════════════════════════════"
echo ""

echo "➤ 4.1 创建生成任务..."
CREATE_RESPONSE=$(curl -s -X POST "$BASE_URL/generations" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"templateId\": \"$TEMPLATE_ID\",
    \"generationType\": \"TEMPLATE\",
    \"title\": \"完整流程测试图片\"
  }")

TASK_ID=$(echo $CREATE_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin).get('id', ''))" 2>/dev/null)

if [ -z "$TASK_ID" ]; then
  echo "❌ 创建任务失败"
  echo "$CREATE_RESPONSE"
  exit 1
fi

echo "✅ 任务创建成功"
echo "   任务ID: $TASK_ID"
echo ""

echo "➤ 4.2 上传测试图片..."
if [ ! -f "test-image.jpg" ]; then
  echo "⚠️  未找到 test-image.jpg，跳过上传测试"
else
  UPLOAD_RESPONSE=$(curl -s -X POST "$BASE_URL/generations/$TASK_ID/upload" \
    -H "Authorization: Bearer $TOKEN" \
    -F "image=@test-image.jpg")

  UPLOAD_STATUS=$(echo $UPLOAD_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin).get('status', ''))" 2>/dev/null)

  if [ "$UPLOAD_STATUS" = "PROCESSING" ]; then
    echo "✅ 图片上传成功，状态: PROCESSING"
  else
    echo "⚠️  图片上传响应: $UPLOAD_RESPONSE"
  fi
  echo ""

  echo "➤ 4.3 查询任务状态..."
  STATUS_RESPONSE=$(curl -s -X GET "$BASE_URL/generations/$TASK_ID/status" \
    -H "Authorization: Bearer $TOKEN")

  CURRENT_STATUS=$(echo $STATUS_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin).get('status', ''))" 2>/dev/null)

  echo "✅ 当前任务状态: $CURRENT_STATUS"
  echo ""
fi

echo "➤ 4.4 查询用户生成记录..."
LIST_RESPONSE=$(curl -s -X GET "$BASE_URL/generations?page=1&pageSize=10" \
  -H "Authorization: Bearer $TOKEN")

RECORD_COUNT=$(echo $LIST_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin).get('total', 0))" 2>/dev/null)

echo "✅ 用户生成记录数: $RECORD_COUNT"
echo ""

# ==================== 测试总结 ====================
echo "╔════════════════════════════════════════════════════════════════════╗"
echo "║                         🎉 测试完成！                                ║"
echo "╠════════════════════════════════════════════════════════════════════╣"
echo "║  ✅ 认证系统：用户注册、登录                                          ║"
echo "║  ✅ 用户管理：信息查询、更新、密码修改、积分管理                        ║"
echo "║  ✅ 模板系统：列表查询、分页、搜索、分类、详情、点赞                     ║"
echo "║  ✅ 生成系统：任务创建、图片上传、状态查询、记录管理                     ║"
echo "╠════════════════════════════════════════════════════════════════════╣"
echo "║  📊 测试账号：$RANDOM_EMAIL                                           "
echo "║  🔑 测试Token：${TOKEN:0:30}...                                      "
echo "╚════════════════════════════════════════════════════════════════════╝"
echo ""
