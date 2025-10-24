#!/bin/bash

# 模版管理 API 测试脚本
# 使用方法: ./test-template-api.sh

API_BASE="http://localhost:3000"
TEST_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWgwZHJrNnIwMDAwbHVmYm5ncDZ0M3A3IiwibG9naW5UeXBlIjoiRU1BSUwiLCJlbWFpbCI6Im5ld3VzZXJAdGVzdC5jb20iLCJpYXQiOjE3NjEwNDAwMzAsImV4cCI6MTc2MTY0NDgzMH0.ERz_qvob7PsIK7WdnwvuiRW4en1MRMF_GLdcijz_BF0"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印函数
print_header() {
    echo -e "\n${BLUE}🧪 $1${NC}"
    echo -e "${BLUE}$(printf '=%.0s' {1..50})${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ️  $1${NC}"
}

# 测试函数
test_api() {
    local method=$1
    local url=$2
    local data=$3
    local headers=$4
    local description=$5

    echo -e "\n${YELLOW}📡 $description${NC}"
    echo -e "${BLUE}Request: $method $url${NC}"

    if [ -n "$data" ]; then
        echo -e "${BLUE}Data: $data${NC}"
    fi

    if [ -n "$headers" ]; then
        curl -s -w "\nHTTP Status: %{http_code}\n" -X $method \
            -H "Content-Type: application/json" \
            $headers \
            -d "$data" \
            "$API_BASE$url"
    else
        curl -s -w "\nHTTP Status: %{http_code}\n" -X $method \
            -H "Content-Type: application/json" \
            "$API_BASE$url"
    fi
}

echo -e "${BLUE}🚀 开始模版管理 API 测试${NC}"
echo -e "${BLUE}服务器地址: $API_BASE${NC}"

# 基础健康检查
print_header "基础健康检查"
test_api "GET" "/health" "" "" "健康检查接口"

# 用户端模版 API 测试
print_header "用户端模版 API 测试"

# 1. 获取模版列表
test_api "GET" "/api/templates?page=1&limit=5&sortBy=newest" "" "" "获取模版列表（分页）"

# 2. 按分类筛选
test_api "GET" "/api/templates?category=id_photo" "" "" "按分类筛选：证件照"

# 3. 搜索模版
test_api "GET" "/api/templates?search=商务" "" "" "搜索模版：商务"

# 4. 按积分筛选
test_api "GET" "/api/templates?minCredits=1&maxCredits=2" "" "" "按积分范围筛选"

# 5. 获取热门模版
test_api "GET" "/api/templates/hot?period=all&limit=5" "" "" "获取热门模版"

# 6. 获取模版分类
test_api "GET" "/api/templates/categories" "" "" "获取模版分类列表"

# 7. 获取标签列表
test_api "GET" "/api/templates/tags" "" "" "获取标签列表"

# 8. 获取模版详情（需要先获取一个模版ID）
print_info "获取模版详情"
TEMPLATE_ID=$(curl -s "$API_BASE/api/templates?limit=1" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
if [ -n "$TEMPLATE_ID" ]; then
    test_api "GET" "/api/templates/$TEMPLATE_ID" "" "" "获取模版详情"
    print_success "找到模版ID: $TEMPLATE_ID"
else
    print_error "未找到模版ID"
fi

# 9. 记录模版使用（需要认证）
if [ -n "$TEMPLATE_ID" ]; then
    test_api "POST" "/api/templates/$TEMPLATE_ID/usage" \
        '{}' \
        "-H \"Authorization: Bearer $TEST_TOKEN\"" \
        "记录模版使用（需要认证）"
fi

# 管理端模版 API 测试
print_header "管理端模版 API 测试"

# 10. 获取所有模版（管理员）
test_api "GET" "/admin/templates?limit=5" "" "-H \"Authorization: Bearer $TEST_TOKEN\"" "获取所有模版列表（管理员）"

# 11. 创建新模版（管理员）
print_info "创建新模版（管理员）"
CREATE_TEMPLATE_DATA='{
    "name": "测试模版-API创建",
    "description": "通过API创建的测试模版",
    "category": "template_artistic",
    "tags": ["测试", "API", "艺术"],
    "aiProvider": "mock",
    "aiParams": {"style": "test", "quality": "high"},
    "prompt": "Test template created via API",
    "creditsRequired": 2,
    "isPremium": false
}'

test_api "POST" "/admin/templates" \
    "$CREATE_TEMPLATE_DATA" \
    "-H \"Authorization: Bearer $TEST_TOKEN\"" \
    "创建新模版（管理员）"

# 获取刚创建的模版ID用于后续测试
NEW_TEMPLATE_ID=$(curl -s -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TEST_TOKEN" \
    -d "$CREATE_TEMPLATE_DATA" "$API_BASE/admin/templates" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -n "$NEW_TEMPLATE_ID" ]; then
    print_success "新模版创建成功，ID: $NEW_TEMPLATE_ID"

    # 12. 更新模版（管理员）
    UPDATE_TEMPLATE_DATA='{
        "name": "测试模版-API更新",
        "description": "更新后的描述",
        "creditsRequired": 3
    }'

    test_api "PUT" "/admin/templates/$NEW_TEMPLATE_ID" \
        "$UPDATE_TEMPLATE_DATA" \
        "-H \"Authorization: Bearer $TEST_TOKEN\"" \
        "更新模版（管理员）"

    # 13. 获取模版统计（管理员）
    test_api "GET" "/admin/templates/$NEW_TEMPLATE_ID/stats" "" \
        "-H \"Authorization: Bearer $TEST_TOKEN\"" \
        "获取模版统计（管理员）"

    # 14. 删除模版（管理员）
    test_api "DELETE" "/admin/templates/$NEW_TEMPLATE_ID" "" \
        "-H \"Authorization: Bearer $TEST_TOKEN\"" \
        "删除模版（管理员）"
else
    print_error "新模版创建失败"
fi

# 高级功能测试
print_header "高级功能测试"

# 15. 复杂查询
test_api "GET" "/api/templates?category=portrait_biz&search=商务&sortBy=usage&sortOrder=desc" "" "" "复杂查询：分类+搜索+排序"

# 16. 排除已使用模版
test_api "GET" "/api/templates?excludeUsed=true&limit=3" "" "" "排除用户已使用的模版"

# 17. 按AI服务商筛选
test_api "GET" "/api/templates?aiProvider=mock" "" "" "按AI服务商筛选"

# 测试错误情况
print_header "错误情况测试"

# 18. 获取不存在的模版
test_api "GET" "/api/templates/nonexistent-id" "" "" "获取不存在的模版（404错误）"

# 19. 未认证的管理员操作
test_api "GET" "/admin/templates" "" "" "未认证的管理员操作（401错误）"

# 20. 无效的创建数据
INVALID_DATA='{"name": ""}'
test_api "POST" "/admin/templates" "$INVALID_DATA" "-H \"Authorization: Bearer $TEST_TOKEN\"" "无效的创建数据（400错误）"

print_header "测试完成"
echo -e "${GREEN}🎉 模版管理 API 测试完成！${NC}"
echo -e "${BLUE}请检查上述输出，确认所有接口正常工作${NC}"
echo -e "${YELLOW}💡 提示：如果服务器未运行，请先执行 npm run dev${NC}"

# 清理提示
echo -e "\n${BLUE}📝 测试账号信息：${NC}"
echo -e "${YELLOW}管理员账号：admin / admin123${NC}"
echo -e "${YELLOW}测试用户：test@example.com / test123${NC}"
echo -e "${YELLOW}测试Token：已在脚本中设置${NC}"