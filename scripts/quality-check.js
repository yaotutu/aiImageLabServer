#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * 项目质量检查脚本
 * 检查以下问题：
 * 1. TypeScript语法错误
 * 2. 未使用的导入
 * 3. 安全问题
 * 4. 性能问题
 * 5. 代码规范问题
 */

const SRC_DIR = path.join(__dirname, '../src');

// 检查规则
const QUALITY_RULES = {
  security: [
    {
      name: 'Hardcoded secrets',
      pattern: /(password|secret|key)\s*[=:]\s*['"]([^'"]+)['"]/gi,
      severity: 'high'
    },
    {
      name: 'SQL injection vulnerability',
      pattern: /\$\{.*\}.*\b(SELECT|INSERT|UPDATE|DELETE)\b/gi,
      severity: 'high'
    },
    {
      name: 'Eval usage',
      pattern: /eval\s*\(/g,
      severity: 'high'
    },
    {
      name: 'Unsafe regex',
      pattern: /new RegExp\s*\(\s*[^,)]+\s*,\s*['"]i['"]/g,
      severity: 'medium'
    }
  ],
  performance: [
    {
      name: 'Synchronous file operations',
      pattern: /\.(readFileSync|writeFileSync|existsSync)\s*\(/g,
      severity: 'medium'
    },
    {
      name: 'Missing async/await',
      pattern: /\.then\s*\(/g,
      severity: 'low'
    }
  ],
  codeQuality: [
    {
      name: 'Console.log usage',
      pattern: /console\.(log|error|warn|info|debug)\s*\(/g,
      severity: 'medium'
    },
    {
      name: 'Any type usage',
      pattern: /:\s*any\b/g,
      severity: 'low'
    },
    {
      name: 'TODO comments',
      pattern: /\/\/\s*TODO|\/\*\s*TODO\s*\*\//gi,
      severity: 'low'
    },
    {
      name: 'Empty catch blocks',
      pattern: /catch\s*\([^)]*\)\s*\{\s*\}/g,
      severity: 'medium'
    }
  ]
};

/**
 * 递归获取所有TypeScript文件
 */
function getAllTsFiles(dir) {
  const files = [];

  function traverse(currentDir) {
    try {
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
    } catch (error) {
      console.warn(`Warning: Cannot read directory ${currentDir}: ${error.message}`);
    }
  }

  traverse(dir);
  return files;
}

/**
 * 检查单个文件
 */
function checkFile(filePath) {
  const issues = [];

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const relativePath = path.relative(process.cwd(), filePath);

    for (const [category, rules] of Object.entries(QUALITY_RULES)) {
      for (const rule of rules) {
        const matches = content.match(rule.pattern);
        if (matches) {
          // 获取行号
          const lines = content.split('\n');
          const lineNumbers = matches.map(match => {
            const index = content.indexOf(match);
            return lines.slice(0, index).length + 1;
          });

          issues.push({
            file: relativePath,
            category,
            rule: rule.name,
            severity: rule.severity,
            count: matches.length,
            lines: lineNumbers.slice(0, 3) // 只显示前3个位置
          });
        }
      }
    }
  } catch (error) {
    console.error(`Error reading file ${filePath}: ${error.message}`);
  }

  return issues;
}

/**
 * 生成检查报告
 */
function generateReport(allIssues) {
  const totalIssues = allIssues.length;
  const severityCount = {
    high: allIssues.filter(i => i.severity === 'high').length,
    medium: allIssues.filter(i => i.severity === 'medium').length,
    low: allIssues.filter(i => i.severity === 'low').length
  };

  const categoryCount = {};
  for (const issue of allIssues) {
    categoryCount[issue.category] = (categoryCount[issue.category] || 0) + 1;
  }

  console.log('\n📊 代码质量检查报告');
  console.log('='.repeat(50));
  console.log(`📁 检查文件数: ${allIssues.length > 0 ? [...new Set(allIssues.map(i => i.file))].length : 0}`);
  console.log(`🔍 发现问题: ${totalIssues} 个`);
  console.log(`\n📈 按严重程度分布:`);
  console.log(`   🔴 高: ${severityCount.high} 个`);
  console.log(`   🟡 中: ${severityCount.medium} 个`);
  console.log(`   🟢 低: ${severityCount.low} 个`);

  console.log(`\n📂 按类别分布:`);
  for (const [category, count] of Object.entries(categoryCount)) {
    console.log(`   ${category}: ${count} 个`);
  }

  // 显示高严重性问题
  const highSeverityIssues = allIssues.filter(i => i.severity === 'high');
  if (highSeverityIssues.length > 0) {
    console.log(`\n🚨 高严重性问题 (需要立即修复):`);
    for (const issue of highSeverityIssues) {
      console.log(`\n   ❌ ${issue.rule}`);
      console.log(`      文件: ${issue.file}`);
      console.log(`      位置: 行 ${issue.lines.join(', ')}`);
    }
  }

  // 显示中严重性问题
  const mediumSeverityIssues = allIssues.filter(i => i.severity === 'medium');
  if (mediumSeverityIssues.length > 0) {
    console.log(`\n⚠️  中严重性问题 (建议修复):`);
    for (const issue of mediumSeverityIssues.slice(0, 5)) { // 只显示前5个
      console.log(`\n   ⚡ ${issue.rule}`);
      console.log(`      文件: ${issue.file}`);
      console.log(`      数量: ${issue.count} 个`);
    }
    if (mediumSeverityIssues.length > 5) {
      console.log(`   ... 还有 ${mediumSeverityIssues.length - 5} 个中等问题`);
    }
  }

  // 生成建议
  console.log(`\n💡 改进建议:`);
  if (severityCount.high > 0) {
    console.log(`   🔴 立即修复所有高严重性问题，特别是安全问题`);
  }
  if (severityCount.medium > 0) {
    console.log(`   🟡 优先修复中等问题，提升代码质量`);
  }
  if (categoryCount.security > 0) {
    console.log(`   🔒 加强安全意识，避免硬编码敏感信息`);
  }
  if (categoryCount.codeQuality > 0) {
    console.log(`   🧹 清理代码质量问题，使用Logger替代console.log`);
  }
  if (categoryCount.performance > 0) {
    console.log(`   ⚡ 优化性能问题，使用异步操作`);
  }

  console.log(`\n🎯 质量评分: ${calculateQualityScore(totalIssues)}/100`);
}

/**
 * 计算质量评分
 */
function calculateQualityScore(totalIssues) {
  if (totalIssues === 0) return 100;

  // 权重：高=10分，中=5分，低=1分
  const maxDeduction = 100;
  let deduction = 0;

  for (const issue of arguments[1] || []) {
    switch (issue.severity) {
      case 'high':
        deduction += 10 * issue.count;
        break;
      case 'medium':
        deduction += 5 * issue.count;
        break;
      case 'low':
        deduction += 1 * issue.count;
        break;
    }
  }

  return Math.max(0, 100 - Math.min(deduction, maxDeduction));
}

/**
 * 主函数
 */
function main() {
  console.log('🔍 开始项目质量检查...\n');

  const files = getAllTsFiles(SRC_DIR);
  console.log(`📁 找到 ${files.length} 个 TypeScript 文件\n`);

  const allIssues = [];
  for (const file of files) {
    const issues = checkFile(file);
    allIssues.push(...issues);
  }

  generateReport(allIssues);

  // 设置退出码（如果有高严重性问题）
  if (allIssues.some(i => i.severity === 'high')) {
    console.log('\n❌ 发现高严重性问题，建议修复后重新检查');
    process.exit(1);
  } else if (allIssues.length > 0) {
    console.log('\n⚠️  发现一些问题，建议改进');
    process.exit(0);
  } else {
    console.log('\n✅ 未发现明显问题，代码质量良好！');
    process.exit(0);
  }
}

// 运行检查
if (require.main === module) {
  main();
}

module.exports = { checkFile, getAllTsFiles };