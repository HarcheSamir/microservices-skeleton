pipeline {
    agent any

    options {
        timestamps()
        disableConcurrentBuilds()
        timeout(time: 15, unit: 'MINUTES')
    }

    stages {
        stage('Checkout') {
            steps {
                cleanWs()
                echo "Workspace cleaned."
                checkout scm
                echo "Code checked out."
            }
        }

        stage('Build Production Images') {
            steps {
                echo "Building production images using docker-compose.prod.yml..."
                sh "docker compose -f docker-compose.prod.yml build --progress=plain"
                echo "Production images built successfully."
            }
        }
    }

    post {
        always {
            script {
                echo "Pipeline finished. Cleaning up build environment..."
                sh "docker compose -f docker-compose.prod.yml down --remove-orphans || true"
            }
        }
        success {
            echo "Production images built successfully."
        }
        failure {
            echo "Pipeline build failed."
        }
    }
}