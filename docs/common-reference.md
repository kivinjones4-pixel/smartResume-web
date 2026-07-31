# 前后端通用规范

错误状态码、展示层级和安全要求见
[error-handling-reference.md](./error-handling-reference.md)。

## 1. 接口返回值
- 成功
```json
{
    "code": 0,
    "msg": "success",
    "data": {}
}
```
- 失败
```json
{
    "code": 1,
    "msg": "用户可理解的错误信息",
    "data": {
        "error_code": "STABLE_ERROR_CODE"
    }
}
```

## 2.函数注释
- 核心函数、重要函数、复杂函数需要注释
