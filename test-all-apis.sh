#!/bin/bash

# API综合测试脚本
# 测试所有已实现的API接口

BASE_URL="http://localhost:8000"
API_BASE_URL="$BASE_URL/api"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 计数器
TOTAL_TESTS=0
PASSED_TESTS=0

# 测试函数
test_api() {
    local method=$1
    local url=$2
    local description=$3
    local expected_status=$4
    local data=$5
    local token=$6

    TOTAL_TESTS=$((TOTAL_TESTS + 1))

    echo -e "${BLUE}[$TOTAL_TESTS] $method $url - $description${NC}"

    if [ -n "$data" ]; then
        if [ -n "$token" ]; then
            response=$(curl -s -w "%{http_code}" -X $method \
                -H "Content-Type: application/json" \
                -H "Authorization: Bearer $token" \
                -d "$data" \
                "$url")
        else
            response=$(curl -s -w "%{http_code}" -X $method \
                -H "Content-Type: application/json" \
                -d "$data" \
                "$url")
        fi
    else
        if [ -n "$token" ]; then
            response=$(curl -s -w "%{http_code}" -X $method \
                -H "Authorization: Bearer $token" \
                "$url")
        else
            response=$(curl -s -w "%{http_code}" -X $method "$url")
        fi
    fi

    http_code="${response: -3}"
    body="${response%???}"

    if [ "$http_code" -eq "$expected_status" ]; then
        echo -e "${GREEN}✅ 通过 ($http_code)${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "${RED}❌ 失败 (期望: $expected_status, 实际: $http_code)${NC}"
        echo -e "${YELLOW}响应: $body${NC}"
    fi
    echo ""
}

# 启动服务器
echo -e "${YELLOW}🚀 启动服务器...${NC}"
npm run dev > /dev/null 2>&1 &
SERVER_PID=$!

# 等待服务器启动
sleep 8

# 检查服务器是否启动成功
if ! curl -s "$BASE_URL/health" > /dev/null; then
    echo -e "${RED}❌ 服务器启动失败${NC}"
    exit 1
fi

echo -e "${GREEN}✅ 服务器启动成功${NC}"
echo -e "${BLUE}开始API测试...${NC}"
echo ""

# 基础接口测试
test_api "GET" "$BASE_URL/health" "健康检查" 200
test_api "GET" "$API_BASE_URL" "API信息" 200

# 认证接口测试
echo -e "${YELLOW}🔐 认证接口测试${NC}"

# 邮箱注册
test_api "POST" "$API_BASE_URL/auth/register/email" "邮箱注册" 201 \
    '{"email": "testuser@example.com", "password": "Test123456", "nickname": "测试用户API"}'

# 邮箱登录
login_response=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -d '{"email": "testuser@example.com", "password": "Test123456"}' \
    "$API_BASE_URL/auth/login/email")
user_token=$(echo $login_response | jq -r '.token // empty')

if [ -n "$user_token" ]; then
    echo -e "${GREEN}✅ 用户登录成功，获取到Token${NC}"
else
    echo -e "${RED}❌ 用户登录失败${NC}"
fi

# 微信登录
test_api "POST" "$API_BASE_URL/auth/login/wechat" "微信登录" 200 \
    '{"openId": "test_wechat_openid", "nickname": "微信测试用户", "avatarUrl": "https://example.com/avatar.jpg"}'

# 管理员登录
admin_login_response=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -d '{"username": "admin", "password": "admin123"}' \
    "$API_BASE_URL/auth/login/admin")
admin_token=$(echo $admin_login_response | jq -r '.token // empty')

if [ -n "$admin_token" ]; then
    echo -e "${GREEN}✅ 管理员登录成功，获取到Token${NC}"
else
    echo -e "${RED}❌ 管理员登录失败${NC}"
fi

# 获取当前用户信息 (需要用户Token)
if [ -n "$user_token" ]; then
    test_api "GET" "$API_BASE_URL/auth/me" "获取当前用户信息" 200 "" "$user_token"
fi

# 获取当前管理员信息 (需要管理员Token)
if [ -n "$admin_token" ]; then
    test_api "GET" "$API_BASE_URL/auth/admin/me" "获取当前管理员信息" 200 "" "$admin_token"
fi

# 用户接口测试
echo -e "${YELLOW}👤 用户接口测试${NC}"

