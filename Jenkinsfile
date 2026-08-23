// Jenkinsfile — pull code + docker compose up cho Takypok Workflow
//
// YÊU CẦU TRƯỚC KHI CHẠY:
// 1. Jenkins agent chạy job này PHẢI nằm trên (hoặc SSH được vào) chính VPS sẽ chạy app —
//    vì `docker compose up` chạy trực tiếp trên máy đang thực thi pipeline, không push/pull
//    image qua registry nào cả. Agent cần có sẵn Docker + Docker Compose v2 (`docker compose ...`).
// 2. Mạng "takypok_default" phải tồn tại TRƯỚC khi chạy job này — mạng này do các stack hạ tầng
//    (infrastructure/postgres, infrastructure/redis, infrastructure/kafka) tự tạo khi chạy
//    `docker compose up -d` trong từng thư mục đó. Nếu infra chưa chạy, bước "Docker Compose Up"
//    ở dưới sẽ lỗi vì network chưa tồn tại (network được khai báo `external: true` trong
//    docker-compose.yaml gốc). Chạy infra 1 lần trước, hoặc bật INCLUDE_INFRA bên dưới.
// 3. Stage Checkout bên dưới tự pull code bằng credential "jenkins-tocken" (đã tạo sẵn trong
//    Manage Jenkins > Credentials), nên có thể dán thẳng file này vào job kiểu "Pipeline script"
//    (paste trực tiếp, không cần cấu hình SCM riêng cho job) — chỉ cần bấm "Build Now" là chạy.
//    LƯU Ý: nếu "jenkins-tocken" đang là kiểu "Secret text" (chỉ có token, không kèm username),
//    bước `git` sẽ báo lỗi authentication — cần sửa credential đó thành kiểu
//    "Username with password" (username = username GitHub, password = Personal Access Token).
// 4. Jenkins đang chạy DƯỚI DẠNG 1 CONTAINER trên chính máy có Docker Desktop, nên container Jenkins
//    đó PHẢI được mount socket của Docker Desktop vào bên trong thì các lệnh `docker`/`docker compose`
//    ở dưới mới điều khiển đúng Docker Engine mà Docker Desktop đang quản lý — khi đó container nào
//    được tạo ra sẽ tự động hiện trong giao diện Docker Desktop, không cần thêm bước nào khác:
//      docker run -d --name jenkins \
//        -v /var/run/docker.sock:/var/run/docker.sock \
//        -v jenkins_home:/var/jenkins_home \
//        -p 8080:8080 jenkins/jenkins:lts
//    (trên Windows dùng Docker Desktop, đường dẫn socket vẫn là /var/run/docker.sock nhờ WSL2 backend)
//    Container Jenkins cũng cần có sẵn docker CLI để chạy được các lệnh `sh 'docker ...'` — image
//    jenkins/jenkins gốc KHÔNG có sẵn, cần build lại image Jenkins có cài thêm docker-ce-cli
//    (hoặc dùng plugin "Docker Pipeline" kết hợp Dockerfile riêng cho Jenkins).

pipeline {
    agent any

    options {
        timestamps()
        buildDiscarder(logRotator(numToKeepStr: '20'))
        disableConcurrentBuilds()
    }

    parameters {
        booleanParam(name: 'INCLUDE_INFRA', defaultValue: false,
            description: 'Đồng thời khởi động Postgres/Redis/Kafka (infrastructure/*) trước khi up app — chỉ cần bật 1 lần đầu hoặc khi infra chưa chạy')
    }

    stages {

        stage('Checkout') {
            steps {
                // Dọn sạch workspace cũ trước khi pull, tránh lẫn file build/rác của lần chạy trước
                cleanWs()

                // Pull code tường minh bằng bước `git` — không phụ thuộc job phải cấu hình sẵn SCM,
                // nên copy nguyên Jenkinsfile này vào job kiểu "Pipeline script" (dán trực tiếp) vẫn chạy được.
                git branch: 'master',
                    url: 'https://github.com/paKymoK/Workflow.git',
                    credentialsId: 'jenkins-tocken'

                // Ghi lại commit vừa pull để log/debug (xem ai đẩy code gì lên trước khi build)
                script {
                    env.GIT_COMMIT_SHORT = sh(script: 'git rev-parse --short HEAD', returnStdout: true).trim()
                    env.GIT_COMMIT_MSG   = sh(script: 'git log -1 --pretty=%s', returnStdout: true).trim()
                    env.GIT_COMMIT_AUTHOR = sh(script: 'git log -1 --pretty=%an', returnStdout: true).trim()
                }
                echo "Đã pull xong commit ${env.GIT_COMMIT_SHORT} (${env.GIT_COMMIT_AUTHOR}): ${env.GIT_COMMIT_MSG}"
            }
        }

        stage('Docker Desktop Connectivity') {
            steps {
                // Kiểm tra sớm xem container Jenkins có "thấy" được Docker Desktop hay không —
                // nếu bước này lỗi (không kết nối được tới socket), báo ngay thay vì để lỗi khó hiểu
                // rơi vào bước "Docker Compose Up" ở phía sau.
                sh '''
                    echo "== Kiểm tra kết nối tới Docker Desktop qua /var/run/docker.sock =="
                    docker version
                '''
            }
        }

        stage('Start infrastructure') {
            when {
                expression { params.INCLUDE_INFRA }
            }
            steps {
                sh '''
                    cd infrastructure/postgres && docker compose up -d
                    cd ../redis && docker compose up -d
                    cd ../kafka && docker compose up -d
                '''
            }
        }

        stage('Docker Compose Up') {
            steps {
                // --build: build lại image nào có code đổi (Docker cache tự bỏ qua service không đổi)
                // -d: chạy nền
                sh 'docker compose up -d --build'
            }
        }

        stage('Status') {
            steps {
                sh '''
                    echo "== Container của project takypok-app vừa build =="
                    docker compose ps

                    echo ""
                    echo "== TOÀN BỘ container hiện có trên Docker Desktop (đúng những gì thấy trong giao diện) =="
                    docker ps -a --format "table {{.Names}}\\t{{.Image}}\\t{{.Status}}\\t{{.Ports}}"
                '''
            }
        }
    }

    post {
        success {
            echo "Build #${env.BUILD_NUMBER} thành công — các service đã được (re)start."
        }
        failure {
            echo "Build #${env.BUILD_NUMBER} thất bại — chạy 'docker compose logs --tail=100' trên VPS để xem chi tiết."
        }
    }
}
