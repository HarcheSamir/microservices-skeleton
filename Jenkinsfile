// Jenkinsfile (Ultra-Minimal: Build Only - Corrected Workspace Cleanup)
// Assumes docker-compose.prod.yml contains necessary config (now with dev secrets)

pipeline {
    agent any // Run on Jenkins node with Docker access

    options {
        // --- wipeWorkspace() REMOVED FROM HERE ---
        timestamps()
        disableConcurrentBuilds()
        timeout(time: 15, unit: 'MINUTES') // Timeout for build
    }

    stages {
        stage('Checkout') {
            steps {
                // Clean the workspace BEFORE checking out code
                cleanWs()
                echo "Workspace cleaned."

                // Now checkout
                checkout scm // Get code from Git (configured in Jenkins job)
                echo "Code checked out."
            }
        }

        stage('Build Production Images') {
            steps {
                echo "Building production images using docker-compose.prod.yml..."
                // Use the production compose file ONLY to build
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
            // Optional: Clean workspace again after build if desired
            // cleanWs()
        }
        success {
            echo "Production images built successfully."
        }
        failure {
            echo "Pipeline build failed."
        }
    }
}