if [ -n "$user_token" ]; then
    test_api "GET" "$API_BASE_URL/users/profile" "获取用户资料" 200 "" "$user_token"
    test_api "PUT" "$API_BASE_URL/users/profile" "更新用户资料" 200 \
        '{"nickname": "新昵称", "avatarUrl": "https://example.com/new-avatar.jpg"}' "$user_token"
    test_api "PUT" "$API_BASE_URL/users/password" "修改密码" 200 \
        '{"oldPassword": "Test123456", "newPassword": "NewTest123456"}' "$user_token"
    test_api "POST" "$API_BASE_URL/users/change-password" "修改密码(兼容接口)" 200 \
        '{"oldPassword": "NewTest123456", "newPassword": "Test123456"}' "$user_token"
    test_api "GET" "$API_BASE_URL/users/credits" "获取用户积分" 200 "" "$user_token"
    test_api "GET" "$API_BASE_URL/users/credit-logs" "获取积分日志" 200 "" "$user_token"
    test_api "GET" "$API_BASE_URL/users/generation-stats" "获取生成统计" 200 "" "$user_token"

    # 绑定微信
    test_api "POST" "$API_BASE_URL/auth/bind/wechat" "绑定微信账号" 200 \
        '{"openId": "bind_wechat_test", "unionId": "bind_union_test"}' "$user_token"
fi

# 模版接口测试
echo -e "${YELLOW}📋 模版接口测试${NC}"

test_api "GET" "$API_BASE_URL/templates" "获取模版列表" 200
test_api "GET" "$API_BASE_URL/templates/hot?limit=5" "获取热门模版" 200
test_api "GET" "$API_BASE_URL/templates/search?keyword=证件照" "搜索模版" 200
test_api "GET" "$API_BASE_URL/templates/category/id_photo" "按分类获取模版" 200

# 获取第一个模版ID (用于后续测试)
templates_response=$(curl -s "$API_BASE_URL/templates?pageSize=1")
first_template_id=$(echo $templates_response | jq -r '.data[0].id // empty')

if [ -n "$first_template_id" ]; then
    echo -e "${GREEN}✅ 获取到模版ID: $first_template_id${NC}"
    test_api "GET" "$API_BASE_URL/templates/$first_template_id" "获取模版详情" 200

    if [ -n "$user_token" ]; then
        test_api "POST" "$API_BASE_URL/templates/$first_template_id/like" "点赞模版" 200 "" "$user_token"
        test_api "DELETE" "$API_BASE_URL/templates/$first_template_id/like" "取消点赞" 200 "" "$user_token"
    fi

    if [ -n "$admin_token" ]; then
        test_api "PUT" "$API_BASE_URL/templates/$first_template_id" "更新模版(管理员)" 200 \
            '{"name": "更新的模版名称"}' "$admin_token"
    fi
fi

# 图像生成接口测试
echo -e "${YELLOW}🎨 图像生成接口测试${NC}"

if [ -n "$user_token" ] && [ -n "$first_template_id" ]; then
    # 创建生成任务
    create_response=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $user_token" \
        -d "{\"templateId\": \"$first_template_id\", \"generationType\": \"TEMPLATE\", \"title\": \"API测试生成\"}" \
        "$API_BASE_URL/generations")

    create_http_code="${create_response: -3}"
    create_body="${create_response%???}"

    if [ "$create_http_code" -eq 201 ]; then
        echo -e "${GREEN}✅ 生成任务创建成功${NC}"
        task_id=$(echo $create_body | jq -r '.data.taskId // empty')

        if [ -n "$task_id" ]; then
            echo -e "${GREEN}✅ 获取到任务ID: $task_id${NC}"
            test_api "GET" "$API_BASE_URL/generations/$task_id/status" "查询任务状态" 200 "" "$user_token"
        fi
    else
        echo -e "${RED}❌ 生成任务创建失败${NC}"
    fi

    # 获取用户任务列表
    test_api "GET" "$API_BASE_URL/generations?page=1&pageSize=10" "获取用户任务列表" 200 "" "$user_token"
fi

# 停止服务器
echo -e "${YELLOW}🛑 停止服务器...${NC}"
kill $SERVER_PID

# 测试结果统计
echo ""
echo -e "${BLUE}==================== 测试结果 ====================${NC}"
echo -e "总测试数: $TOTAL_TESTS"
echo -e "${GREEN}通过: $PASSED_TESTS${NC}"
echo -e "${RED}失败: $((TOTAL_TESTS - PASSED_TESTS))${NC}"

if [ $PASSED_TESTS -eq $TOTAL_TESTS ]; then
    echo -e "${GREEN}🎉 所有测试通过！${NC}"
    exit 0
else
    echo -e "${RED}❌ 有测试失败，请检查实现${NC}"
    exit 1
fi