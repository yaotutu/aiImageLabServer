# API 使用示例

## 基础配置

```javascript
const API_BASE_URL = 'http://localhost:8000/api';

// 通用请求函数
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = localStorage.getItem('token');

  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || '请求失败');
  }

  return response.json();
}
```

## 1. 用户注册

```javascript
async function register(email, password, nickname) {
  const data = await apiRequest('/auth/register/email', {
    method: 'POST',
    body: JSON.stringify({ email, password, nickname }),
  });

  // 保存 token
  localStorage.setItem('token', data.token);
  return data;
}

// 使用示例
register('user@example.com', 'Password123', '测试用户')
  .then(data => console.log('注册成功', data))
  .catch(err => console.error('注册失败', err));
```

## 2. 用户登录

```javascript
async function login(email, password) {
  const data = await apiRequest('/auth/login/email', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

  // 保存 token
  localStorage.setItem('token', data.token);
  return data;
}

// 使用示例
login('user@example.com', 'Password123')
  .then(data => console.log('登录成功', data))
  .catch(err => console.error('登录失败', err));
```

## 3. 获取用户信息

```javascript
async function getUserProfile() {
  return apiRequest('/users/profile', {
    method: 'GET',
  });
}

// 使用示例
getUserProfile()
  .then(profile => console.log('用户信息', profile))
  .catch(err => console.error('获取失败', err));
```

## 4. 更新用户信息

```javascript
async function updateProfile(nickname, avatarUrl) {
  return apiRequest('/users/profile', {
    method: 'PUT',
    body: JSON.stringify({ nickname, avatarUrl }),
  });
}

// 使用示例
updateProfile('新昵称', 'https://example.com/avatar.jpg')
  .then(data => console.log('更新成功', data))
  .catch(err => console.error('更新失败', err));
```

## 5. 修改密码

```javascript
async function changePassword(oldPassword, newPassword) {
  return apiRequest('/users/password', {
    method: 'PUT',
    body: JSON.stringify({ oldPassword, newPassword }),
  });
}

// 使用示例
changePassword('OldPass123', 'NewPass123')
  .then(() => console.log('密码修改成功'))
  .catch(err => console.error('密码修改失败', err));
```

## 6. 获取用户积分

```javascript
async function getUserCredits() {
  return apiRequest('/users/credits', {
    method: 'GET',
  });
}

// 使用示例
getUserCredits()
  .then(data => console.log('当前积分:', data.credits))
  .catch(err => console.error('获取失败', err));
```

## 7. 获取模版列表（分页）

```javascript
async function getTemplates(page = 1, pageSize = 20, category = null, isPremium = null) {
  let endpoint = `/templates?page=${page}&pageSize=${pageSize}`;

  if (category) endpoint += `&category=${category}`;
  if (isPremium !== null) endpoint += `&isPremium=${isPremium}`;

  return apiRequest(endpoint, {
    method: 'GET',
  });
}

// 使用示例
getTemplates(1, 10, 'id_photo')
  .then(data => {
    console.log('模版列表:', data.templates);
    console.log('总数:', data.total);
    console.log('当前页:', data.page);
  })
  .catch(err => console.error('获取失败', err));
```

## 8. 获取热门模版

```javascript
async function getHotTemplates(limit = 10) {
  return apiRequest(`/templates/hot?limit=${limit}`, {
    method: 'GET',
  });
}

// 使用示例
getHotTemplates(5)
  .then(templates => console.log('热门模版:', templates))
  .catch(err => console.error('获取失败', err));
```

## 9. 搜索模版

```javascript
async function searchTemplates(keyword) {
  return apiRequest(`/templates/search?keyword=${encodeURIComponent(keyword)}`, {
    method: 'GET',
  });
}

// 使用示例
searchTemplates('证件照')
  .then(templates => console.log('搜索结果:', templates))
  .catch(err => console.error('搜索失败', err));
```

## 10. 按分类获取模版

```javascript
async function getTemplatesByCategory(category) {
  return apiRequest(`/templates/category/${category}`, {
    method: 'GET',
  });
}

// 使用示例
getTemplatesByCategory('id_photo')
  .then(templates => console.log('证件照模版:', templates))
  .catch(err => console.error('获取失败', err));
```

## 11. 获取模版详情

```javascript
async function getTemplateDetail(templateId) {
  return apiRequest(`/templates/${templateId}`, {
    method: 'GET',
  });
}

// 使用示例
getTemplateDetail('template-id-123')
  .then(template => console.log('模版详情:', template))
  .catch(err => console.error('获取失败', err));
```

## 12. 点赞模版

```javascript
async function likeTemplate(templateId) {
  return apiRequest(`/templates/${templateId}/like`, {
    method: 'POST',
  });
}

// 使用示例
likeTemplate('template-id-123')
  .then(template => console.log('点赞成功，当前点赞数:', template.likeCount))
  .catch(err => console.error('点赞失败', err));
```

## 13. 取消点赞

```javascript
async function unlikeTemplate(templateId) {
  return apiRequest(`/templates/${templateId}/like`, {
    method: 'DELETE',
  });
}

// 使用示例
unlikeTemplate('template-id-123')
  .then(template => console.log('取消点赞成功'))
  .catch(err => console.error('取消失败', err));
```

