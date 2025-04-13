// Jenkinsfile (Ultra-Minimal: Build Only using docker-compose.prod.yml)
// Assumes docker-compose.prod.yml contains necessary config (now with dev secrets)

pipeline {
    agent any // Run on Jenkins node with Docker access

    options {
        wipeWorkspace()
        timestamps()
        disableConcurrentBuilds()
        timeout(time: 15, unit: 'MINUTES') // Timeout for build
    }

    stages {
        stage('Checkout') {
            steps {
                cleanWs()
                checkout scm // Get code from Git (configured in Jenkins job)
                echo "Code checked out."
            }
        }

        stage('Build Production Images') {
            steps {
                echo "Building production images using docker-compose.prod.yml..."
                // Use the production compose file ONLY to build
                // It will use the dev secrets within the file during build if needed
                sh "docker compose -f docker-compose.prod.yml build --progress=plain"
                echo "Production images built successfully."
            }
        }
    } // End of stages

    post {
        always {
            // Minimal cleanup for build process artifacts
            echo "Pipeline finished. Cleaning up build environment..."
             sh "docker compose -f docker-compose.prod.yml down --remove-orphans || true"
        }
        success {
            echo "Production images built successfully."
        }
        failure {
            echo "Pipeline build failed."
        }
    }
}