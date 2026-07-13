<template>
  <div>
    <!-- 坑1: ui-tree 没配 :props，数据字段非 label 会空白 -->
    <ui-tree :data="deptTree" />

    <!-- 坑2: ui-advanced-search 没有 :fields -->
    <ui-advanced-search v-model="form" />

    <!-- 正确用法: 应不报 -->
    <ui-tree :data="ok" :props="{ label: 'name', children: 'kids' }" />
    <ui-advanced-search v-model="q" :fields="fields" />

    <!-- 残留源库 -->
    <el-card>还没换的卡片</el-card>
    <d-button>还没换的按钮</d-button>

    <!-- 安全组件 -->
    <ui-button>ok</ui-button>
  </div>
</template>
