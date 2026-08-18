/**
 * i18n dictionary — zh-CN primary, en fallback.
 *
 * Flat dot-keys, const-asserted for type safety: every key used in
 * `t()` must exist in both locales, checked at compile time.
 */

export const en = {
  // ── Common ──
  'common.cancel': 'Cancel',
  'common.create': 'Create',
  'common.delete': 'Delete',
  'common.settings': 'Settings',
  'common.save': 'Save',
  'common.discard': 'Discard changes',
  'common.signOut': 'Sign out',
  'common.loading': 'Loading...',
  'common.page': 'Page',

  // ── Nav ──
  'nav.datasets': 'Datasets',
  'nav.documents': 'Documents',
  'nav.retrieval': 'Retrieval',

  // ── Sidebar ──
  'sidebar.search': 'Search',
  'sidebar.github': 'GitHub repository',
  'sidebar.help': 'Help & documentation',

  // ── User ──
  'user.settings': 'Settings',
  'user.signOut': 'Sign out',

  // ── Settings modal ──
  'settings.title': 'Settings',
  'settings.language': 'Language',
  'settings.languageEn': 'English',
  'settings.languageZh': '简体中文',
  'settings.hotkeys': 'Shortcuts',
  'settings.hotkeysHint': 'Click a shortcut to re-record it.',
  'settings.hotkeysRecord': 'Press keys to record...',
  'settings.hotkeysConflict': 'Already used by “{action}”',
  'settings.hotkeysReset': 'Reset shortcuts',
  'settings.hotkeySearch': 'Global search',
  'settings.hotkeyNavigate': 'Navigate results',
  'settings.draftHint': 'Changes apply only after you save.',

  // ── Command palette ──
  'palette.placeholder': 'Search datasets, documents, or ask anything...',
  'palette.noMatches': 'No matches for “{query}”',
  'palette.groupNavigate': 'Navigate',
  'palette.groupDatasets': 'Datasets',
  'palette.groupDocuments': 'Documents',
  'palette.groupAsk': 'Ask',
  'palette.ask': 'Ask “{query}”',
  'palette.hintDocs': '{count} docs',
  'palette.footerNavigate': '↑↓ navigate',
  'palette.footerOpen': '↵ open',
  'palette.footerClose': 'esc close',

  // ── Datasets page ──
  'datasets.title': 'Datasets',
  'datasets.count': '{count} {count, plural, =1 {dataset} other {datasets}}',
  'datasets.new': 'New Dataset',
  'datasets.searchPlaceholder': 'Search datasets...',
  'datasets.emptyFiltered': 'No matching datasets',
  'datasets.empty': 'No datasets yet',
  'datasets.createFirst': 'Create your first dataset',
  'datasets.deleteTitle': 'Delete this dataset?',
  'datasets.deleteDesc': 'This action cannot be undone.',
  'datasets.deleteTooltip': 'Delete',
  'datasets.modalTitle': 'New Dataset',
  'datasets.fieldName': 'Name',
  'datasets.fieldNameRequired': 'Please enter a name',
  'datasets.fieldNamePlaceholder': 'e.g. Product Documentation',
  'datasets.fieldDesc': 'Description',
  'datasets.fieldDescPlaceholder': 'Optional description...',
  'datasets.metaDocs': '{count} docs',
  'datasets.metaChunks': '{count} chunks',

  // ── Documents page ──
  'documents.title': 'Documents',
  'documents.count': '{count} {count, plural, =1 {document} other {documents}}',
  'documents.selectDataset': 'Select a dataset to view its documents.',
  'documents.viewTable': 'Table',
  'documents.viewUpload': 'Upload',
  'documents.colName': 'Name',
  'documents.colStatus': 'Status',
  'documents.colSize': 'Size',
  'documents.colChunks': 'Chunks',
  'documents.dropTitle': 'Drop files here or click to upload',
  'documents.dropHint': 'PDF, Word, Excel, Markdown, TXT',
  'documents.empty': 'No documents in this dataset',
  'documents.uploaded': 'File uploaded',
  'documents.uploadFailed': 'Upload failed',
  'documents.deleted': 'Document deleted',

  // ── Retrieval page ──
  'retrieval.title': 'Retrieval',
  'retrieval.subtitle': 'Search across your knowledge bases with hybrid retrieval',
  'retrieval.placeholder': 'Ask a question...',
  'retrieval.search': 'Search',
  'retrieval.datasetFilter': 'All datasets (default)',
  'retrieval.results': '{count} results',
  'retrieval.retrieving': 'Retrieving...',
  'retrieval.emptyIdle': 'Enter a question to search your knowledge bases',
  'retrieval.emptyNone': 'No results found. Try rephrasing your question.',
} as const;

