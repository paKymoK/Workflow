// Jenkinsfile — pull code + docker compose up cho Takypok Workflow
//
// YÊU CẦU TRƯỚC KHI CHẠY:
// 1. Jenkins agent chạy job này PHẢI nằm trên (hoặc SSH được vào) chính VPS sẽ chạy app —
//    vì `docker compose up` chạy trực tiếp trên máy đang thực thi pipeline, không push/pull
//    image qua registry nào cả. Agent cần có sẵn Docker + Docker Compose v2 (`docker compose ...`).
// 2. Mạng "takypok_default" phải tồn tại TRƯỚC khi chạy job này — mạng này do các stack hạ tầng
//    (infrastructure/postgres, infrastructure/redis, infrastructure/kafka) tự tạo khi chạy
//    `docker compose up -d` trong từng thư mục đó, và discovery-service/docker-compose.yml cũng
//    khai báo mạng này là `external: true`. Chạy infra 1 lần trước (hoặc bật INCLUDE_INFRA bên
//    dưới), hoặc để stage "Ensure Docker network" tự tạo mạng rỗng nếu chưa có ai tạo.
// 2b. Pipeline này ĐANG SCOPE HẸP: chỉ build/chạy discovery-service (để test trước khi mở rộng ra
//    toàn bộ docker-compose.yaml gốc). Khi cần build lại full stack, đổi lệnh ở stage
//    "Build discovery-service" thành `docker compose up -d --build` (chạy ở thư mục gốc repo).
// 3. Stage Checkout bên dưới tự pull code bằng credential "jenkins-tocken" (đã tạo sẵn trong
//    Manage Jenkins > Credentials), nên có thể dán thẳng file này vào job kiểu "Pipeline script"
//    (paste trực tiếp, không cần cấu hình SCM riêng cho job) — chỉ cần bấm "Build Now" là chạy.
//    LƯU Ý: nếu "jenkins-tocken" đang là kiểu "Secret text" (chỉ có token, không kèm username),
//    bước `git` sẽ báo lỗi authentication — cần sửa credential đó thành kiểu
//    "Username with password" (username = username GitHub, password = Personal Access Token).
// 4. Jenkins đang chạy DƯỚI DẠNG 1 CONTAINER trên chính máy có Docker Desktop, nên container Jenkins
//    đó PHẢI được mount socket của Docker Desktop vào bên trong thì các lệnh `docker`/`docker compose`
//    ở dưới mới điều khiển đúng Docker Engine mà Docker Desktop đang quản lý — khi đó container nào
//    được tạo ra sẽ tự động hiện trong giao diện Docker Desktop, không cần thêm bước nào khác. Container
//    Jenkins CŨNG PHẢI mount thêm đúng đường dẫn workspace thật trên host (xem lý do ở `customWorkspace`
//    phía trên) — thiếu mount này thì mọi service dùng bind mount tương đối trong docker-compose.yml
//    (postgres, ...) sẽ nhận nhầm thư mục rỗng và crash-loop:
//      docker run -d --name jenkins \
//        -v /var/run/docker.sock:/var/run/docker.sock \
//        -v jenkins_home:/var/jenkins_home \
//        -v /Users/panchew/jenkins-workspace:/Users/panchew/jenkins-workspace \
//        -p 8080:8080 -p 50000:50000 jenkins-with-docker
//    (trên Windows dùng Docker Desktop, đường dẫn socket vẫn là /var/run/docker.sock nhờ WSL2 backend)
//    Container Jenkins cũng cần có sẵn docker CLI để chạy được các lệnh `sh 'docker ...'` — image
//    jenkins/jenkins gốc KHÔNG có sẵn, cần build lại image Jenkins có cài thêm docker-ce-cli
//    (hoặc dùng plugin "Docker Pipeline" kết hợp Dockerfile riêng cho Jenkins).

pipeline {
    // Jenkins chạy trong container, dùng chung socket Docker Desktop với host — mọi bind mount
    // tương đối trong docker-compose.yml (vd: "./postgresql.conf:...") được daemon Docker Desktop
    // (chạy NGOÀI container Jenkins) diễn giải theo đường dẫn HOST thật, không phải đường dẫn bên
    // trong container Jenkins. Nếu workspace nằm ở /var/jenkins_home/workspace/... (chỉ tồn tại
    // bên trong container) thì Docker Desktop sẽ không tìm thấy path đó trên host thật và tự tạo
    // nhầm 1 thư mục rỗng để mount vào, khiến ví dụ Postgres đọc "config file" rỗng rồi crash-loop.
    // => Ép workspace ra đúng /Users/panchew/jenkins-workspace/takypok-workflow, path này PHẢI được
    // mount vào container Jenkins ở đúng cùng đường dẫn khi chạy `docker run` (xem ghi chú #4).
    agent {
        node {
            label ''
            customWorkspace '/Users/panchew/jenkins-workspace/takypok-workflow'
        }
    }

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
                git branch: 'UAT',
                    url: 'https://github.com/paKymoK/Workflow.git',
                    credentialsId: 'jenkins-git'

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

        stage('Ensure Docker network') {
            steps {
                // discovery-service/docker-compose.yml khai báo mạng "takypok_default" là external.
                // Nếu INCLUDE_INFRA=false (postgres/redis/kafka chưa chạy để tự tạo mạng này),
                // tạo mạng rỗng ở đây để bước build dưới không lỗi "network not found".
                sh '''
                    docker network inspect takypok_default >/dev/null 2>&1 || docker network create takypok_default
                '''
            }
        }

        stage('Build discovery-service') {
            steps {
                // Chỉ build/chạy discovery-service (đang test riêng service này trước) —
                // muốn build full stack thì đổi sang `docker compose up -d --build` ở thư mục gốc.
                sh '''
                    cd discovery-service
                    docker compose up -d --build
                '''
            }
        }

        stage('Status') {
            steps {
                sh '''
                    echo "== Container discovery-service vừa build =="
                    cd discovery-service && docker compose ps
                    cd ..

                    echo ""
                    echo "== TOÀN BỘ container hiện có trên Docker Desktop (đúng những gì thấy trong giao diện) =="
                    docker ps -a --format "table {{.Names}}\\t{{.Image}}\\t{{.Status}}\\t{{.Ports}}"
                '''
            }
        }
    }

    post {
        success {
            echo "Build #${env.BUILD_NUMBER} thành công — discovery-service đã được (re)start."
            echo "Eureka dashboard: http://localhost:8761"
        }
        failure {
            echo "Build #${env.BUILD_NUMBER} thất bại — chạy 'cd discovery-service && docker compose logs --tail=100' để xem chi tiết."
        }
    }
}
