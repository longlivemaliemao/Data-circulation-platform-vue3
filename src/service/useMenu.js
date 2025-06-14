import { computed } from 'vue';

// 定义所有菜单项（只需在此定义一次）
const ALL_MENUS = Object.freeze([
  { index: '1', name: '主页', icon: 'HomeFilled', roles: ['Admin','测试账号',  '普通用户', '数据提供方', '审批员'] },
  { index: '2', name: '数据流转申请', icon: 'document-add', roles: ['测试账号', '普通用户', '数据提供方'] },
  { index: '3', name: '任务处理', icon: 'TfiLayoutListThumb', roles: ['测试账号', '普通用户', '数据提供方', '审批员'] },
  { index: '4', name: '数据提供方审批', icon: 'checked', roles: ['测试账号', '数据提供方'] },
  { index: '5', name: '审批员审批', icon: 'view', roles: ['测试账号', '审批员'] },
  { index: '6', name: '用户信息管理', icon: 'user', roles: ['测试账号', 'Admin'] },
  { index: '7', name: '个人信息管理', icon: 'user', roles: ['测试账号','Admin', '普通用户', '数据提供方', '审批员'] },
  { index: '8', name: '数据管理', icon: 'Files', roles: ['测试账号', '数据提供方'] },
]);

/**
 * 获取当前用户可访问的菜单项
 * @param {string} role - 当前用户角色
 * @returns {ComputedRef<Array>} 可访问的菜单项
 */
export function useMenu(role) {
  const availableMenus = computed(() => {
    return ALL_MENUS.filter(menu => menu.roles.includes(role));
  });

  return {
    availableMenus,
    // 如果需要也可以暴露全部菜单
    allMenus: ALL_MENUS
  };
}