export type Dict = { [K in keyof typeof en]: string };
export type DictKey = keyof Dict;

export const zh: Dict = {
  // ── Common ──
  'common.cancel': '取消',
  'common.create': '创建',
  'common.delete': '删除',
  'common.settings': '设置',
  'common.save': '保存',
  'common.discard': '放弃修改',
  'common.signOut': '退出登录',
  'common.loading': '加载中...',
  'common.page': '页面',

  // ── Nav ──
  'nav.datasets': '数据集',
  'nav.documents': '文档',
  'nav.retrieval': '检索',

  // ── Sidebar ──
  'sidebar.search': '搜索',
  'sidebar.github': 'GitHub 仓库',
  'sidebar.help': '帮助与文档',

  // ── User ──
  'user.settings': '设置',
  'user.signOut': '退出登录',

  // ── Settings modal ──
  'settings.title': '设置',
  'settings.language': '语言',
  'settings.languageEn': 'English',
  'settings.languageZh': '简体中文',
  'settings.hotkeys': '快捷键',
  'settings.hotkeysHint': '点击快捷键可重新录制。',
  'settings.hotkeysRecord': '按下按键组合以录制...',
  'settings.hotkeysConflict': '已被「{action}」占用',
  'settings.hotkeysReset': '重置快捷键',
  'settings.hotkeySearch': '全局搜索',
  'settings.hotkeyNavigate': '结果导航',
  'settings.draftHint': '修改需保存后才会生效。',

  // ── Command palette ──
  'palette.placeholder': '搜索数据集、文档，或直接提问...',
  'palette.noMatches': '没有匹配「{query}」的结果',
  'palette.groupNavigate': '导航',
  'palette.groupDatasets': '数据集',
  'palette.groupDocuments': '文档',
  'palette.groupAsk': '提问',
  'palette.ask': '提问「{query}」',
  'palette.hintDocs': '{count} 篇文档',
  'palette.footerNavigate': '↑↓ 导航',
  'palette.footerOpen': '↵ 打开',
  'palette.footerClose': 'esc 关闭',

  // ── Datasets page ──
  'datasets.title': '数据集',
  'datasets.count': '{count} 个数据集',
  'datasets.new': '新建数据集',
  'datasets.searchPlaceholder': '搜索数据集...',
  'datasets.emptyFiltered': '没有匹配的数据集',
  'datasets.empty': '还没有数据集',
  'datasets.createFirst': '创建第一个数据集',
  'datasets.deleteTitle': '删除该数据集？',
  'datasets.deleteDesc': '此操作不可撤销。',
  'datasets.deleteTooltip': '删除',
  'datasets.modalTitle': '新建数据集',
  'datasets.fieldName': '名称',
  'datasets.fieldNameRequired': '请输入名称',
  'datasets.fieldNamePlaceholder': '例如：产品文档',
  'datasets.fieldDesc': '描述',
  'datasets.fieldDescPlaceholder': '可选描述...',
  'datasets.metaDocs': '{count} 篇文档',
  'datasets.metaChunks': '{count} 个分块',

  // ── Documents page ──
  'documents.title': '文档',
  'documents.count': '{count} 篇文档',
  'documents.selectDataset': '选择一个数据集以查看其文档。',
  'documents.viewTable': '表格',
  'documents.viewUpload': '上传',
  'documents.colName': '名称',
  'documents.colStatus': '状态',
  'documents.colSize': '大小',
  'documents.colChunks': '分块',
  'documents.dropTitle': '拖拽文件到此处，或点击上传',
  'documents.dropHint': 'PDF、Word、Excel、Markdown、TXT',
  'documents.empty': '该数据集暂无文档',
  'documents.uploaded': '上传成功',
  'documents.uploadFailed': '上传失败',
  'documents.deleted': '文档已删除',

  // ── Retrieval page ──
  'retrieval.title': '检索',
  'retrieval.subtitle': '跨知识库的混合检索',
  'retrieval.placeholder': '输入问题...',
  'retrieval.search': '搜索',
  'retrieval.datasetFilter': '全部数据集（默认）',
  'retrieval.results': '{count} 条结果',
  'retrieval.retrieving': '检索中...',
  'retrieval.emptyIdle': '输入问题以搜索知识库',
  'retrieval.emptyNone': '没有找到结果，换个问法试试。',
};

export const dictionaries = { en, zh } as const;
export type Locale = keyof typeof dictionaries;
export const locales: Locale[] = ['en', 'zh'];
