#!/bin/bash

# AI 图像生成平台 API 测试脚本
# 测试统一响应格式、错误处理和日志输出

BASE_URL="http://localhost:8000"
API_URL="${BASE_URL}/api"

echo "========================================"
echo "AI 图像生成平台 API 完整测试"
echo "========================================"
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 测试计数
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# 测试函数
test_api() {
    local test_name=$1
    local method=$2
    local endpoint=$3
    local data=$4
    local expected_success=$5
    local token=$6

    TOTAL_TESTS=$((TOTAL_TESTS + 1))

    echo "测试 #${TOTAL_TESTS}: ${test_name}"

    if [ -n "$token" ]; then
        if [ -n "$data" ]; then
            response=$(curl -s -X ${method} "${API_URL}${endpoint}" \
                -H "Content-Type: application/json" \
                -H "Authorization: Bearer ${token}" \
                -d "${data}")
        else
            response=$(curl -s -X ${method} "${API_URL}${endpoint}" \
                -H "Authorization: Bearer ${token}")
        fi
    else
        if [ -n "$data" ]; then
            response=$(curl -s -X ${method} "${API_URL}${endpoint}" \
                -H "Content-Type: application/json" \
                -d "${data}")
        else
            response=$(curl -s -X ${method} "${API_URL}${endpoint}")
        fi
    fi

    # 检查响应是否包含必要字段
    has_success=$(echo "$response" | grep -o '"success"' | head -1)
    has_code=$(echo "$response" | grep -o '"code"' | head -1)
    has_message=$(echo "$response" | grep -o '"message"' | head -1)
    has_timestamp=$(echo "$response" | grep -o '"timestamp"' | head -1)

    success_value=$(echo "$response" | grep -o '"success":[^,}]*' | cut -d':' -f2 | tr -d ' ')

    if [ -n "$has_success" ] && [ -n "$has_code" ] && [ -n "$has_message" ] && [ -n "$has_timestamp" ]; then
        if [ "$success_value" = "$expected_success" ]; then
            echo -e "${GREEN}✓ 通过${NC} - 响应格式正确，success=${success_value}"
            PASSED_TESTS=$((PASSED_TESTS + 1))
        else
            echo -e "${RED}✗ 失败${NC} - success值不符合预期 (期望: ${expected_success}, 实际: ${success_value})"
            FAILED_TESTS=$((FAILED_TESTS + 1))
        fi
    else
        echo -e "${RED}✗ 失败${NC} - 响应格式不完整"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi

    echo "响应: $(echo "$response" | head -c 150)..."
    echo ""
}

# 等待服务器启动
echo "等待服务器启动..."
sleep 2

# 1. 测试根路由
echo "========== 测试根路由 =========="
test_api "获取 API 信息" "GET" "" "" "true" ""

# 2. 测试认证模块
echo "========== 测试认证模块 =========="

# 注册新用户
EMAIL="testuser$(date +%s)@test.com"
test_api "用户注册" "POST" "/auth/register/email" \
    "{\"email\":\"${EMAIL}\",\"password\":\"Test123456\",\"nickname\":\"测试用户\"}" \
    "true" ""

# 保存 token
TOKEN=$(curl -s -X POST "${API_URL}/auth/login/email" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"${EMAIL}\",\"password\":\"Test123456\"}" | \
    grep -o '"token":"[^"]*"' | cut -d'"' -f4)

test_api "用户登录" "POST" "/auth/login/email" \
    "{\"email\":\"${EMAIL}\",\"password\":\"Test123456\"}" \
    "true" ""

test_api "获取当前用户信息" "GET" "/auth/me" "" "true" "${TOKEN}"

test_api "错误的密码登录（测试错误处理）" "POST" "/auth/login/email" \
    "{\"email\":\"${EMAIL}\",\"password\":\"WrongPassword\"}" \
    "false" ""

test_api "重复注册（测试错误处理）" "POST" "/auth/register/email" \
    "{\"email\":\"${EMAIL}\",\"password\":\"Test123456\"}" \
    "false" ""

# 3. 测试用户模块
echo "========== 测试用户模块 =========="

test_api "查询用户积分" "GET" "/users/credits" "" "true" "${TOKEN}"

test_api "查询积分日志" "GET" "/users/credit-logs?page=1&pageSize=10" "" "true" "${TOKEN}"

test_api "查询生成统计" "GET" "/users/generation-stats" "" "true" "${TOKEN}"

# 4. 测试模板模块
echo "========== 测试模板模块 =========="

test_api "获取模板列表" "GET" "/templates?page=1&pageSize=10" "" "true" ""

test_api "获取热门模板" "GET" "/templates/hot?limit=5" "" "true" ""

test_api "搜索模板" "GET" "/templates/search?keyword=test" "" "true" ""

test_api "获取不存在的模板（测试错误处理）" "GET" "/templates/nonexistent-id" "" "false" ""

# 5. 测试生成模块
echo "========== 测试生成模块 =========="

test_api "获取用户任务列表" "GET" "/generations" "" "true" "${TOKEN}"

test_api "获取不存在的任务状态（测试错误处理）" "GET" "/generations/nonexistent-id/status" "" "false" "${TOKEN}"

# 6. 测试参数验证
echo "========== 测试参数验证 =========="

test_api "缺少必需字段（测试验证）" "POST" "/auth/register/email" \
    "{\"email\":\"\"}" \
    "false" ""

test_api "无效的邮箱格式（测试验证）" "POST" "/auth/register/email" \
    "{\"email\":\"invalid-email\",\"password\":\"Test123\"}" \
    "false" ""

# 7. 测试未授权访问
echo "========== 测试授权保护 =========="

test_api "未授权访问受保护路由" "GET" "/users/credits" "" "false" ""

test_api "无效的 Token" "GET" "/auth/me" "" "false" "invalid-token-12345"

# 测试总结
echo "========================================"
echo "测试总结"
echo "========================================"
echo -e "总测试数: ${TOTAL_TESTS}"
echo -e "${GREEN}通过: ${PASSED_TESTS}${NC}"
echo -e "${RED}失败: ${FAILED_TESTS}${NC}"

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "\n${GREEN}🎉 所有测试通过！${NC}"
    exit 0
else
    echo -e "\n${RED}❌ 部分测试失败${NC}"
    exit 1
fi
