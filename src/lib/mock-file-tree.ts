/**
 * NexCube Mock 文件树 —— Forge 1.20.1 标准项目结构
 *
 * 用途：Task 1-B 左侧工程树的初始数据。
 * 后续阶段会替换为从 capabilities.fs 真实读取的目录结构。
 *
 * 结构：
 *  - src/main/java/com/example/mod/   Java 源码
 *    - block/  方块类
 *    - item/   物品类
 *    - entity/ 实体类
 *  - src/main/resources/
 *    - META-INF/mods.toml             Forge 模组声明
 *    - assets/example_mod/
 *      - textures/{block,item}/       贴图 (PNG)
 *      - models/{block,item}/         模型 JSON
 *      - lang/{en_us,zh_cn}.json      国际化
 *  - src/test/                        测试目录
 *  - build.gradle / settings.gradle / gradle.properties / gradlew(.bat)
 *  - .gitignore / README.md
 */

export type FileTreeNodeType = 'file' | 'directory'

export interface FileTreeNode {
  id: string
  name: string
  /** 相对项目根的路径（POSIX 风格，正斜杠） */
  path: string
  type: FileTreeNodeType
  /** 文件扩展名（不含点，目录为 undefined） */
  ext?: string
  children?: FileTreeNode[]
  /** 默认展开状态（仅目录有效） */
  isExpanded?: boolean
}