## React Hooks 封装示例

```javascript
import { useState, useEffect } from 'react';

// 自定义 Hook: 获取模版列表
export function useTemplates(page = 1, pageSize = 20) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    async function fetchTemplates() {
      try {
        setLoading(true);
        const data = await getTemplates(page, pageSize);
        setTemplates(data.templates);
        setTotal(data.total);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchTemplates();
  }, [page, pageSize]);

  return { templates, loading, error, total };
}

// 使用示例
function TemplateList() {
  const { templates, loading, error, total } = useTemplates(1, 10);

  if (loading) return <div>加载中...</div>;
  if (error) return <div>错误: {error}</div>;

  return (
    <div>
      <h2>模版列表 (共 {total} 个)</h2>
      {templates.map(template => (
        <div key={template.id}>
          <h3>{template.name}</h3>
          <p>{template.description}</p>
        </div>
      ))}
    </div>
  );
}
```

## Vue Composable 封装示例

```javascript
import { ref, onMounted } from 'vue';

// Composable: 获取模版列表
export function useTemplates(page = 1, pageSize = 20) {
  const templates = ref([]);
  const loading = ref(true);
  const error = ref(null);
  const total = ref(0);

  async function fetchTemplates() {
    try {
      loading.value = true;
      const data = await getTemplates(page, pageSize);
      templates.value = data.templates;
      total.value = data.total;
      error.value = null;
    } catch (err) {
      error.value = err.message;
    } finally {
      loading.value = false;
    }
  }

  onMounted(() => {
    fetchTemplates();
  });

  return { templates, loading, error, total, refetch: fetchTemplates };
}

// 使用示例
<script setup>
import { useTemplates } from './composables/useTemplates';

const { templates, loading, error, total } = useTemplates(1, 10);
</script>

<template>
  <div>
    <div v-if="loading">加载中...</div>
    <div v-else-if="error">错误: {{ error }}</div>
    <div v-else>
      <h2>模版列表 (共 {{ total }} 个)</h2>
      <div v-for="template in templates" :key="template.id">
        <h3>{{ template.name }}</h3>
        <p>{{ template.description }}</p>
      </div>
    </div>
  </div>
</template>
```

## 完整用户流程示例

```javascript
// 完整的用户注册登录流程
async function completeUserFlow() {
  try {
    // 1. 注册
    console.log('1. 注册用户...');
    await register('demo@example.com', 'Demo123456', 'Demo用户');
    console.log('✅ 注册成功');

    // 2. 获取用户信息
    console.log('2. 获取用户信息...');
    const profile = await getUserProfile();
    console.log('✅ 用户信息:', profile);

    // 3. 获取积分
    console.log('3. 获取用户积分...');
    const credits = await getUserCredits();
    console.log('✅ 当前积分:', credits.credits);

    // 4. 浏览模版
    console.log('4. 浏览模版列表...');
    const templatesData = await getTemplates(1, 5);
    console.log('✅ 模版列表:', templatesData.templates);

    // 5. 查看第一个模版详情
    if (templatesData.templates.length > 0) {
      const templateId = templatesData.templates[0].id;
      console.log('5. 查看模版详情...');
      const detail = await getTemplateDetail(templateId);
      console.log('✅ 模版详情:', detail);

      // 6. 点赞模版
      console.log('6. 点赞模版...');
      await likeTemplate(templateId);
      console.log('✅ 点赞成功');
    }

    console.log('🎉 完整流程测试通过！');
  } catch (error) {
    console.error('❌ 流程出错:', error);
  }
}
```

## 错误处理示例

```javascript
// 全局错误处理
async function apiRequestWithErrorHandling(endpoint, options = {}) {
  try {
    return await apiRequest(endpoint, options);
  } catch (error) {
    // 根据错误类型进行不同处理
    if (error.message.includes('401') || error.message.includes('未授权')) {
      // Token 过期，跳转到登录页
      localStorage.removeItem('token');
      window.location.href = '/login';
    } else if (error.message.includes('403')) {
      // 权限不足
      alert('您没有权限执行此操作');
    } else if (error.message.includes('404')) {
      // 资源不存在
      alert('请求的资源不存在');
    } else {
      // 其他错误
      alert(`请求失败: ${error.message}`);
    }

    throw error;
  }
}
```

## 注意事项

1. **Token 管理**: 所有需要认证的接口都需要在请求头中携带 `Authorization: Bearer <token>`
2. **Token 过期**: Token 有效期为 7 天，过期后需要重新登录
3. **CORS**: 开发环境已配置允许所有来源，生产环境需要配置具体的前端域名
4. **错误处理**: 所有接口都返回统一格式的错误信息，包含 `statusCode` 和 `message`
5. **分页**: 模版列表支持分页，默认每页 20 条
6. **搜索**: 搜索关键词需要进行 URL 编码（使用 `encodeURIComponent`）

## 在线测试

访问 API 文档页面进行在线测试：http://localhost:8000/api-docs

API 文档支持：
- 查看所有接口详情
- 在线测试接口（Try It 功能）
- 查看请求/响应示例
- 自动生成代码片段
