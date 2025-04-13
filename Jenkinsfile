pipeline {
    agent any

    options {
        timestamps()
        disableConcurrentBuilds()
        // Increased timeout might be needed for build + deploy + potential stabilization
        timeout(time: 25, unit: 'MINUTES')
    }

    stages {
        stage('Checkout') {
            steps {
                cleanWs()
                echo "Workspace cleaned."
                checkout scm
                echo "Code checked out from commit: ${scm.head_commit}"
            }
        }

        stage('Build Production Images') {
            steps {
                echo "Building production images using docker-compose.prod.yml..."
                // Build images using the prod file and prod project name
                sh "docker compose -p prod -f docker-compose.prod.yml build --progress=plain"
                echo "Production images built successfully."
            }
        }

        // ADD TESTING STAGE HERE (See Option 1)

        stage('Deploy Production Stack') {
            steps {
                echo "Deploying production stack using docker-compose.prod.yml..."
                // Ensure any previous version of the 'prod' stack is down
                // Use the specific project name and file
                sh "docker compose -p prod -f docker-compose.prod.yml down --remove-orphans || true"
                // Start the new version in detached mode
                sh "docker compose -p prod -f docker-compose.prod.yml up -d"
                echo "Production stack deployed."
                // Optional: Add a small sleep or health check verification here
                // sleep(15) // Wait briefly for services to initialize
                // sh "docker ps" // Show running containers
            }
        }
    }

    post {
        // No 'always { down }' - we want the deployed stack to stay running on success!
        success {
            echo "Pipeline finished: Production stack built and deployed successfully."
        }
        failure {
            echo "Pipeline failed during build or deploy."
            // Attempt to clean up the possibly broken 'prod' deployment on failure
            script {
                 echo "Attempting cleanup of 'prod' stack after failure..."
                 sh "docker compose -p prod -f docker-compose.prod.yml down --remove-orphans || true"
            }
        }
    }
}