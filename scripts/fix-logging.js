#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * 代码质量修复脚本
 * 主要功能：
 * 1. 修复 console.log/console.error 等调用
 * 2. 添加 Logger 导入
 * 3. 替换常见的日志模式
 */

const SRC_DIR = path.join(__dirname, '../src');

// 需要处理的文件模式
const FILE_PATTERNS = [
  '**/*.ts',
  '!**/*.d.ts',
  '!node_modules/**',
  '!dist/**'
];

// 日志替换映射
const LOG_REPLACEMENTS = [
  {
    pattern: /console\.log\(`([^`]+)`\)/g,
    replacement: 'Logger.info(\'$1\')'
  },
  {
    pattern: /console\.log\(`([^`]+)`,\s*([^)]+)\)/g,
    replacement: 'Logger.info(\'$1\', $2)'
  },
  {
    pattern: /console\.error\(`([^`]+)`\)/g,
    replacement: 'Logger.error(\'$1\')'
  },
  {
    pattern: /console\.error\(`([^`]+)`,\s*([^)]+)\)/g,
    replacement: 'Logger.error(\'$1\', $2)'
  },
  {
    pattern: /console\.warn\(`([^`]+)`\)/g,
    replacement: 'Logger.warn(\'$1\')'
  },
  {
    pattern: /console\.warn\(`([^`]+)`,\s*([^)]+)\)/g,
    replacement: 'Logger.warn(\'$1\', $2)'
  },
  {
    pattern: /console\.info\(`([^`]+)`\)/g,
    replacement: 'Logger.info(\'$1\')'
  },
  {
    pattern: /console\.info\(`([^`]+)`,\s*([^)]+)\)/g,
    replacement: 'Logger.info(\'$1\', $2)'
  }
];

// 需要添加Logger导入的文件模式
const LOGGER_IMPORT_PATTERN = /from ['"]\.\.?\/.*\/logger\.util['"]/;

/**
 * 递归获取所有文件
 */
function getAllFiles(dir, pattern = []) {
  const files = [];

  function traverse(currentDir) {
    const items = fs.readdirSync(currentDir);

    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules' && item !== 'dist') {
        traverse(fullPath);
      } else if (stat.isFile() && item.endsWith('.ts') && !item.endsWith('.d.ts')) {
        files.push(fullPath);
      }
    }
  }

  traverse(dir);
  return files;
}

/**
 * 修复单个文件
 */
function fixFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;

    // 检查是否已经有Logger导入
    const hasLoggerImport = LOGGER_IMPORT_PATTERN.test(content);

    // 应用日志替换规则
    let hasChanges = false;
    for (const { pattern, replacement } of LOG_REPLACEMENTS) {
      const newContent = content.replace(pattern, replacement);
      if (newContent !== content) {
        content = newContent;
        hasChanges = true;
      }
    }

    // 如果有日志调用但没有Logger导入，添加导入
    if (hasChanges && !hasLoggerImport) {
      // 查找import语句的位置
      const importRegex = /import[^;]+;/g;
      const imports = content.match(importRegex);

      if (imports && imports.length > 0) {
        const lastImport = imports[imports.length - 1];
        const lastImportEnd = content.lastIndexOf(lastImport) + lastImport.length;

        // 添加Logger导入
        const loggerImport = '\nimport { Logger } from \'../services/utils/logger.util\';';

        // 确定相对路径
        const relativePath = path.relative(path.dirname(filePath), path.join(SRC_DIR, 'services/utils/logger.util'));
        const relativeImport = relativePath.startsWith('.') ? relativePath : './' + relativePath;
        const normalizedImport = relativeImport.replace(/\\/g, '/').replace('.ts', '');

        const finalLoggerImport = `\nimport { Logger } from '${normalizedImport}';`;

        content = content.slice(0, lastImportEnd) + finalLoggerImport + content.slice(lastImportEnd);
      }
    }

    // 写入文件（如果有更改）
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Fixed: ${filePath}`);
      return true;
    }

    return false;

  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
    return false;
  }
}

/**
 * 主函数
 */
function main() {
  console.log('🔧 开始修复代码质量问题...\n');

  const files = getAllFiles(SRC_DIR);
  console.log(`📁 找到 ${files.length} 个 TypeScript 文件\n`);

  let fixedCount = 0;

  for (const file of files) {
    if (fixFile(file)) {
      fixedCount++;
    }
  }

  console.log(`\n✨ 完成！修复了 ${fixedCount} 个文件`);

  if (fixedCount > 0) {
    console.log('\n💡 提示:');
    console.log('1. 运行 `npm run build` 确保没有类型错误');
    console.log('2. 运行 `npm run dev` 测试应用');
    console.log('3. 检查修复后的日志输出是否符合预期');
  }
}

// 运行脚本
if (require.main === module) {
  main();
}

module.exports = { fixFile, getAllFiles };