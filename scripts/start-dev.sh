#!/bin/bash

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 从 .env 文件读取端口,如果不存在则使用默认端口 3000
PORT=$(grep -E "^PORT=" .env 2>/dev/null | cut -d '=' -f2 | tr -d ' ')
PORT=${PORT:-3000}

echo -e "${GREEN}🚀 准备启动开发服务器...${NC}"
echo -e "${GREEN}📡 目标端口: ${PORT}${NC}"

# 检查端口是否被占用
if lsof -Pi :${PORT} -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo -e "${YELLOW}⚠️  检测到端口 ${PORT} 已被占用${NC}"

    # 获取占用端口的进程ID
    PID=$(lsof -ti:${PORT})

    if [ ! -z "$PID" ]; then
        echo -e "${YELLOW}🔍 发现进程 PID: ${PID}${NC}"

        # 显示进程信息
        echo -e "${YELLOW}📋 进程信息:${NC}"
        ps -p ${PID} -o pid,comm,args 2>/dev/null

        # 终止进程
        echo -e "${RED}🔫 正在终止占用端口的进程...${NC}"
        kill -9 ${PID} 2>/dev/null

        # 等待进程完全终止
        sleep 1

        # 验证进程是否已终止
        if lsof -Pi :${PORT} -sTCP:LISTEN -t >/dev/null 2>&1 ; then
            echo -e "${RED}❌ 无法终止进程,请手动检查${NC}"
            exit 1
        else
            echo -e "${GREEN}✅ 成功释放端口 ${PORT}${NC}"
        fi
    fi
else
    echo -e "${GREEN}✅ 端口 ${PORT} 未被占用${NC}"
fi

# 启动开发服务器
echo -e "${GREEN}🚀 启动 NestJS 开发服务器...${NC}"
echo ""
nest start --watch
