pipeline {
    agent {
        docker {
            image 'docker:24.0' // Using the official Docker image
            args '-v /var/run/docker.sock:/var/run/docker.sock -v /usr/bin/docker:/usr/bin/docker'
        }
    }

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
                // Install docker-compose first
                sh 'apk add --no-cache docker-compose py3-pip'
                // Then build with docker-compose
                sh "docker-compose -f docker-compose.prod.yml build --progress=plain"
                echo "Production images built successfully."
            }
        }
    }

    post {
        always {
            echo "Pipeline finished. Cleaning up build environment..."
            sh "docker-compose -f docker-compose.prod.yml down --remove-orphans || true"
        }
        success {
            echo "Production images built successfully."
        }
        failure {
            echo "Pipeline build failed."
        }
    }
}