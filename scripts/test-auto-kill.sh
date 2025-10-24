#!/bin/bash

# 测试自动清理端口的功能

echo "========================================="
echo "测试自动清理端口占用功能"
echo "========================================="
echo ""

# 从 .env 读取端口
PORT=$(grep -E "^PORT=" .env 2>/dev/null | cut -d '=' -f2 | tr -d ' ')
PORT=${PORT:-3000}

echo "步骤 1: 启动一个测试进程占用端口 ${PORT}"
node -e "require('http').createServer((req,res)=>res.end('占位进程')).listen(${PORT}, ()=>console.log('占位进程已启动,占用端口 ${PORT}'))" &
TEST_PID=$!
sleep 2

echo ""
echo "步骤 2: 检查端口占用情况"
lsof -i:${PORT} | grep LISTEN

echo ""
echo "步骤 3: 运行 npm run dev (应该自动清理并重启)"
echo "========================================="
echo ""

# 运行 dev 命令
npm run dev
