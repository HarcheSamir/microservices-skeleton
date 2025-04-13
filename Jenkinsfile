pipeline {
    agent any

    options {
        timestamps()
        disableConcurrentBuilds()
        timeout(time: 25, unit: 'MINUTES') // Increased timeout maybe needed
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
                sh "COMPOSE_PROJECT_NAME=prod docker compose -f docker-compose.prod.yml build --progress=plain"
                echo "Production images built successfully."
            }
        }

        // *** NEW STAGE TO RUN THE APPLICATION ***
        stage('Deploy/Run Application') {
            steps {
                echo "Starting application using docker-compose.prod.yml..."
                sh "COMPOSE_PROJECT_NAME=prod docker compose -f docker-compose.prod.yml down --remove-orphans || true"
                sh "COMPOSE_PROJECT_NAME=prod docker compose -f docker-compose.prod.yml up -d"
                echo "Application started."
            }
        }
    }

    post {
    
        success {
            // Changed message to reflect deployment
            echo "Application built and deployed successfully."
        }
        failure {
            echo "Pipeline build or deploy failed."
            // Optional: Still clean up on failure
            script {
                 echo "Attempting cleanup after failure..."
                 sh "COMPOSE_PROJECT_NAME=prod docker compose -f docker-compose.prod.yml down --remove-orphans || true"
            }
        }
    }
}