export const MOCK_FILE_TREE: FileTreeNode[] = [
  {
    id: 'src',
    name: 'src',
    path: 'src',
    type: 'directory',
    isExpanded: true,
    children: [
      {
        id: 'src-main',
        name: 'main',
        path: 'src/main',
        type: 'directory',
        isExpanded: true,
        children: [
          {
            id: 'src-main-java',
            name: 'java',
            path: 'src/main/java',
            type: 'directory',
            isExpanded: true,
            children: [
              {
                id: 'src-main-java-com',
                name: 'com',
                path: 'src/main/java/com',
                type: 'directory',
                isExpanded: true,
                children: [
                  {
                    id: 'src-main-java-com-example',
                    name: 'example',
                    path: 'src/main/java/com/example',
                    type: 'directory',
                    isExpanded: true,
                    children: [
                      {
                        id: 'src-main-java-com-example-mod',
                        name: 'mod',
                        path: 'src/main/java/com/example/mod',
                        type: 'directory',
                        isExpanded: true,
                        children: [
                          {
                            id: 'f1',
                            name: 'ExampleMod.java',
                            path: 'src/main/java/com/example/mod/ExampleMod.java',
                            type: 'file',
                            ext: 'java',
                          },
                          {
                            id: 'src-main-java-com-example-mod-block',
                            name: 'block',
                            path: 'src/main/java/com/example/mod/block',
                            type: 'directory',
                            children: [
                              {
                                id: 'f2',
                                name: 'ModBlocks.java',
                                path: 'src/main/java/com/example/mod/block/ModBlocks.java',
                                type: 'file',
                                ext: 'java',
                              },
                              {
                                id: 'f3',
                                name: 'RubyBlock.java',
                                path: 'src/main/java/com/example/mod/block/RubyBlock.java',
                                type: 'file',
                                ext: 'java',
                              },
                            ],
                          },
                          {
                            id: 'src-main-java-com-example-mod-item',
                            name: 'item',
                            path: 'src/main/java/com/example/mod/item',
                            type: 'directory',
                            children: [
                              {
                                id: 'f4',
                                name: 'ModItems.java',
                                path: 'src/main/java/com/example/mod/item/ModItems.java',
                                type: 'file',
                                ext: 'java',
                              },
                              {
                                id: 'f5',
                                name: 'RubyItem.java',
                                path: 'src/main/java/com/example/mod/item/RubyItem.java',
                                type: 'file',
                                ext: 'java',
                              },
                            ],
                          },
                          {
                            id: 'src-main-java-com-example-mod-entity',
                            name: 'entity',
                            path: 'src/main/java/com/example/mod/entity',
                            type: 'directory',
                            children: [
                              {
                                id: 'f6',
                                name: 'ModEntities.java',
                                path: 'src/main/java/com/example/mod/entity/ModEntities.java',
                                type: 'file',
                                ext: 'java',
                              },
                              {
                                id: 'f7',
                                name: 'RubyGolem.java',
                                path: 'src/main/java/com/example/mod/entity/RubyGolem.java',
                                type: 'file',
                                ext: 'java',
                              },
                            ],
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
          {
            id: 'src-main-resources',
            name: 'resources',
            path: 'src/main/resources',
            type: 'directory',
            isExpanded: true,
            children: [
              {
                id: 'src-main-resources-META-INF',
                name: 'META-INF',
                path: 'src/main/resources/META-INF',
                type: 'directory',
                children: [
                  {
                    id: 'f8',
                    name: 'mods.toml',
                    path: 'src/main/resources/META-INF/mods.toml',
                    type: 'file',
                    ext: 'toml',
                  },
                ],
              },
              {
                id: 'src-main-resources-assets',
                name: 'assets',
                path: 'src/main/resources/assets',
                type: 'directory',
                children: [
                  {
                    id: 'src-main-resources-assets-example_mod',
                    name: 'example_mod',
                    path: 'src/main/resources/assets/example_mod',
                    type: 'directory',
                    children: [
                      {
                        id: 'src-main-resources-assets-example_mod-textures',
                        name: 'textures',
                        path: 'src/main/resources/assets/example_mod/textures',
                        type: 'directory',
                        children: [
                          {
                            id: 'src-main-resources-assets-example_mod-textures-block',
                            name: 'block',
                            path: 'src/main/resources/assets/example_mod/textures/block',
                            type: 'directory',
                            children: [
                              {
                                id: 'f9',
                                name: 'ruby_block.png',
                                path: 'src/main/resources/assets/example_mod/textures/block/ruby_block.png',
                                type: 'file',
                                ext: 'png',
                              },
                            ],
                          },
                          {
                            id: 'src-main-resources-assets-example_mod-textures-item',
                            name: 'item',
                            path: 'src/main/resources/assets/example_mod/textures/item',
                            type: 'directory',
                            children: [
                              {
                                id: 'f10',
                                name: 'ruby.png',
                                path: 'src/main/resources/assets/example_mod/textures/item/ruby.png',
                                type: 'file',
                                ext: 'png',
                              },
                            ],
                          },
                        ],
                      },
                      {
                        id: 'src-main-resources-assets-example_mod-models',
                        name: 'models',
                        path: 'src/main/resources/assets/example_mod/models',
                        type: 'directory',
                        children: [
                          {
                            id: 'src-main-resources-assets-example_mod-models-block',
                            name: 'block',
                            path: 'src/main/resources/assets/example_mod/models/block',
                            type: 'directory',
                            children: [],
                          },
                          {
                            id: 'src-main-resources-assets-example_mod-models-item',
                            name: 'item',
                            path: 'src/main/resources/assets/example_mod/models/item',
                            type: 'directory',
                            children: [],
                          },
                        ],
                      },
                      {
                        id: 'src-main-resources-assets-example_mod-lang',
                        name: 'lang',
                        path: 'src/main/resources/assets/example_mod/lang',
                        type: 'directory',
                        children: [
                          {
                            id: 'f11',
                            name: 'en_us.json',
                            path: 'src/main/resources/assets/example_mod/lang/en_us.json',
                            type: 'file',
                            ext: 'json',
                          },
                          {
                            id: 'f12',
                            name: 'zh_cn.json',
                            path: 'src/main/resources/assets/example_mod/lang/zh_cn.json',
                            type: 'file',
                            ext: 'json',
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: 'src-test',
        name: 'test',
        path: 'src/test',
        type: 'directory',
        children: [],
      },
    ],
  },
  {
    id: 'f13',
    name: 'build.gradle',
    path: 'build.gradle',
    type: 'file',
    ext: 'gradle',
  },
  {
    id: 'f14',
    name: 'gradle.properties',
    path: 'gradle.properties',
    type: 'file',
    ext: 'properties',
  },
  {
    id: 'f15',
    name: 'settings.gradle',
    path: 'settings.gradle',
    type: 'file',
    ext: 'gradle',
  },
  {
    id: 'f16',
    name: 'gradlew',
    path: 'gradlew',
    type: 'file',
    ext: '',
  },
  {
    id: 'f17',
    name: 'gradlew.bat',
    path: 'gradlew.bat',
    type: 'file',
    ext: 'bat',
  },
  {
    id: 'f18',
    name: '.gitignore',
    path: '.gitignore',
    type: 'file',
    ext: 'gitignore',
  },
  {
    id: 'f19',
    name: 'README.md',
    path: 'README.md',
    type: 'file',
    ext: 'md',
  },
]

/**
 * 工具函数：递归遍历文件树
 */
export function traverseTree(
  nodes: FileTreeNode[],
  visitor: (node: FileTreeNode, depth: number) => void,
  depth = 0,
): void {
  for (const node of nodes) {
    visitor(node, depth)
    if (node.children && node.children.length > 0) {
      traverseTree(node.children, visitor, depth + 1)
    }
  }
}

/**
 * 工具函数：统计总节点数
 */
export function countTreeNodes(nodes: FileTreeNode[]): {
  total: number
  files: number
  directories: number
} {
  let total = 0
  let files = 0
  let directories = 0
  traverseTree(nodes, (n) => {
    total++
    if (n.type === 'file') files++
    else directories++
  })
  return { total, files, directories }
}

/**
 * 工具函数：深拷贝并保留 isExpanded 默认值
 * 用于 useState 初始化（避免污染全局 mock 数据）
 */
export function cloneTreeWithDefaults(nodes: FileTreeNode[]): FileTreeNode[] {
  return nodes.map((n) => ({
    ...n,
    isExpanded: n.type === 'directory' ? Boolean(n.isExpanded) : undefined,
    children: n.children ? cloneTreeWithDefaults(n.children) : undefined,
  }))
}
