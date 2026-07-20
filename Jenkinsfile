// =============================================================================
// Galaxy Admin 前端 (platform-admin-vue3) Jenkins 流水线
// -----------------------------------------------------------------------------
// 与原 shiyi-blog 脚本的主要差异：
//   1. 前端工程在仓库【根目录】，无需 dir('blog-web') 包裹
//   2. 包管理器为 pnpm（非 npm），且用了 pnpm workspace（@sa/* 子包）
//   3. 构建命令：master -> `pnpm build`(= vite --mode prod)
//                 其它分支 -> `pnpm build:test`(= vite --mode test，连真实后端 8080)
//   4. 产物输出目录为根目录 dist/，且 base=/manager/，部署时需 nginx 配 location /manager/
//
// ⚠️ 部署前请在 Jenkins 中确认并替换以下占位项：
//   - credentialsId : GitHub 拉取代码的凭据 ID
//   - configName    : 系统配置里 SSH Server 的名称
//   - remoteDirectory: 服务器上存放 dist 的目录（需与 nginx 的 /manager/ 对应）
// =============================================================================

pipeline {
    agent any

    // 参数化构建配置
    parameters {
        choice(
            name: 'branch',
            // 当前仓库仅有 master；若以后新增 dev/test 分支，在此补充选项即可
            choices: ['master', 'dev'],
            description: '请选择要构建的分支（master=生产 prod，其它=测试 test）'
        )
    }

    tools {
        // 需 Jenkins 全局工具里已安装该 NodeJS 版本（>=18.12）
        nodejs 'NodeJS 22.22.3'
    }

    environment {
        NPM_REGISTRY = 'https://registry.npmmirror.com'
    }

    stages {
        stage('拉取代码') {
            steps {
                echo "正在拉取分支: ${params.branch}"
                git branch: "${params.branch}",
                    url: 'https://github.com/yuxun0917-commits/platform-admin-vue3.git',
                    credentialsId: '6156f9c0-a42c-4b87-a01c-3302e144e7e3'   // TODO: 替换为你的 Jenkins GitHub 凭据 ID
                echo '代码拉取完成'
            }
        }

        stage('安装依赖') {
            steps {
                echo '安装 pnpm 依赖...'
                // 项目无 packageManager 字段，直接用 npm 全局安装 pnpm 再 install（workspace 一并处理）
                sh '''
                    node -v
                    npm install -g pnpm --registry=${NPM_REGISTRY}
                    pnpm -v
                    pnpm install --registry=${NPM_REGISTRY}
                '''
            }
        }

        stage('打包应用') {
            steps {
                echo '开始打包...'
                script {
                    if (params.branch == 'master') {
                        sh 'pnpm build'          // vite build --mode prod
                        echo "📦 生产环境构建完成"
                    } else {
                        sh 'pnpm build:test'     // vite build --mode test（连真实后端 8080）
                        echo "📦 测试环境构建完成"
                    }
                }
                echo '打包完成'
            }
        }

        stage('发布到服务器') {
            steps {
                sshPublisher(
                    publishers: [
                        sshPublisherDesc(
                            configName: '本机节点',   // TODO: 替换为你的 SSH Server 名称
                            transfers: [
                                sshTransfer(
                                    sourceFiles: 'dist/**',
                                    removePrefix: 'dist',
                                    remoteDirectory: 'platform/admin/dist',  // TODO: 替换为实际部署目录（对应 nginx /manager/）
                                    execCommand: '''
                                        echo "✅ 前端静态文件已上传至部署目录"
                                        # 前端静态文件由 nginx 直接读取磁盘，一般无需 reload；
                                        # 若你改了 nginx 配置（如新增 /manager/ location），可在此执行：
                                        # sudo nginx -s reload
                                    '''
                                )
                            ]
                        )
                    ]
                )
            }
        }

    }

    post {
        success {
            echo '✅ 构建部署成功！'
        }
        failure {
            echo '❌ 构建部署失败，请检查日志'
        }
    }
}
